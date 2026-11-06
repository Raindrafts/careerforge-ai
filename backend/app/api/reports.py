import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from app.core.security import verify_jwt
from app.services import profile_service, pdf_service
from app.db.client import get_supabase

router = APIRouter(prefix="/reports", tags=["Reports"])


def _career_pdf_headers(filename: str):
    return {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Type": "application/pdf",
    }


@router.post("/career-profile/pdf", summary="Download career profile as PDF")
async def career_profile_pdf(user=Depends(verify_jwt)):
    sb = get_supabase()
    profile = await profile_service.get_profile_or_404(user["user_id"])

    result = (
        sb.table("ai_career_profiles")
        .select("*")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No career profile generated yet.")

    career = result.data[0]
    pdf_bytes = pdf_service.generate_career_profile_pdf(profile, career["content"])

    _save_report(user["user_id"], "career_profile", career["id"], sb)
    return Response(content=pdf_bytes, media_type="application/pdf",
                    headers={"Content-Disposition": 'attachment; filename="career-profile.pdf"'})


@router.post("/skill-gap/pdf", summary="Download skill gap analysis as PDF")
async def skill_gap_pdf(user=Depends(verify_jwt)):
    sb = get_supabase()
    profile = await profile_service.get_profile_or_404(user["user_id"])

    result = (
        sb.table("skill_gap_analyses")
        .select("*")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No skill gap analysis found.")

    analysis = result.data[0]
    pdf_bytes = pdf_service.generate_skill_gap_pdf(profile, analysis["content"])

    _save_report(user["user_id"], "skill_gap", analysis["id"], sb)
    return Response(content=pdf_bytes, media_type="application/pdf",
                    headers={"Content-Disposition": 'attachment; filename="skill-gap-analysis.pdf"'})


@router.post("/roadmap/pdf", summary="Download learning roadmap as PDF")
async def roadmap_pdf(user=Depends(verify_jwt)):
    sb = get_supabase()
    profile = await profile_service.get_profile_or_404(user["user_id"])

    result = (
        sb.table("learning_roadmaps")
        .select("*")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No roadmap found.")

    roadmap = result.data[0]
    pdf_bytes = pdf_service.generate_roadmap_pdf(profile, roadmap["content"])

    _save_report(user["user_id"], "roadmap", roadmap["id"], sb)
    return Response(content=pdf_bytes, media_type="application/pdf",
                    headers={"Content-Disposition": 'attachment; filename="learning-roadmap.pdf"'})


@router.get("/", summary="Get report history")
async def get_reports(user=Depends(verify_jwt)):
    sb = get_supabase()
    result = (
        sb.table("report_history")
        .select("*")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return {"reports": result.data}


def _save_report(user_id: str, report_type: str, source_id: str, sb):
    try:
        sb.table("report_history").insert({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "report_type": report_type,
            "source_id": source_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        pass  # Non-critical logging
