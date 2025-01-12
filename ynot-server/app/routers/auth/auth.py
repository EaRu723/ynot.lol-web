from fastapi import APIRouter, HTTPException, Request, Response

from app.config import settings

router = APIRouter()


@router.get("/logout")
async def logout(request: Request, response: Response):
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
async def me(request: Request):
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"avatar": user.avatar, "email": user.email, "name": user.name}
