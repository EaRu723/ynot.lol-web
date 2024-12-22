from urllib.parse import urlparse
from typing import Any, Tuple
import time
import json
from authlib.jose import JsonWebKey, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from authlib.common.security import generate_token
from authlib.oauth2.rfc7636 import create_s256_code_challenge

from app.routers.oauth.atproto_security import is_safe_url, hardened_http
from app.models import OAuthAuthRequest, OAuthSession
from app.config import settings


# Checks an Authorization Server metadata response against atproto OAuth requirements
async def is_valid_authserver_meta(obj: dict, url: str) -> bool:
    fetch_url = urlparse(url)
    issuer_url = urlparse(obj["issuer"])
    assert issuer_url.hostname == fetch_url.hostname
    assert issuer_url.scheme == "https"
    assert issuer_url.port is None
    assert issuer_url.path in ["", "/"]
    assert issuer_url.params == ""
    assert issuer_url.fragment == ""

    assert "code" in obj["response_types_supported"]
    assert "authorization_code" in obj["grant_types_supported"]
    assert "refresh_token" in obj["grant_types_supported"]
    assert "S256" in obj["code_challenge_methods_supported"]
    assert "none" in obj["token_endpoint_auth_methods_supported"]
    assert "private_key_jwt" in obj["token_endpoint_auth_methods_supported"]
    assert "ES256" in obj["token_endpoint_auth_signing_alg_values_supported"]
    assert "atproto" in obj["scopes_supported"]
    assert obj["authorization_response_iss_parameter_supported"] is True
    assert obj["pushed_authorization_request_endpoint"] is not None
    assert obj["require_pushed_authorization_requests"] is True
    assert "ES256" in obj["dpop_signing_alg_values_supported"]
    if "require_request_uri_registration" in obj:
        assert obj["require_request_uri_registration"] is True
    assert obj["client_id_metadata_document_supported"] is True

    return True


# Takes a Resource Server (PDS) URL, and tries to resolve it to an Authorization Server host/origin
async def resolve_pds_authserver(url: str) -> str:
    # IMPORTANT: PDS endpoint URL is untrusted input, SSRF mitigations are needed
    assert await is_safe_url(url)
    with hardened_http.get_session() as sess:
        resp = sess.get(f"{url}/.well-known/oauth-protected-resource")
    resp.raise_for_status()
    # Additionally check that status is exactly 200 (not just 2xx)
    assert resp.status_code == 200
    authserver_url = resp.json()["authorization_servers"][0]
    return authserver_url


# Does an HTTP GET for Authorization Server (entryway) metadata, verify the contents, and return the metadata as a dict
async def fetch_authserver_meta(url: str) -> dict:
    # IMPORTANT: Authorization Server URL is untrusted input, SSRF mitigations are needed
    assert await is_safe_url(url)
    with hardened_http.get_session() as sess:
        resp = sess.get(f"{url}/.well-known/oauth-authorization-server")
    resp.raise_for_status()

    authserver_meta = resp.json()
    # print("Auth Server Metadata: " + json.dumps(authserver_meta, indent=2))
    assert await is_valid_authserver_meta(authserver_meta, url)
    return authserver_meta


async def client_assertion_jwt(
    client_id: str, authserver_url: str, private_jwk: JsonWebKey
) -> str:
    client_assertion = jwt.encode(
        {"alg": "ES256", "kid": private_jwk["kid"]},
        {
            "iss": client_id,
            "sub": client_id,
            "aud": authserver_url,
            "jti": generate_token(),
            "iat": int(time.time()),
        },
        private_jwk,
    ).decode("utf-8")
    return client_assertion


async def authserver_dpop_jwt(
    method: str, url: str, nonce: str, dpop_private_jwk: JsonWebKey
) -> str:
    dpop_pub_jwk = json.loads(dpop_private_jwk.as_json(is_private=False))
    body = {
        "jti": generate_token(),
        "htm": method,
        "htu": url,
        "iat": int(time.time()),
        "exp": int(time.time()) + 30,
    }
    if nonce:
        body["nonce"] = nonce
    dpop_proof = jwt.encode(
        {"typ": "dpop+jwt", "alg": "ES256", "jwk": dpop_pub_jwk},
        body,
        dpop_private_jwk,
    ).decode("utf-8")
    return dpop_proof


