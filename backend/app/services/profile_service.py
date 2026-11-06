"""Profile CRUD service using Supabase."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from app.db.client import get_supabase
from app.schemas.profile import StudentProfileCreate, StudentProfileResponse
import logging

logger = logging.getLogger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def get_profile(user_id: str) -> Optional[dict]:
    sb = get_supabase()
    result = (
        sb.table("student_profiles")
        .select("*")
        .eq("user_id", user_id)
        .order("profile_version", desc=True)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]
    return None


async def upsert_profile(user_id: str, data: StudentProfileCreate) -> dict:
    sb = get_supabase()
    existing = await get_profile(user_id)
    now = _now()

    payload = {
        "user_id": user_id,
        "education": data.education.model_dump(),
        "technical_skills": [s.model_dump() for s in data.technical_skills],
        "soft_skills": [s.model_dump() for s in data.soft_skills],
        "certifications": [c.model_dump() for c in data.certifications],
        "projects": [p.model_dump() for p in data.projects],
        "achievements": [a.model_dump() for a in data.achievements],
        "career_goals": [g.model_dump() for g in data.career_goals],
        "summary_bio": data.summary_bio,
        "updated_at": now,
    }

    if existing:
        payload["profile_version"] = existing.get("profile_version", 1) + 1
        result = (
            sb.table("student_profiles")
            .update(payload)
            .eq("id", existing["id"])
            .execute()
        )
    else:
        payload["id"] = str(uuid.uuid4())
        payload["created_at"] = now
        payload["profile_version"] = 1
        result = sb.table("student_profiles").insert(payload).execute()

    return result.data[0]


async def get_profile_or_404(user_id: str) -> dict:
    from fastapi import HTTPException
    profile = await get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete your profile first.")
    return profile
