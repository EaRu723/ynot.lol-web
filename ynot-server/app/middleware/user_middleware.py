from fastapi import HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from starlette.middleware.base import (BaseHTTPMiddleware,
                                       RequestResponseEndpoint)
from starlette.responses import Response

from app.db.db import async_session
from app.models.models import User


class LoadUserMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        user_id = request.session.get("user_id")

        async with async_session() as db:
            if user_id:
                query = select(User).where(User.id == user_id)
                result = await db.execute(query)
                user = result.scalar()

                # Store the user in request.state for later use
                if user:
                    request.state.user = user
                else:
                    # If user_id is invalid, clear the session to avoid errors
                    request.session.clear()
                    request.state.user = None
            else:
                # If no user_id in session, mark the user as not logged in
                request.state.user = None

        return await call_next(request)


async def login_required(request: Request):
    if not request.state.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return request.state.user
