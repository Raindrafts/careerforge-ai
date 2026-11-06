import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import verify_jwt
from app.schemas.skill_gap import SkillGapRequest, SkillGapAIOutput, SkillGapResponse
from app.services import profile_service
from app.services.ai_service import generate_structured, build_student_context, AIServiceError
from app.db.client import get_supabase

router = APIRouter(prefix="/skill-gap", tags=["Skill Gap"])

PREDEFINED_ROLES = [
    "Software Engineer", "Frontend Developer", "Backend Developer",
    "Full Stack Developer", "Data Scientist", "Machine Learning Engineer",
    "DevOps Engineer", "Cloud Architect", "Cybersecurity Analyst",
    "Mobile Developer", "Product Manager", "UI/UX Designer",
    "Data Analyst", "AI Engineer", "Blockchain Developer",
]


@router.get("/roles", summary="Get predefined target roles")
async def get_roles():
    return {"roles": PREDEFINED_ROLES}


@router.post("/analyze", summary="Run AI skill gap analysis")
async def analyze_skill_gap(req: SkillGapRequest, user=Depends(verify_jwt)):
    profile = await profile_service.get_profile_or_404(user["user_id"])
    context = build_student_context(profile)

    prompt = f"""
Perform a comprehensive skill gap analysis for this student targeting: {req.target_role} ({req.target_level} level)

Based ONLY on the verified student data above, analyze:

1. readiness: Calculate a transparent score using this exact formula:
   - technical_skills_score: (matched_tech_skills / total_required_tech_skills) * 50  [max 50]
   - soft_skills_score: (matched_soft_skills / total_required_soft_skills) * 20  [max 20]  
   - project_relevance_score: how relevant their projects are to the role, 0-20  [max 20]
   - education_fit_score: how well their degree/branch fits, 0-10  [max 10]
   - total_score: sum of all above
   - interpretation: plain English explanation of the score

2. matched_skills: list of skills the student HAS that are required for this role
   Each: {{skill, category, student_level, required_level, matched: true, gap_description}}

3. missing_skills: list of skills required for the role that the student LACKS
   Each: {{skill, category, student_level: null, required_level, matched: false, gap_description}}

4. priority_gaps: top 4 most critical missing skills (strings)

5. strengths: top 4 things the student already has going for them (strings)

6. recommendations: 4 actionable steps (strings)

7. top_resources: 4 specific learning resources for the most critical gaps
   Each: {{title, type, url (optional, only real URLs), duration, priority}}

8. analysis_summary: 2-3 sentence executive summary

Keep every list concise (at most 8 matched skills and 8 missing skills). Use real skill names and reference actual projects/skills from the profile.
"""
    try:
        content = await generate_structured(prompt, SkillGapAIOutput, context)
    except AIServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))

    sb = get_supabase()
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "target_role": req.target_role,
        "target_level": req.target_level,
        "content": content.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    sb.table("skill_gap_analyses").insert(record).execute()
    return record


@router.get("/latest", summary="Get latest skill gap analysis")
async def get_latest(user=Depends(verify_jwt)):
    sb = get_supabase()
    result = (
        sb.table("skill_gap_analyses")
        .select("*")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return {"analysis": result.data[0] if result.data else None}
