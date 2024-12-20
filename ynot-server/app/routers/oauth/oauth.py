import json
from urllib.parse import urlencode

from authlib.jose import JsonWebKey
from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update

from app.models import OAuthAuthRequest, OAuthSession
from app.config import settings
from app.db.db import get_async_session
from app.routers.oauth.atproto_identity import (is_valid_did, is_valid_handle,
                                                pds_endpoint, resolve_identity)
from app.routers.oauth.atproto_oauth import (fetch_authserver_meta,
                                             resolve_pds_authserver,
                                             send_par_auth_request,
                                             initial_token_request)
from app.routers.oauth.atproto_security import is_safe_url
from app.routers.oauth.atproto_oauth import refresh_token_request
from app.middleware.user_middleware import login_required

router = APIRouter()

private_jwk = JsonWebKey.import_key(json.loads(settings.private_jwk))
public_jwk = {"crv":"P-256","x":"PeSen6GnJy0iBAob7DxOqcETvTnAJ8NsweCSbmZetnE","y":"gkAPsmzPlrmv9eubYaGY9xcoQxquNnRHMpk1feIBrGI","kty":"EC","kid":"demo-1734490496"}
assert "d" not in public_jwk, "Public JWK should not contain private key"


@router.post("/login")
async def oauth_login(request: Request, identifier: str = Form(...), db: AsyncSession = Depends(get_async_session)):
    # Login can start with a handle, DID, or auth server URL. We can call whatever the user supplied as the "handle".
    if await is_valid_handle(identifier) or is_valid_did(identifier):
        login_hint = identifier
        did, identifier, did_doc = await resolve_identity(identifier)
        pds_url = await pds_endpoint(did_doc)
        print(f"Account {identifier} is at {pds_url}")
        authserver_url = await resolve_pds_authserver(pds_url)
    elif identifier.startswith("https://") and await is_safe_url(identifier):
        # When starting with an auth server URL, we don't have info about the account yet
        did, identifier, pds_url = '', '', ''
        login_hint = None
        # Check if this is a PDS URL, otherwise assume it is an authorization server
        initial_url = identifier
        try:
            authserver_url = await resolve_pds_authserver(initial_url)
        except Exception:
            authserver_url = initial_url
    else:
        return JSONResponse(content = {"error": "Not a valid handle, DID, or auth server URL"})

    # Fetch auth server metadata
    # NOTE auth server URL is untrusted input, SSRF mitigations are needed
    print(f"Resolving auth server metadata at {authserver_url}")
    assert await is_safe_url(authserver_url)
    try:
        authserver_meta = await fetch_authserver_meta(authserver_url)
    except Exception as e:
        print(f"Failed to fetch auth server metadata: {e}")
        return JSONResponse(content = {"error": "Failed to fetch auth server metadata"})
    
    # Generate DPoP private signing key for this account session
    dpop_private_jwk = JsonWebKey.generate_key("EC", "P-256", is_private=True)
    print(f"JWK {dpop_private_jwk.as_json(is_private=True)}")

    scope = "atproto transition:generic"

    # app_url = str(request.base_url).replace("http://", "https://")
    # redirect_uri = f"{app_url}/api/oauth/callback"
    # client_id = f"{app_url}oauth/client-metadata.json"
    redirect_uri = f"{settings.app_url}/api/oauth/callback"
    client_id = "https://ynot.lol/client-metadata.json"

    # Submit OAuth Pushed Authorization Request (PAR) to the Authorization Server
    pkce_verifier, state, dpop_authserver_nonce, resp = await send_par_auth_request(
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
        oauth_request = OAuthAuthRequest(
            state=state,
            authserver_iss=authserver_meta["issuer"],
            did=did,
            handle=identifier,
            pds_url=pds_url,
            pkce_verifier=pkce_verifier,
            scope=scope,
            dpop_authserver_nonce=dpop_authserver_nonce,
            dpop_private_ec_key=json.loads(dpop_private_jwk.as_json(is_private=True)),
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
    assert await is_safe_url(auth_url)
    qparam = urlencode({"client_id": client_id, "request_uri": par_request_uri})
    print(f"redirecting to {auth_url}?{qparam}")
    return JSONResponse(content={"redirect_url": f"{auth_url}?{qparam}"})

@router.get("/callback")
async def oauth_callback(
        request: Request,
        response: Response,
        state: str,
        iss: str,
        code: str,
        db: AsyncSession = Depends(get_async_session),
) -> dict:
    # Look up auth request by state
    query = select(OAuthAuthRequest).where(OAuthAuthRequest.state == state)
    result = await db.execute(query)
    row = result.scalar()

    if not row:
        raise HTTPException(status_code=400, detail="Invalid state")

    # Delete auth request to prevent replay attacks
    try:
        delete_query = delete(OAuthAuthRequest).where(OAuthAuthRequest.state == row.state)
        await db.execute(delete_query)
        await db.commit()
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete OAuth auth request")

    # Verify iss and state
    if row.authserver_iss != iss or row.state != state:
        raise HTTPException(status_code=400, detail="Invalid issuer or state")

    # Complete the auth flow by requesting tokens
    app_url = str(request.base_url).replace("http://", "https://")
    try:
        tokens, dpop_authserver_nonce = await initial_token_request(
            row, code, app_url, private_jwk
        )
    except HTTPException as e:
        raise HTTPException(status_code=500, detail=f"Token request failed: {str(e)}")

    # Resolve identity if necessary
    if row.did:
        did, handle, pds_url = row.did, row.handle, row.pds_url
        if tokens["sub"] != did:
            raise HTTPException(status_code=400, detail="DID mismatch")
    else:
        did = tokens["sub"]
        if not is_valid_did(did):
            raise HTTPException(status_code=400, detail="Invalid DID")
        did, handle, did_doc = await resolve_identity(did)
        pds_url = await pds_endpoint(did_doc)
        authserver_url = await resolve_pds_authserver(pds_url)
        if authserver_url != iss:
            raise HTTPException(status_code=400, detail="Issuer mismatch")

    # Verify scopes
    if row.scope != tokens.get("scope", ""):
        raise HTTPException(status_code=400, detail="Scope mismatch")

    # Save session in the database
    new_session = OAuthSession(
        did=did,
        handle=handle,
        pds_url=pds_url,
        authserver_iss=iss,
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        dpop_authserver_nonce=dpop_authserver_nonce,
        dpop_private_jwk=row.dpop_private_ec_key,
    )

    try:
        db.add(new_session)
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        if "unique constraint" in str(e.orig):
            print(f"Failed to save oauth_auth_request to DB: {e}")
            raise HTTPException(status_code=500, detail="A session for this user already exists")
    except SQLAlchemyError as e:
        await db.rollback()
        print(f"Failed to save oauth_auth_request to DB: {e}")
        raise HTTPException(status_code=500, detail="Failed to save OAuth session")

    request.session["user_did"] = did
    request.session["user_handle"] = handle

    print(request.session.get("user_did"))
    print(request.session.get("user_handle"))

    return RedirectResponse(url="/")

@router.get("/refresh")
async def oauth_refresh(request: Request, db = Depends(get_async_session), user = Depends(login_required)):
    tokens, dpop_authserver_nonce = await refresh_token_request(
        request.session.get(user), settings.app_url, private_jwk
    )

    user_did = request.session.pop("user_did", None)

    try:
        query = update(OAuthSession).where(OAuthSession.did == user_did)
        await db.execute(query)
        await db.commit()
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update session")

    return RedirectResponse("/")



@router.get("/logout")
async def oauth_logout(request: Request, db: AsyncSession = Depends(get_async_session), user=Depends(login_required)) -> dict:
    # Clear session data
    user_did = request.session.pop("user_did", None)
    request.session.pop("user_handle", None)

    if user_did:
        try:
            query = delete(OAuthSession).where(OAuthSession.did == user_did)
            await db.execute(query)
            await db.commit()
        except SQLAlchemyError:
            await db.rollback()
            raise HTTPException(status_code=500, detail="Failed to delete session")

    return {"message": "Successfully logged out"}
