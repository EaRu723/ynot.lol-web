import json
from typing import Tuple, Any
from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from urllib.parse import urlencode, urlparse
from joserfc.jwk import ECKey
from authlib.jose import jwt, JsonWebKey
from authlib.common.security import generate_token
from authlib.oauth2.rfc7636 import create_s256_code_challenge
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from app import models
from app.config import settings
from app.db.db import get_async_session
from app.routers.oauth.atproto_identity import (
    is_valid_did,
    is_valid_handle,
    resolve_identity,
    pds_endpoint,
)
from app.routers.oauth.atproto_oauth import (
    fetch_authserver_meta,
    resolve_pds_authserver,
    send_par_auth_request,

)
from app.routers.oauth.atproto_security import is_safe_url


router = APIRouter()

private_jwk = JsonWebKey.import_key(json.loads(settings.private_jwk))
public_jwk = {"crv":"P-256","x":"h-5kXZ-Z9J3f2zyH1vhQ_k_vk-e29PK-dUuBKRol-Ts","y":"HApZBEHhq7bk3l1W8KxyYEea9uWmU5_gtuis-f78jDI","kty":"EC","kid":"demo-1734311812"}
assert "d" not in public_jwk, "Public JWK should not contain private key"


@router.post("/login")
async def oauth_login(request: Request, identifier: str = Form(...), db: AsyncSession = Depends(get_async_session)):
    # Login can start with a handle, DID, or auth server URL. We can call whatever the user supplied as the "handle".
    if is_valid_handle(identifier) or is_valid_did(identifier):
        login_hint = identifier
        did, identifier, did_doc = resolve_identity(identifier)
        pds_url = pds_endpoint(did_doc)
        print(f"Account {identifier} is at {pds_url}")
        authserver_url = resolve_pds_authserver(pds_url)
    elif identifier.startswith("https://") and is_safe_url(identifier):
        # When starting with an auth server URL, we don't have info about the account yet
        did, identifier, pds_url = None, None, None
        login_hint = None
        # Check if this is a PDS URL, otherwise assume it is an authorization server
        initial_url = identifier
        try:
            authserver_url = resolve_pds_authserver(initial_url)
        except Exception:
            authserver_url = initial_url
    else:
        return JSONResponse(content = {"error": "Not a valid handle, DID, or auth server URL"})

    # Fetch auth server metadata
    # NOTE auth server URL is untrusted input, SSRF mitigations are needed
    print(f"Resolving auth server metadata at {authserver_url}")
    assert is_safe_url(authserver_url)
    try:
        authserver_meta = fetch_authserver_meta(authserver_url)
    except Exception as e:
        print(f"Failed to fetch auth server metadata: {e}")
        return JSONResponse(content = {"error": "Failed to fetch auth server metadata"})
    
    # Generate DPoP private signing key for this account session
    dpop_private_jwk = JsonWebKey.generate_key("EC", "P-256", is_private=True)

    scope = "atproto transition:generic"

    # app_url = str(request.base_url).replace("http://", "https://")
    # redirect_uri = f"{app_url}/oauth/callback"
    # client_id = f"{app_url}oauth/client-metadata.json"
    redirect_uri = "https://ynot.lol/oauth/callback"
    client_id = "https://ynot.lol/client-metadata.json"

    # Submit OAuth Pushed Authorization Request (PAR) to the Authorization Server
    pkce_verifier, state, dpop_authserver_nonce, resp = send_par_auth_request(
        authserver_url,
        authserver_meta,
        login_hint,
        client_id,
        redirect_uri,
        scope,
        private_jwk,
        dpop_private_jwk,
    )
    if resp.status_code == 400:
        print(f"PAR HTTP 400: {resp.json()}")
    resp.raise_for_status()
    par_request_uri = resp.json()["request_uri"]

    print(f"saving oauth_auth_request to DB for state {state}")
    try:
        oauth_request = models.OAuthAuthRequest(
            state=state,
            authserver_iss=authserver_meta["issuer"],
            did=did,
            handle=identifier,
            pds_url=pds_url,
            pkce_verifier=pkce_verifier,
            scope=scope,
            dpop_authserver_nonce=dpop_authserver_nonce,
            dpop_private_ec_key=dpop_private_jwk.as_dict(private=True),
        )
        db.add(oauth_request)
        await db.commit()
    except SQLAlchemyError as e:
        await db.rollback()
        print(f"Failed to save oauth_auth_request to DB: {e}")
        raise HTTPException(status_code=500, detail="Failed to save oauth_auth_request to DB")

    # Redirect the user to the Authorization Server to complete the browser auth flow
    # IMPORTANT: Authorization endpoint URL is untrusted input, security mitigations are needed before redirecting user
    auth_url = authserver_meta["authorization_endpoint"]
    assert is_safe_url(auth_url)
    qparam = urlencode({"client_id": client_id, "request_uri": par_request_uri})
    print(f"redirecting to {auth_url}?{qparam}")
    return JSONResponse(content={"redirect_url": f"{auth_url}?{qparam}"})