from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class WritingStyle(str, Enum):
    professional = "professional"
    creative = "creative"
    technical = "technical"
    concise = "concise"


class CareerProfileRequest(BaseModel):
    style: WritingStyle = WritingStyle.professional
    target_role: Optional[str] = None


class LinkedInContent(BaseModel):
    headline: str
    about: str


class ResumeContent(BaseModel):
    professional_summary: str
    skills_section: str
    project_descriptions: List[dict]
    achievement_highlights: List[str]


class CareerProfileAIOutput(BaseModel):
    professional_summary: str
    linkedin: LinkedInContent
    resume: ResumeContent
    key_strengths: List[str]
    career_narrative: str
    style_used: WritingStyle
    generation_notes: str = ""


class CareerProfileResponse(BaseModel):
    id: str
    user_id: str
    profile_version: int
    style: WritingStyle
    target_role: Optional[str]
    content: CareerProfileAIOutput
    created_at: datetime

    class Config:
        from_attributes = True
