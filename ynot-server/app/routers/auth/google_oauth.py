from atproto_identity.handle.resolver import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.db import get_async_session
from app.models.models import User
from app.schemas.schemas import GoogleAuthRequest

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

GOOGLE_CLIENT_ID = settings.google_client_id
GOOGLE_CLIENT_SECRET = settings.google_client_secret
GOOGLE_REDIRECT_URI = settings.google_redirect_uri
GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"


@router.post("/callback")
async def auth_google(
    request: Request,
    auth_request: GoogleAuthRequest,
    db: AsyncSession = Depends(get_async_session),
):
    # Verify Google ID token
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_TOKEN_INFO_URL, params={"id_token": auth_request.id_token}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google ID token")

        payload = response.json()

    # Check if token audience matches client ID
    if payload["aud"] != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Invalid Google ID token audience")

    # Extract user information
    google_id = payload["sub"]
    email = payload["email"]
    name = payload.get("name", "")
    avatar = payload.get("picture", "")

    # Authenticate or register the user
    query = select(User).where(User.google_id == google_id)
    result = await db.execute(query)
    user = result.scalar()
    if not user:
        # Register a new user
        user = User(google_id=google_id, email=email, name=name, avatar=avatar)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    request.session["user_id"] = user.id

    return {
        "message": "Login successful",
        "name": name,
        "email": email,
        "profile_complete": user.is_profile_complete,
    }