# Prepares and sends a pushed auth request (PAR) via HTTP POST to the Authorization Server.
# Returns "state" id HTTP response on success, without checking HTTP response status
async def send_par_auth_request(
    authserver_url: str,
    authserver_meta: dict,
    login_hint: str,
    client_id: str,
    redirect_uri: str,
    scope: str,
    client_secret_jwk: JsonWebKey,
    dpop_private_jwk: JsonWebKey,
) -> Tuple[str, str, str, Any]:
    par_url = authserver_meta["pushed_authorization_request_endpoint"]
    state = generate_token()
    pkce_verifier = generate_token(48)

    # Generate PKCE code_challenge, and use it for PAR request
    code_challenge = create_s256_code_challenge(pkce_verifier)
    code_challenge_method = "S256"

    # Self-signed JWT using the private key declared in client metadata JWKS (confidential client)
    client_assertion = await client_assertion_jwt(
        client_id, authserver_url, client_secret_jwk
    )

    # Create DPoP header JWT; we don't have a server Nonce yet
    dpop_authserver_nonce = ""
    dpop_proof = await authserver_dpop_jwt(
        "POST", par_url, dpop_authserver_nonce, dpop_private_jwk
    )

    par_body = {
        "response_type": "code",
        "code_challenge": code_challenge,
        "code_challenge_method": code_challenge_method,
        "client_id": client_id,
        "state": state,
        "redirect_uri": redirect_uri,
        "scope": scope,
        "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        "client_assertion": client_assertion,
    }
    if login_hint:
        par_body["login_hint"] = login_hint
    # print(par_body)

    # IMPORTANT: Pushed Authorization Request URL is untrusted input, SSRF mitigations are needed
    assert await is_safe_url(par_url)
    with hardened_http.get_session() as sess:
        resp = sess.post(
            par_url,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "DPoP": dpop_proof,
            },
            data=par_body,
        )

    # Handle DPoP missing/invalid nonce error by retrying with server-provided nonce
    if resp.status_code == 400 and resp.json()["error"] == "use_dpop_nonce":
        dpop_authserver_nonce = resp.headers["DPoP-Nonce"]
        print(f"retrying with new auth server DPoP nonce: {dpop_authserver_nonce}")
        dpop_proof = await authserver_dpop_jwt(
            "POST", par_url, dpop_authserver_nonce, dpop_private_jwk
        )
        with hardened_http.get_session() as sess:
            resp = sess.post(
                par_url,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "DPoP": dpop_proof,
                },
                data=par_body,
            )

    return pkce_verifier, state, dpop_authserver_nonce, resp


