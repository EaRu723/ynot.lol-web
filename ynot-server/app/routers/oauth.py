from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from httpx import AsyncClient
from app.config import settings
import json

router = APIRouter()


@router.get("/login")
async def login(pds: str):
    if not pds:
        raise HTTPException(status_code=400, detail="PDS URL is required")

    # Redirect the user to the login page of their indicated PDS
    auth_url = (
        f"{pds}/oauth/authorize?"
        f"client_id={settings.atprotocol_client_id}&"
        f"redirect_uri={settings.atprotocol_redirect_uri}&"
        f"response_type=code"
    )
    return RedirectResponse(auth_url)


@router.get("/callback")
async def callback(request: Request):
    pds = request.query_params.get("pds")
    if not pds:
        raise HTTPException(status_code=400, detail="PDS URL is required")

    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code is required")

    async with AsyncClient() as client:
        # Handle the callback from the atproto identity provider
        # Exchange the authorization code for an access token
        token_url = f"{pds}/oauth/token"
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.atprotocol_redirect_uri,
            "client_id": settings.atprotocol_client_id,
            "client_secret": settings.atprotocol_client_secret,
        }
        response = await client.post(token_url, data=data)

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")

        token_data = response.json()
        access_token = token_data.get("access_token")

        return {
            "access_token": access_token,
            "token_type": token_data.get("token_type"),
        }
