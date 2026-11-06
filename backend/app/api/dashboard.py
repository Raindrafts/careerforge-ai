from fastapi import APIRouter, Depends
from app.core.security import verify_jwt
from app.services import profile_service
from app.db.client import get_supabase

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview", summary="Get dashboard overview data")
async def dashboard_overview(user=Depends(verify_jwt)):
    sb = get_supabase()
    uid = user["user_id"]

    profile = await profile_service.get_profile(uid)

    # Latest skill gap
    sg_result = (
        sb.table("skill_gap_analyses")
        .select("target_role, content, created_at")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    latest_analysis = sg_result.data[0] if sg_result.data else None

    # Latest roadmap
    rm_result = (
        sb.table("learning_roadmaps")
        .select("target_role, duration_weeks, content, created_at")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    latest_roadmap = rm_result.data[0] if rm_result.data else None

    # Interview sessions count
    interview_result = (
        sb.table("interview_sessions")
        .select("id, score_summary, status")
        .eq("user_id", uid)
        .eq("status", "completed")
        .execute()
    )
    sessions = interview_result.data or []

    # Career profiles count
    cp_result = (
        sb.table("ai_career_profiles")
        .select("id, target_role, created_at")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )

    # Compute stats
    readiness_score = None
    if latest_analysis:
        readiness_score = latest_analysis["content"].get("readiness", {}).get("total_score")

    completed_weeks = 0
    total_weeks = 0
    if latest_roadmap:
        plans = latest_roadmap["content"].get("weekly_plans", [])
        total_weeks = len(plans)
        completed_weeks = sum(1 for w in plans if w.get("completed"))

    avg_interview_score = None
    if sessions:
        scores = [
            s["score_summary"]["percentage"]
            for s in sessions
            if s.get("score_summary") and "percentage" in s["score_summary"]
        ]
        if scores:
            avg_interview_score = round(sum(scores) / len(scores), 1)

    skill_counts = {
        "technical": len(profile.get("technical_skills", [])) if profile else 0,
        "soft": len(profile.get("soft_skills", [])) if profile else 0,
    }

    return {
        "profile_complete": profile is not None,
        "readiness_score": readiness_score,
        "latest_target_role": latest_analysis["target_role"] if latest_analysis else None,
        "roadmap_progress": {
            "completed": completed_weeks,
            "total": total_weeks,
            "percentage": round(completed_weeks / total_weeks * 100, 1) if total_weeks > 0 else 0,
        },
        "interview_stats": {
            "total_sessions": len(sessions),
            "avg_score": avg_interview_score,
        },
        "skill_counts": skill_counts,
        "recent_career_profiles": cp_result.data,
        "career_goals": profile.get("career_goals", []) if profile else [],
    }
