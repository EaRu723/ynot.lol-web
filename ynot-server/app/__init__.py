import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
from app.db.lsd import lsd
from app.middleware.user_middleware import LoadUserMiddleware
from app.routers import api, user
from app.routers.auth import auth, google_oauth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize psycopg2 pool in a separate thread
    await asyncio.to_thread(lsd.connect)
    yield
    # Clean up the pool on shutdown
    await asyncio.to_thread(lsd.disconnect)


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ynot.lol",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.add_middleware(LoadUserMiddleware)

if settings.app_env == "development":
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.session_secret,
        session_cookie="session",
        same_site="lax",
        domain="127.0.0.1",
        https_only=False,
        max_age=3600 * 24 * 7,  # Session expires in 7 days
    )
elif settings.app_env == "production":
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.session_secret,
        session_cookie="session",
        same_site="lax",
        domain="ynot.lol",
        https_only=True,
        max_age=3600 * 24 * 14,  # Session expires in 14 days
    )


# app.include_router(views.router)
app.include_router(api.router, prefix="/api")
app.include_router(user.router, prefix="/api/user")
app.include_router(auth.router, prefix="/api/auth")
app.include_router(google_oauth.router, prefix="/api/auth/google")


# Load static React files
app.mount("/static", StaticFiles(directory="y-frontend/dist/assets"), name="static")


@app.get("/{full_path:path}")
async def serve_static(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="API route not found")

    file_path = os.path.join("y-frontend/dist", full_path)

    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    return FileResponse("y-frontend/dist/index.html")
