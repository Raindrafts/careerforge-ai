import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import verify_jwt
from app.schemas.interview import (
    InterviewStartRequest, AnswerSubmitRequest,
    InterviewQuestion, AnswerFeedback, AnswerFeedbackResponse,
    InterviewScoreSummary
)
from app.services import profile_service
from app.services.ai_service import generate_structured, build_student_context, AIServiceError, _call_gemini
from app.db.client import get_supabase
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/interview", tags=["Interview Prep"])


class QuestionsOutput(BaseModel):
    questions: List[InterviewQuestion]


class FeedbackOutput(BaseModel):
    feedback: AnswerFeedback


class SummaryOutput(BaseModel):
    summary: InterviewScoreSummary


@router.post("/start", summary="Start a mock interview session")
async def start_interview(req: InterviewStartRequest, user=Depends(verify_jwt)):
    profile = await profile_service.get_profile_or_404(user["user_id"])
    context = build_student_context(profile)

    prompt = f"""
Generate {req.num_questions} interview questions for: {req.target_role}
Interview type: {req.interview_type.value}

Return a JSON object with key "questions" containing a list of question objects.
Each question object must have:
- id: a unique string like "q1", "q2", etc.
- question: the interview question text
- type: "technical" or "hr" or "behavioral"
- difficulty: "easy" or "medium" or "hard"
- hint: an optional helpful hint (can be null)

For technical questions, focus on skills the student actually has from their profile.
For HR questions, focus on typical behavioral and situational questions.
Mix difficulty levels: some easy, some medium, some hard.
Make questions specific and role-relevant.
"""
    try:
        questions_data = await generate_structured(prompt, QuestionsOutput, context)
    except AIServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))

    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    sb = get_supabase()

    session = {
        "id": session_id,
        "user_id": user["user_id"],
        "target_role": req.target_role,
        "interview_type": req.interview_type.value,
        "questions": [q.model_dump() for q in questions_data.questions],
        "answers": [],
        "status": "active",
        "score_summary": None,
        "created_at": now,
        "completed_at": None,
    }
    sb.table("interview_sessions").insert(session).execute()
    return session


@router.post("/submit", summary="Submit answer and get AI feedback")
async def submit_answer(req: AnswerSubmitRequest, user=Depends(verify_jwt)):
    sb = get_supabase()
    result = (
        sb.table("interview_sessions")
        .select("*")
        .eq("id", req.session_id)
        .eq("user_id", user["user_id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Interview session not found")

    session = result.data[0]
    questions = session["questions"]
    question_obj = next((q for q in questions if q["id"] == req.question_id), None)
    if not question_obj:
        raise HTTPException(status_code=404, detail="Question not found in session")

    prompt = f"""
You are evaluating an interview answer for: {session['target_role']}

Question: {question_obj['question']}
Question Type: {question_obj['type']}
Difficulty: {question_obj['difficulty']}

Candidate's Answer: {req.answer}

Return a JSON object with key "feedback" containing:
- score: float 0-10 (be fair and specific)
- strengths: list of 2-3 things done well (strings)
- improvements: list of 2-3 specific improvements (strings)
- model_answer_outline: a brief outline of an ideal answer (2-3 sentences)
- detailed_feedback: 3-4 sentence comprehensive feedback

Be constructive, specific, and encouraging. Reference what the candidate actually said.
"""
    try:
        feedback_data = await generate_structured(prompt, FeedbackOutput, "")
    except AIServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Store answer
    answers = session.get("answers", [])
    answers.append({
        "question_id": req.question_id,
        "answer": req.answer,
        "feedback": feedback_data.feedback.model_dump(),
    })

    # Check if all questions answered
    is_complete = len(answers) >= len(questions)
    update_data = {"answers": answers}

    if is_complete:
        # Generate summary
        total_score = sum(a["feedback"]["score"] for a in answers)
        max_score = len(questions) * 10
        percentage = (total_score / max_score) * 100 if max_score > 0 else 0
        grade = "A" if percentage >= 90 else "B" if percentage >= 75 else "C" if percentage >= 60 else "D" if percentage >= 50 else "F"

        summary_prompt = f"""
Generate an overall interview performance summary.

Role: {session['target_role']}
Questions answered: {len(answers)}
Scores: {[a['feedback']['score'] for a in answers]}
Total percentage: {percentage:.1f}%

Return JSON with key "summary" containing:
- total_score: {total_score:.1f}
- max_score: {max_score}
- percentage: {percentage:.1f}
- grade: "{grade}"
- overall_feedback: 2-3 sentences overall assessment
- top_strengths: list of 3 top strengths shown
- key_improvements: list of 3 most important improvements
"""
        try:
            summary_data = await generate_structured(summary_prompt, SummaryOutput, "")
            update_data["score_summary"] = summary_data.summary.model_dump()
        except AIServiceError:
            update_data["score_summary"] = {
                "total_score": total_score,
                "max_score": max_score,
                "percentage": percentage,
                "grade": grade,
                "overall_feedback": "Interview completed.",
                "top_strengths": [],
                "key_improvements": [],
            }

        update_data["status"] = "completed"
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()

    sb.table("interview_sessions").update(update_data).eq("id", req.session_id).execute()

    return AnswerFeedbackResponse(
        question_id=req.question_id,
        question=question_obj["question"],
        answer=req.answer,
        feedback=feedback_data.feedback,
        session_id=req.session_id,
    )


@router.get("/sessions", summary="Get interview session history")
async def get_sessions(user=Depends(verify_jwt)):
    sb = get_supabase()
    result = (
        sb.table("interview_sessions")
        .select("id, target_role, interview_type, status, score_summary, created_at, completed_at")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return {"sessions": result.data}


@router.get("/{session_id}", summary="Get interview session detail")
async def get_session(session_id: str, user=Depends(verify_jwt)):
    sb = get_supabase()
    result = (
        sb.table("interview_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", user["user_id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session": result.data[0]}
