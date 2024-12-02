from typing import List
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic.deprecated.tools import parse_obj_as
from app.models import RecordPost
from app.clients import get_async_client
from atproto import models
from jinja2 import Environment, FileSystemLoader
from datetime import datetime, timedelta

router = APIRouter()

templates = Environment(loader=FileSystemLoader("app/templates"))

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
    try:
        client = get_async_client()
        response = await client.com.atproto.identity.resolve_handle({"handle": handle})
        return response.did
    except Exception:
        raise HTTPException(status_code=404, detail=f"Unable to resolve handle: {handle}")


@router.get("/{handle}/posts", response_model=List[RecordPost])
async def get_posts(handle: str, collection: str = "com.ynot.post"):
    client = get_async_client()
    did = await resolve_handle_to_did(handle)
    response = await client.com.atproto.repo.list_records(
        models.ComAtprotoRepoListRecords.Params(repo=did, collection=collection)
    )


    posts = parse_obj_as(List[RecordPost], [
        {
            "title": record.value.title,
            "description": record.value.description,
            "urls": record.value.urls,
            "tags": record.value.tags,
            "collection": record.uri.split("/")[-2],
            "rkey": record.uri.split("/")[-1],
            "created_at": datetime.fromisoformat(record.value.created_at),
            "time_elapsed": time_elapsed(datetime.fromisoformat(record.value.created_at))
        }
        for record in response.records
    ])

    return posts


@router.get("/{handle}/profile", response_class=HTMLResponse)
async def serve_profile(handle: str):
    posts = await get_posts(handle)
    if posts is None:
        raise HTTPException(status_code=404, detail="User not found")
    template = templates.get_template("profile.html")
    html = template.render(handle=handle, posts=posts)
    return HTMLResponse(content=html)
