import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import verify_jwt
from app.schemas.roadmap import RoadmapRequest, RoadmapAIOutput, RoadmapProgressUpdate
from app.services import profile_service
from app.services.ai_service import generate_structured, build_student_context, AIServiceError
from app.db.client import get_supabase

router = APIRouter(prefix="/roadmap", tags=["Learning Roadmap"])


@router.post("/generate", summary="Generate personalized learning roadmap")
async def generate_roadmap(req: RoadmapRequest, user=Depends(verify_jwt)):
    profile = await profile_service.get_profile_or_404(user["user_id"])
    context = build_student_context(profile)

    prompt = f"""
Create a detailed {req.duration_weeks}-week personalized learning roadmap for:
Target Role: {req.target_role}
Level: {req.target_level}

Based ONLY on the verified student profile above, generate:

1. weekly_plans: exactly {req.duration_weeks} weeks, each with:
   - week (number)
   - theme (e.g., "Python Fundamentals")
   - goal (what they'll achieve this week)
   - tasks: list of exactly 2 focused tasks, each with {{task, duration_hours, resource_url (optional)}}
   - milestone (what they can show/demonstrate at week end)
   - completed: false

2. skill_priorities: ordered list of skills to learn, each with:
   - skill, prerequisite_skills (list), weeks_needed, importance (critical/high/medium/low)

3. project_recommendations: 3 portfolio projects appropriate for this role, each with:
   - title, description, technologies (list), difficulty, estimated_days, github_topics

4. success_metrics: 4 measurable criteria to know the roadmap is complete

5. roadmap_summary: 2-3 sentence overview

Focus on their specific skill gaps. Build on what they already know.
Resources should be real and specific (Coursera, freeCodeCamp, official docs, etc.).
"""
    try:
        content = await generate_structured(prompt, RoadmapAIOutput, context)
    except AIServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))

    sb = get_supabase()
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "target_role": req.target_role,
        "target_level": req.target_level,
        "duration_weeks": req.duration_weeks,
        "content": content.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    sb.table("learning_roadmaps").insert(record).execute()
    return record


@router.get("/latest", summary="Get latest roadmap")
async def get_latest_roadmap(user=Depends(verify_jwt)):
    sb = get_supabase()
    result = (
        sb.table("learning_roadmaps")
        .select("*")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return {"roadmap": result.data[0] if result.data else None}


@router.patch("/progress", summary="Update week completion status")
async def update_progress(update: RoadmapProgressUpdate, user=Depends(verify_jwt)):
    sb = get_supabase()
    # Get latest roadmap
    result = (
        sb.table("learning_roadmaps")
        .select("id, content")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No roadmap found")

    roadmap = result.data[0]
    content = roadmap["content"]
    for week in content.get("weekly_plans", []):
        if week["week"] == update.week:
            week["completed"] = update.completed
            break

    sb.table("learning_roadmaps").update({"content": content}).eq("id", roadmap["id"]).execute()
    return {"message": f"Week {update.week} marked as {'completed' if update.completed else 'incomplete'}"}
