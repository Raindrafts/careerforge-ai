from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from app.db.client import get_supabase
from app.core.config import get_settings
import logging

security = HTTPBearer()
settings = get_settings()
logger = logging.getLogger(__name__)


async def verify_jwt(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Validate the active Supabase access token and return its user identity.

    Supabase projects may use asymmetric signing keys, so decoding only HS256
    tokens with the legacy JWT secret can reject an otherwise valid session.
    Delegating validation to Supabase supports either signing configuration.
    """
    token = credentials.credentials
    try:
        response = get_supabase().auth.get_user(token)
        user = response.user if response else None
        if not user or not user.id:
            raise ValueError("No user returned for access token")
        return {"user_id": user.id, "email": user.email or ""}
    except Exception as verification_error:
        # Local development can run without a backend-to-Supabase Auth route
        # (for example, behind a corporate proxy). The browser SDK has already
        # established the Supabase session; use its bearer claims only in this
        # explicitly configured development mode. Production never uses this
        # fallback.
        if settings.app_env.lower() == "development":
            try:
                claims = jwt.get_unverified_claims(token)
                user_id = claims.get("sub")
                if user_id:
                    logger.warning("Using development-only Supabase token fallback")
                    return {"user_id": user_id, "email": claims.get("email", "")}
            except JWTError:
                pass

        logger.warning("Supabase access-token validation failed: %s", verification_error)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token. Please sign in again.",
        )
