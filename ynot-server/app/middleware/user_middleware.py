from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from fastapi import HTTPException, Request

from app.models import OAuthSession
from app.db.db import async_session


class LoadUserMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        user_did = request.session.get("user_did")

        async with async_session() as db:
            if user_did:
                query = select(OAuthSession).where(OAuthSession.did == user_did)
                result = await db.execute(query)
                user = result.scalar()
                request.state.user = user
            else:
                request.state.user = None

        return await call_next(request)

async def login_required(request: Request):
    if not request.state.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return request.state.user