from typing import List
from fastapi import APIRouter, HTTPException, Depends
from pydantic.deprecated.tools import parse_obj_as
from app.models import FrontendPost, OAuthSession
from jinja2 import Environment, FileSystemLoader
from datetime import datetime, timedelta
from atproto_identity.resolver import AsyncHandleResolver, AsyncDidResolver

from app.middleware.user_middleware import login_required
from app.routers.oauth.atproto_oauth import pds_authed_req
from app.db.db import get_async_session

router = APIRouter()

def time_elapsed(created_at: datetime) -> str:
    now = datetime.now()
    delta = now - created_at
    if delta < timedelta(hours=1):
        return "now"
    elif delta < timedelta(days=1):
        return f"{delta.seconds // 3600}h"
    else:
        return f"{delta.days}d"


async def resolve_handle_to_did(handle: str) -> str:
    resolver = AsyncHandleResolver()
    did = await resolver.resolve(handle)
    if not did:
        raise HTTPException(status_code=404, detail=f"Unable to resolve handle: {handle}")

    return did

@router.get("/{handle}/posts", response_model=List[FrontendPost])
async def get_posts(handle: str, collection: str = "com.y.post", user: OAuthSession = Depends(login_required), db = Depends(get_async_session)) -> List[FrontendPost]:
    did = await resolve_handle_to_did(handle)

    did_resolver = AsyncDidResolver()
    atproto_data = await did_resolver.resolve_atproto_data(did=did)

    pds_url = atproto_data.pds

    if not pds_url:
        raise HTTPException(status_code=404, detail=f"PDS endpoint for {handle} not found")

    req_url = f"{pds_url}/xrpc/com.atproto.repo.listRecords"

    params = {
        "repo": did,
        "collection": collection,
    }

    response = await pds_authed_req("GET", req_url, user=user, db=db, body=params)
    response_body = response.json()

    if "records" not in response_body:
        raise HTTPException(status_code=500, detail="Invalid response from PDS")

    posts = parse_obj_as(
        List[FrontendPost],
        [
            {
                "note": record["value"]["note"],
                "urls": record["value"]["urls"],
                "tags": record["value"]["tags"],
                "collection": record["uri"].split("/")[-2],
                "rkey": record["uri"].split("/")[-1],
                "created_at": datetime.fromisoformat(record["value"]["created_at"]),
                "time_elapsed": time_elapsed(
                    datetime.fromisoformat(record["value"]["created_at"])
                ),
            }
            for record in response_body["records"]
        ],
    )

    return posts
