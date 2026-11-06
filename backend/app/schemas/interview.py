from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class InterviewType(str, Enum):
    technical = "technical"
    hr = "hr"
    mixed = "mixed"


class InterviewStartRequest(BaseModel):
    target_role: str
    interview_type: InterviewType = InterviewType.mixed
    num_questions: int = Field(default=5, ge=3, le=10)


class InterviewQuestion(BaseModel):
    id: str
    question: str
    type: str  # technical | hr | behavioral
    difficulty: str  # easy | medium | hard
    hint: Optional[str] = None


class AnswerSubmitRequest(BaseModel):
    session_id: str
    question_id: str
    answer: str


class AnswerFeedback(BaseModel):
    score: float = Field(ge=0, le=10)
    strengths: List[str]
    improvements: List[str]
    model_answer_outline: str
    detailed_feedback: str


class InterviewScoreSummary(BaseModel):
    total_score: float
    max_score: float
    percentage: float
    grade: str  # A | B | C | D | F
    overall_feedback: str
    top_strengths: List[str]
    key_improvements: List[str]


class InterviewSessionResponse(BaseModel):
    id: str
    user_id: str
    target_role: str
    interview_type: InterviewType
    questions: List[InterviewQuestion]
    status: str  # active | completed
    score_summary: Optional[InterviewScoreSummary] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AnswerFeedbackResponse(BaseModel):
    question_id: str
    question: str
    answer: str
    feedback: AnswerFeedback
    session_id: str