# Completes the auth flow by sending an initial auth token request.
# Returns token response (dict) and DPoP nonce (str)
async def initial_token_request(
    auth_request: OAuthAuthRequest,
    code: str,
    app_url: str,
    client_secret_jwk: JsonWebKey,
) -> Tuple[dict, str]:
    authserver_url = auth_request.authserver_iss

    # Re-fetch server metadata
    authserver_meta = await fetch_authserver_meta(authserver_url)

    # Construct auth token request fields
    client_id = "https://ynot.lol/client-metadata.json"
    redirect_uri = f"{settings.app_url}/api/oauth/callback"

    # Self-signed JWT using the private key declared in client metadata JWKS (confidential client)
    client_assertion = await client_assertion_jwt(
        client_id, authserver_url, client_secret_jwk
    )

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
        "code": code,
        "code_verifier": auth_request.pkce_verifier,
        "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        "client_assertion": client_assertion,
    }

    # Create DPoP header JWT, using the existing DPoP signing key for this account/session
    token_url = authserver_meta["token_endpoint"]
    dpop_private_jwk = JsonWebKey.import_key(
        auth_request.dpop_private_ec_key
    )
    dpop_authserver_nonce = auth_request.dpop_authserver_nonce
    dpop_proof = await authserver_dpop_jwt(
        "POST", token_url, dpop_authserver_nonce, dpop_private_jwk
    )

    # IMPORTANT: Token URL is untrusted input, SSRF mitigations are needed
    assert await is_safe_url(token_url)
    with hardened_http.get_session() as sess:
        resp = sess.post(token_url, data=params, headers={"DPoP": dpop_proof})

    # Handle DPoP missing/invalid nonce error by retrying with server-provided nonce
    if resp.status_code == 400 and resp.json()["error"] == "use_dpop_nonce":
        dpop_authserver_nonce = resp.headers["DPoP-Nonce"]
        print(f"retrying with new auth server DPoP nonce: {dpop_authserver_nonce}")
        dpop_proof = await authserver_dpop_jwt(
            "POST", token_url, dpop_authserver_nonce, dpop_private_jwk
        )
        print(f"dpop proof: {dpop_proof}")
        with hardened_http.get_session() as sess:
            resp = sess.post(token_url, data=params, headers={"DPoP": dpop_proof})

    resp.raise_for_status()
    token_body = resp.json()

    # IMPORTANT: the 'sub' field must be verified against the original request by code calling this function.

    return token_body, dpop_authserver_nonce


# Returns token response (dict) and DPoP nonce (str)
async def refresh_token_request(
    user: OAuthSession,
    app_url: str,
    client_secret_jwk: JsonWebKey,
) -> Tuple[dict, str]:
    authserver_url = user.authserver_iss

    # Re-fetch server metadata
    authserver_meta = await fetch_authserver_meta(authserver_url)

    # Construct token request fields
    client_id = "https://ynot.lol/client-metadata.json"

    # Self-signed JWT using the private key declared in client metadata JWKS (confidential client)
    client_assertion = await client_assertion_jwt(
        client_id, authserver_url, client_secret_jwk
    )

    params = {
        "client_id": client_id,
        "grant_type": "refresh_token",
        "refresh_token": user.refresh_token,
        "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        "client_assertion": client_assertion,
    }

    # Create DPoP header JWT, using the existing DPoP signing key for this account/session
    token_url = authserver_meta["token_endpoint"]
    dpop_private_jwk = JsonWebKey.import_key(json.loads(user.dpop_private_jwk))
    dpop_authserver_nonce = user.dpop_authserver_nonce
    dpop_proof = await authserver_dpop_jwt(
        "POST", token_url, dpop_authserver_nonce, dpop_private_jwk
    )

    # IMPORTANT: Token URL is untrusted input, SSRF mitigations are needed
    assert await is_safe_url(token_url)
    with hardened_http.get_session() as sess:
        resp = sess.post(token_url, data=params, headers={"DPoP": dpop_proof})

    # Handle DPoP missing/invalid nonce error by retrying with server-provided nonce
    if resp.status_code == 400 and resp.json()["error"] == "use_dpop_nonce":
        dpop_authserver_nonce = resp.headers["DPoP-Nonce"]
        print(f"retrying with new auth server DPoP nonce: {dpop_authserver_nonce}")
        # print(server_nonce)
        dpop_proof = await authserver_dpop_jwt(
            "POST", token_url, dpop_authserver_nonce, dpop_private_jwk
        )
        with hardened_http.get_session() as sess:
            resp = sess.post(token_url, data=params, headers={"DPoP": dpop_proof})

    if resp.status_code not in [200, 201]:
        print(f"Token Refresh Error: {resp.json()}")

    resp.raise_for_status()
    token_body = resp.json()

    return token_body, dpop_authserver_nonce


