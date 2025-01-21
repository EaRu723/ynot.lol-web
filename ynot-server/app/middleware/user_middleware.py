from datetime import datetime, timezone

from fastapi import HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from starlette.middleware.base import (BaseHTTPMiddleware,
                                       RequestResponseEndpoint)
from starlette.responses import Response

from app.db.db import get_async_session
from app.models.models import UserSession


class LoadUserMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        session_token = request.session.get("session_token")

        if session_token:
            try:
                async for db in get_async_session():
                    query = (
                        select(UserSession)
                        .options(joinedload(UserSession.user))
                        .where(UserSession.session_token == session_token)
                    )
                    result = await db.execute(query)
                    session = result.scalar()

                    # Store the user in request.state for later use
                    if session and session.expires_at > datetime.now(timezone.utc):
                        request.state.session = session
                        request.state.user = session.user
                    else:
                        # If session_id is invalid, clear the session to avoid errors
                        request.session.clear()
                        request.state.session = None
                        request.state.user = None
            except Exception as e:
                print(f"Error loading session: {e}")
                request.state.session = None
                request.state.user = None
                raise HTTPException(status_code=500, detail="Error loading session")

        else:
            # If no session_id in session, mark the user as not logged in
            request.state.session = None
            request.state.user = None

        return await call_next(request)


async def login_required(request: Request) -> UserSession:
    if not request.state.session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return request.state.session
