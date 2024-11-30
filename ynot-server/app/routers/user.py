from typing import List
from fastapi import APIRouter
from app.models import RecordPost
from app.clients import get_async_client
from atproto import models

router = APIRouter()

async def resolve_handle_to_did(handle: str) -> str:
    client = get_async_client()
    response = await client.com.atproto.identity.resolve_handle({"handle": handle})
    return response.did

@router.get("/{handle}/posts", response_model=List[RecordPost])
async def get_posts(handle: str):
    client = get_async_client()
    did = await resolve_handle_to_did(handle)
    response = await client.com.atproto.repo.list_records(
        models.ComAtprotoRepoListRecords.Params(
            repo=did,
            collection='com.ynot.post'
        )
    )

    posts = []
    for record in response.records:
        value = record.value
        post = RecordPost(
            title=value.title,
            description=value.description,
            urls=value.urls,
            tags=value.tags,
            created_at=value.created_at
        )
        posts.append(post)

    return posts
