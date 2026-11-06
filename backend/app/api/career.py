import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import verify_jwt
from app.schemas.career import CareerProfileRequest, CareerProfileAIOutput, CareerProfileResponse
from app.services import profile_service
from app.services.ai_service import generate_structured, build_student_context, AIServiceError
from app.db.client import get_supabase

router = APIRouter(prefix="/career", tags=["Career Profile"])


@router.post("/generate", summary="Generate AI career profile")
async def generate_career_profile(req: CareerProfileRequest, user=Depends(verify_jwt)):
    profile = await profile_service.get_profile_or_404(user["user_id"])
    context = build_student_context(profile)

    target = req.target_role or (
        profile.get("career_goals", [{}])[0].get("target_role", "Software Developer")
        if profile.get("career_goals") else "Software Developer"
    )

    prompt = f"""
Generate a complete career profile for a student targeting the role of: {target}
Writing style: {req.style.value}

Based ONLY on the verified student data in the context above, generate:
1. A compelling professional_summary (3-4 sentences, first person, factual)
2. A linkedin section with headline (under 220 chars) and about section (180-250 words)
3. A resume section with professional_summary, skills_section, project_descriptions (list of objects with title and description), and achievement_highlights
4. key_strengths (list of 5-7 specific strengths derived from their actual skills/projects)
5. career_narrative (one concise paragraph, first person, honest and grounded)
6. style_used matching the requested style
7. generation_notes: any suggestions for profile improvements (clearly labeled as suggestions, not facts)

Return JSON matching the schema exactly.
"""

    try:
        content = await generate_structured(prompt, CareerProfileAIOutput, context)
    except AIServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Persist to Supabase
    sb = get_supabase()
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "profile_version": profile.get("profile_version", 1),
        "style": req.style.value,
        "target_role": target,
        "content": content.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    sb.table("ai_career_profiles").insert(record).execute()
    return record


@router.get("/latest", summary="Get latest generated career profile")
async def get_latest_career_profile(user=Depends(verify_jwt)):
    sb = get_supabase()
    result = (
        sb.table("ai_career_profiles")
        .select("*")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return {"career_profile": None}
    return {"career_profile": result.data[0]}


@router.get("/history", summary="Get career profile generation history")
async def get_career_history(user=Depends(verify_jwt)):
    sb = get_supabase()
    result = (
        sb.table("ai_career_profiles")
        .select("id, style, target_role, profile_version, created_at")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return {"history": result.data}
