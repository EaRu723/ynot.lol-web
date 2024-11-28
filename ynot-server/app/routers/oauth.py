from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse
from httpx import AsyncClient
from app.config import settings
import json
import hashlib
import base64
import secrets
import os

router = APIRouter()

# in-memory storage for code_verifiers (use database for this)
code_verifiers = {}


def generate_pkce_pair():
    code_verifier = (
        base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode("utf-8")
    )
    code_challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode("utf-8")).digest())
        .rstrip(b"=")
        .decode("utf-8")
    )
    return code_verifier, code_challenge


@router.get("/client-metadata.json")
async def client_metadata():
    metadata = {
        "client_id": "https://ynot.lol/oauth/client-metadata.json",
        "application_type": "web",
        "client_name": "Y: The discovery engine",
        "client_uri": "https://ynot.lol/",
        "dpop_bound_access_tokens": True,
        "grant_types": ["authorization_code", "refresh_token"],
        "redirect_uris": ["http://ynot.lol/oauth/callback"],
        "response_types": ["code"],
        "scope": "atproto transition:generic",
        "token_endpoint_auth_method": "private_key_jwt",
        "token_endpoint_auth_signing_alg": "ES256",
        "jwks": {
            "keys": [
                {
                    "kty": "EC",
                    "crv": "P-256",
                    "x": "NX5B2b_T9_CN7CqNN35qB3v12o6iGL7ospcwTAoTF6E",
                    "y": "j7zlhcUGYGsnwZSp2vvekvguZsIHcFxitDU-F2846fo",
                    "d": "cinXNXdPhitUJiUpDld7yOuwHI5g4wbpCyrdXTFxk3Q",
                }
            ]
        },
    }

    return JSONResponse(metadata)


@router.get("/login")
async def login(pds: str):
    if not pds:
        raise HTTPException(status_code=400, detail="PDS URL is required")

    # Generate PKCE pair
    code_verifier, code_challenge = generate_pkce_pair()

    # Store code_verifier for later use
    code_verifiers[code_challenge] = code_verifier

    # Fetch the PAR endpoint from the PDS metadata
    metadata_url = f"{pds}/.well-known/oauth-authorization-server"
    async with AsyncClient() as client:
        response = await client.get(metadata_url)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch metadata")

        par_endpoint = response.json().get("pushed_authorization_request_endpoint")
        if not par_endpoint:
            raise HTTPException(status_code=400, detail="PAR endpoint not found")

    # Submit PAR request
    par_data = {
        "client_id": settings.atprotocol_client_id,
        "redirect_uri": settings.atprotocol_redirect_uri,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "response_type": "code",
        "scope": "atproto",
    }

    print("PAR Endpoint:", par_endpoint)
    print("PAR Request Data:", par_data)

    async with AsyncClient() as client:
        par_response = await client.post(par_endpoint, data=par_data)
        if par_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to submit PAR request")

        request_uri = par_response.json().get("request_uri")
        if not request_uri:
            raise HTTPException(status_code=400, detail="Failed to get request URI")

    # Redirect user to the authorization endpoint
    auth_url = f"{pds}/oauth/authorize?client_id={settings.atprotocol_client_id}&request_uri={request_uri}"
    return RedirectResponse(auth_url)


@router.get("/callback")
async def callback(request: Request):
    pds = request.query_params.get("pds")
    code = request.query_params.get("code")
    code_challenge = request.query_params.get(
        "state"
    )  # Pass the state as PKCE challenge in the `/login` endpoint

    if not pds:
        raise HTTPException(status_code=400, detail="PDS URL is required")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code is required")
    if code_challenge not in code_verifiers:
        raise HTTPException(
            status_code=400,
            detail="Invalid state, PKCE code verifier not found in our records",
        )

    code_verifier = code_verifiers.pop(code_challenge)

    # Exchange the authorization code for an access token
    token_url = f"{pds}/oauth/token"
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.atprotocol_redirect_uri,
        "client_id": settings.atprotocol_client_id,
        "code_verifier": code_verifier,
    }
    async with AsyncClient() as client:
        response = await client.post(token_url, data=data)

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")

        token_data = response.json()
        return {
            "access_token": token_data.get("access_token"),
            "refresh_token": token_data.get("refresh_token"),
            "token_type": token_data.get("token_type"),
        }