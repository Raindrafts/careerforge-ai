from fastapi import APIRouter, Depends
from app.core.security import verify_jwt
from app.schemas.profile import StudentProfileCreate, StudentProfileResponse
from app.services import profile_service

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/me", summary="Get current user's profile")
async def get_my_profile(user=Depends(verify_jwt)):
    profile = await profile_service.get_profile(user["user_id"])
    if not profile:
        return {"profile": None, "message": "No profile found. Please create your profile."}
    return {"profile": profile}


@router.post("/", summary="Create or update profile")
async def upsert_profile(data: StudentProfileCreate, user=Depends(verify_jwt)):
    profile = await profile_service.upsert_profile(user["user_id"], data)
    return {"profile": profile, "message": "Profile saved successfully."}
