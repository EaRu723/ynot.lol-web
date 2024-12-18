from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.routers import api, user
from app.routers.oauth import oauth
from app.config import settings
from app.middleware.user_middleware import LoadUserMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ynot.lol",
        "http://localhost:5173",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    LoadUserMiddleware
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    session_cookie="cookie"
)


# app.include_router(views.router)
app.include_router(api.router, prefix="/api")
app.include_router(oauth.router, prefix="/api/oauth")
app.include_router(user.router, prefix="/api/user")