from typing import List, Optional
from atproto import Client
from fastapi import APIRouter, Depends, Request, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.models import Site, Tag, SiteBase, TagBase, Token, UserBase, UserLogin, RecordPost
from app.db.db import get_async_session
from app.auth import (
    UserInDB,
    authenticate_user,
    create_access_token,
    get_current_active_user,
    User,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_password_hash,
    get_user,
)
from app.clients import get_async_client
from datetime import timedelta
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