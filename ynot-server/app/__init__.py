from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import api, views
from app.db.db import engine, async_session

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(views.router)
app.include_router(api.router, prefix="/api", tags=["api"])

# Mount static files directory
app.mount("/static", StaticFiles(directory="app/static"), name="static")

