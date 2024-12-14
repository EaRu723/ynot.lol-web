from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.clients import get_async_client
from app.config import settings
from joserfc.jwk import ECKey
import os

router = APIRouter()

private_jwk = settings.private_jwk
public_jwk = {'crv': 'P-256', 'x': 'sxW8SGE1OqGXQ6ch-OAnASOfZPdBeW8RdI9mYOJX_bU', 'y': 'GrYAVUmrxMRNZyPPpPiHHgfJo7Y_XTTRa1MEYTVFhnE', 'kty': 'EC'}
assert "d" not in public_jwk, "Public JWK should not contain private key"

@router.get("/client-metadata.json")
async def oauth_client_metadata(request: Request):
    app_url = str(request.base_url)

    response_data = {
        "client_id": "https://ynot.lol/static/client-metadata.json",
        "application_type": "web",
        "client_name": "Y: The discovery engine",
        "client_uri": "https://ynot.lol/",
        "dpop_bound_access_tokens": True,
        "grant_types": ["authorization_code", "refresh_token"],
        "redirect_uris": ["https://ynot.lol/oauth/callback"],
        "response_types": ["code"],
        "scope": "atproto transition:generic",
        "token_endpoint_auth_method": "private_key_jwt",
        "token_endpoint_auth_signing_alg": "ES256",
        "jwks": {
          "keys": [public_jwk]
        }
    }

    return JSONResponse(content = response_data)