async def pds_dpop_jwt(
    method: str,
    url: str,
    iss: str,
    access_token: str,
    nonce: str,
    dpop_private_jwk: JsonWebKey,
) -> str:
    dpop_pub_jwk = json.loads(dpop_private_jwk.as_json(is_private=False))
    body = {
        "iss": iss,
        "iat": int(time.time()),
        "exp": int(time.time()) + 10,
        "jti": generate_token(),
        "htm": method,
        "htu": url,
        # PKCE S256 is same as DPoP ath hashing
        "ath": create_s256_code_challenge(access_token),
    }
    if nonce:
        body["nonce"] = nonce
    dpop_proof = jwt.encode(
        {"typ": "dpop+jwt", "alg": "ES256", "jwk": dpop_pub_jwk},
        body,
        dpop_private_jwk,
    ).decode("utf-8")
    return dpop_proof


# Helper to make a request (HTTP GET or POST) to the user's PDS ("Resource Server" in OAuth terminology) using DPoP and access token.
# This method returns a 'requests' response, without checking status code.
async def pds_authed_req(method: str, url: str, user, db: AsyncSession, body=None) -> Any:
    # Ensure `dpop_private_jwk` is a dictionary
    if isinstance(user.dpop_private_jwk, str):
        # Convert JSON string to Python dictionary
        dpop_private_jwk = json.loads(user.dpop_private_jwk)
    else:
        # Use it as-is if already a dictionary
        dpop_private_jwk = user.dpop_private_jwk

    dpop_private_jwk = JsonWebKey.import_key(dpop_private_jwk)
    dpop_pds_nonce = user.dpop_authserver_nonce
    access_token = user.access_token

    # Ensure body is JSON-serializable before posting
    if body:
        body = json.loads(json.dumps(body, default=str))

    # Usually need to retry request with a new nonce
    for i in range(2):
        dpop_jwt = await pds_dpop_jwt(
            method,
            url,
            user.authserver_iss,
            access_token,
            dpop_pds_nonce,
            dpop_private_jwk,
        )

        print(f"Generated DPoP JWT: {dpop_jwt}")

        with hardened_http.get_session() as sess:
            if method.upper() == "GET":
                resp = sess.get(
                    url,
                    headers={
                        "Authorization": f"DPoP {access_token}",
                        "DPoP": dpop_jwt,
                    },
                    params=body,
                )
            elif method.upper() == "POST":
                resp = sess.post(
                    url,
                    headers={
                        "Authorization": f"DPoP {access_token}",
                        "DPoP": dpop_jwt,
                    },
                    json=body,
                )
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

        # Log response details for debugging
        print(f"Response Status Code: {resp.status_code}")
        print(f"Response Headers: {resp.headers}")
        print(f"Response Body: {resp.text}")

        if resp.status_code in [200, 201]:
            return resp

        # Handle 401 (expired token)
        if resp.status_code == 401 and "invalid_token" in resp.text:
            print("Token expired, attempting to refresh...")
            app_url = settings.app_url
            client_secret_jwk = JsonWebKey.import_key(json.loads(settings.private_jwk))

            token_body, new_nonce = await refresh_token_request(
                user, app_url, client_secret_jwk
            )

            # Update session with refreshed tokens
            access_token = token_body["access_token"]
            refresh_token = token_body.get("refresh_token", user.refresh_token)  # Fall back to existing refresh token
            dpop_pds_nonce = new_nonce

            async with db.begin():
                await db.execute(
                    update(OAuthSession)
                    .where(OAuthSession.did == user.did)
                    .values(
                        access_token=access_token,
                        refresh_token=refresh_token,
                        dpop_authserver_nonce=dpop_pds_nonce,
                    )
                )
            continue

        # If we got a new server-provided DPoP nonce, store it in database and retry.
        if "dpop-nonce" in resp.headers:
            print(resp.headers)
            dpop_pds_nonce = resp.headers["DPoP-Nonce"]
            print(f"retrying with new PDS DPoP nonce: {dpop_pds_nonce}")

            # Update session database with new nonce
            async with db.begin():
                await db.execute(
                    update(OAuthSession)
                    .where(OAuthSession.did == user.did)
                    .values(dpop_authserver_nonce=dpop_pds_nonce)
                )
            continue

        break

    return resp

