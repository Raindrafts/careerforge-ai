from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class RoadmapRequest(BaseModel):
    target_role: str
    target_level: str = "entry"
    duration_weeks: int = 12


class WeeklyTask(BaseModel):
    day: Optional[str] = None
    task: str
    duration_hours: float = 1.0
    resource_url: Optional[str] = None


class WeeklyPlan(BaseModel):
    week: int
    theme: str
    goal: str
    tasks: List[WeeklyTask]
    milestone: str
    completed: bool = False


class SkillPriority(BaseModel):
    skill: str
    prerequisite_skills: List[str] = []
    weeks_needed: int
    importance: str  # critical | high | medium | low


class ProjectRecommendation(BaseModel):
    title: str
    description: str
    technologies: List[str]
    difficulty: str  # beginner | intermediate | advanced
    estimated_days: int
    github_topics: List[str] = []


class RoadmapAIOutput(BaseModel):
    target_role: str
    target_level: str
    total_weeks: int
    weekly_plans: List[WeeklyPlan]
    skill_priorities: List[SkillPriority]
    project_recommendations: List[ProjectRecommendation]
    success_metrics: List[str]
    roadmap_summary: str


class RoadmapProgressUpdate(BaseModel):
    week: int
    completed: bool


class RoadmapResponse(BaseModel):
    id: str
    user_id: str
    target_role: str
    target_level: str
    duration_weeks: int
    content: RoadmapAIOutput
    created_at: datetime

    class Config:
        from_attributes = True
