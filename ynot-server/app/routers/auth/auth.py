import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config import settings
from app.db.db import get_async_session
from app.middleware.user_middleware import login_required
from app.models.models import User, UserSession
from app.schemas.schemas import (GetOwnIdDataRequest, GetSessionRequest,
                                 LoginRequest, RegistrationRequest,
                                 SetOwnIdDataRequest)

router = APIRouter()


async def create_session(
    user_id,
    ip_address=None,
    user_agent=None,
    db: AsyncSession = Depends(get_async_session),
):
    session_token = secrets.token_hex(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)  # 7 day expiry
    # TODO make this match prod/dev expiry set in __init__.py SessionMiddleware

    new_session = UserSession(
        session_token=session_token,
        user_id=user_id,
        created_at=datetime.now(),
        expires_at=expires_at,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    try:
        db.add(new_session)
        await db.commit()
    except Exception as e:
        print(e)

    return session_token


def verify_ownid_signature(request: Request, body: str) -> bool:
    ownid_signature = request.headers.get("ownid-signature")
    ownid_timestamp = request.headers.get("ownid-timestamp")

    if not ownid_signature or not ownid_timestamp:
        return False

    # Verify timestamp is within the acceptable window (1 minute)
    timestamp_datetime = datetime.utcfromtimestamp(int(ownid_timestamp) / 1000)
    if abs((datetime.utcnow() - timestamp_datetime).total_seconds()) > 60:
        return False

    # Create the data string to sign
    data_to_sign = f"{body}.{ownid_timestamp}"

    # Compute HMAC-SHA256 signature
    secret = base64.b64decode(settings.ownid_shared_secret)
    computed_signature = hmac.new(
        secret, data_to_sign.encode("utf-8"), hashlib.sha256
    ).digest()
    computed_signature_base64 = base64.b64encode(computed_signature).decode("utf-8")

    # Compare computed signature with the provided signature
    return hmac.compare_digest(computed_signature_base64, ownid_signature)


@router.post("/register")
async def register(
    request: RegistrationRequest, db: AsyncSession = Depends(get_async_session)
):
    # Check if loginId is already registered
    query = select(User).where(User.login_id == request.loginId)
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=400, detail="Already registered with this login ID"
        )

    # Create a new user
    new_user = User(
        login_id=request.loginId,
        email=request.email,
        ownid_data=request.ownIdData,
        avatar="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg",
    )

    try:
        db.add(new_user)
        await db.commit()
        return {"message": "User registered successfully", "user_id": new_user.id}
    except Exception as e:
        print(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail="Failed to register user")


@router.post("/login")
async def login(
    request: Request,
    login_request: LoginRequest,
    db: AsyncSession = Depends(get_async_session),
):
    """
    Sets a session cookie, verifying OwnID data and a session token from /getSessionByLoginId.
    """
    # Fetch session and user
    query = (
        select(UserSession)
        .options(joinedload(UserSession.user))
        .where(UserSession.session_token == login_request.token)
    )
    result = await db.execute(query)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Validate OwnID data
    if session.user.ownid_data != login_request.ownIdData:
        raise HTTPException(status_code=401, detail="Invalid OwnID authentication data")

    request.session["session_token"] = session.session_token

    return {
        "message": "Login successful",
        "user": {
            "id": session.user.id,
            "username": session.user.username,
            "email": session.user.email,
            "avatar": session.user.avatar,
            "banner": session.user.banner,
            "profile_complete": session.user.is_profile_complete,
        },
    }


@router.get("/logout")
async def logout(
    request: Request, response: Response, db: AsyncSession = Depends(get_async_session)
):
    session_token = request.session.get("session_token")
    if not session_token:
        raise HTTPException(status_code=400, detail="No session token found")

    # Invalidate session in database
    result = await db.execute(
        update(UserSession)
        .where(UserSession.session_token == session_token)
        .values(is_active=False, expires_at=datetime.now(timezone.utc))
    )
    if result.rowcount == 0:
        # No session matched the given token
        raise HTTPException(status_code=400, detail="Invalid session token")

    await db.commit()

    if settings.app_env == "development":
        response.delete_cookie(
            key="session",
            path="/",
            domain="127.0.0.1",
        )
    elif settings.app_env == "production":
        response.delete_cookie(
            key="session",
            path="/",
            domain="ynot.lol",
        )

    request.session.clear()

    return {"message": "Logged out"}


@router.get("/me")
async def me(session=Depends(login_required)):
    return {
        "avatar": session.user.avatar,
        "email": session.user.email,
        "username": session.user.username,
        "profile_complete": session.user.is_profile_complete,
    }


@router.post("/setOwnIDDataByLoginId")
async def set_ownid_data_by_login_id(
    request: Request,
    data_request: SetOwnIdDataRequest,
    db: AsyncSession = Depends(get_async_session),
):
    body = await request.body()
    if not verify_ownid_signature(request, body.decode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid signature")

    query = select(User).where(User.login_id == data_request.loginId)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.ownid_data = data_request.ownIdData
    await db.commit()

    return {"message": "ownIdData set successfully"}


@router.post("/getOwnIDDataByLoginId")
async def get_ownid_data_by_login_id(
    request: Request,
    data_request: GetOwnIdDataRequest,
    db: AsyncSession = Depends(get_async_session),
):
    body = await request.body()
    if not verify_ownid_signature(request, body.decode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid signature")

    query = select(User).where(User.login_id == data_request.loginId)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404)

    return {"ownidData": user.ownid_data}


@router.post("/getSessionByLoginId")
async def get_session_by_login_id(
    request: Request,
    auth_request: GetSessionRequest,
    db: AsyncSession = Depends(get_async_session),
):
    """
    This endpoint is hit on submission of OwnID frontend login component. We validate the request's OwnID headers
    and create a session for the user. This session can be retrieved from the /login endpoint. We do not set the
    session here at this is a server-to-server request sent by OwnID servers. We are unable to set cookies in the client
    from this endpoint.
    """
    body = await request.body()
    if not verify_ownid_signature(request, body.decode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid signature")

    query = select(User).where(User.login_id == auth_request.loginId)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    session_token = await create_session(
        user_id=user.id,
        ip_address=request.client.host,
        user_agent=request.headers.get("User-Agent"),
        db=db,
    )

    """
    Note that token is a unique session identifier that you generate.
    OwnID does not validate or use the token in any way, it merely passes 
    the token back to you so you can identify the session it’s associated with.
    """
    return {
        "message": "Session set successfully",
        "ownid_data": user.ownid_data,
        "token": session_token,
    }
