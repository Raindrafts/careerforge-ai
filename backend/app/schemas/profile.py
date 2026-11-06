from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DegreeLevel(str, Enum):
    bachelors = "bachelors"
    masters = "masters"
    phd = "phd"
    diploma = "diploma"
    other = "other"


class SkillLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"
    expert = "expert"


class Skill(BaseModel):
    name: str
    level: SkillLevel = SkillLevel.intermediate
    category: str = "technical"  # technical | soft


class Project(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    technologies: List[str] = []
    role: str = ""
    duration: str = ""
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    highlights: List[str] = []


class Certification(BaseModel):
    id: Optional[str] = None
    name: str
    issuer: str
    issued_date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_url: Optional[str] = None


class Achievement(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    date: Optional[str] = None


class CareerGoal(BaseModel):
    target_role: str
    target_industry: str = ""
    experience_level: str = "entry"  # entry | mid | senior
    timeline_months: int = 12


class EducationInfo(BaseModel):
    institution: str
    degree: DegreeLevel = DegreeLevel.bachelors
    branch: str
    semester: Optional[int] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)


class StudentProfileCreate(BaseModel):
    education: EducationInfo
    technical_skills: List[Skill] = []
    soft_skills: List[Skill] = []
    certifications: List[Certification] = []
    projects: List[Project] = []
    achievements: List[Achievement] = []
    career_goals: List[CareerGoal] = []
    summary_bio: str = ""


class StudentProfileResponse(StudentProfileCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    profile_version: int = 1

    class Config:
        from_attributes = True
