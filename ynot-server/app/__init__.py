from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import api, oauth, user

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

# app.include_router(views.router)
app.include_router(oauth.router, prefix="/oauth")
app.include_router(api.router, prefix="/api")
app.include_router(user.router, prefix="/api/user")
