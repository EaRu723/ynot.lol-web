import os

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
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
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.add_middleware(
    LoadUserMiddleware
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    session_cookie="cookie",
    same_site="Lax",
    domain="127.0.0.1",
    https_only=False, # TODO set True in production for https
    max_age=3600 * 24 * 7 # Session expires in 7 days
)


# app.include_router(views.router)
app.include_router(api.router, prefix="/api")
app.include_router(oauth.router, prefix="/api/oauth")
app.include_router(user.router, prefix="/api/user")

app.mount("/assets", StaticFiles(directory="y-frontend/dist/assets"), name="static")

@app.get("/{full_path:path}")
async def serve_static(full_path: str):
    file_path = os.path.join("y-frontend/dist", full_path)

    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    return FileResponse("y-frontend/dist/index.html")
