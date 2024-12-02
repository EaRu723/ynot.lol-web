from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import api, views, user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ynot.lol", "http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(views.router)
app.include_router(api.router)
app.include_router(user.router, prefix="/user")

# Mount React static files directory
# app.mount("/", StaticFiles(directory="y-frontend/dist", html=True), name="frontend")