from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class SkillGapRequest(BaseModel):
    target_role: str
    target_level: str = "entry"  # entry | mid | senior


class SkillMatch(BaseModel):
    skill: str
    category: str
    student_level: Optional[str] = None
    required_level: str
    matched: bool
    gap_description: str = ""


class ReadinessBreakdown(BaseModel):
    technical_skills_score: float = Field(ge=0, le=50)
    soft_skills_score: float = Field(ge=0, le=20)
    project_relevance_score: float = Field(ge=0, le=20)
    education_fit_score: float = Field(ge=0, le=10)
    total_score: float = Field(ge=0, le=100)
    interpretation: str


class LearningResource(BaseModel):
    title: str
    type: str  # course | book | tutorial | practice
    url: Optional[str] = None
    duration: Optional[str] = None
    priority: int = 1  # 1=high, 2=medium, 3=low


class SkillGapAIOutput(BaseModel):
    target_role: str
    target_level: str
    readiness: ReadinessBreakdown
    matched_skills: List[SkillMatch]
    missing_skills: List[SkillMatch]
    priority_gaps: List[str]
    strengths: List[str]
    recommendations: List[str]
    top_resources: List[LearningResource]
    analysis_summary: str


class SkillGapResponse(BaseModel):
    id: str
    user_id: str
    target_role: str
    target_level: str
    content: SkillGapAIOutput
    created_at: datetime

    class Config:
        from_attributes = True
