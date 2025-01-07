from datetime import datetime
from typing import List

from atproto_identity.resolver import AsyncDidResolver, AsyncHandleResolver
from fastapi import APIRouter, Depends, HTTPException
from pydantic.deprecated.tools import parse_obj_as
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.db import get_async_session
from app.middleware.user_middleware import login_required
from app.models import FrontendPost, OAuthSession, User, UserPost, UserReq
from app.routers.oauth.atproto_oauth import pds_authed_req
from app.routers.oauth.oauth import fetch_bsky_profile

router = APIRouter()


async def resolve_handle_to_did(handle: str) -> str:
    resolver = AsyncHandleResolver()
    did = await resolver.resolve(handle)
    if not did:
        raise HTTPException(
            status_code=404, detail=f"Unable to resolve handle: {handle}"
        )

    return did


@router.get("/{handle}/posts", response_model=List[FrontendPost])
async def get_posts(
    handle: str,
    collection: str = "com.y.post",
    user: OAuthSession = Depends(login_required),
    db=Depends(get_async_session),
) -> List[FrontendPost]:
    did = await resolve_handle_to_did(handle)

    did_resolver = AsyncDidResolver()
    atproto_data = await did_resolver.resolve_atproto_data(did=did)

    pds_url = atproto_data.pds

    if not pds_url:
        raise HTTPException(
            status_code=404, detail=f"PDS endpoint for {handle} not found"
        )

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
                "did": did,
                "handle": handle,
                "urls": record["value"]["urls"],
                "tags": record["value"]["tags"],
                "collection": record["uri"].split("/")[-2],
                "rkey": record["uri"].split("/")[-1],
                "created_at": datetime.fromisoformat(record["value"]["created_at"]),
            }
            for record in response_body["records"]
        ],
    )

    return posts


@router.post("/profile")
async def post_profile(
    form_data: UserPost,
    user: OAuthSession = Depends(login_required),
    db=Depends(get_async_session),
):
    req_url = f"{user.pds_url}/xrpc/com.atproto.repo.createRecord"
    profile_data = form_data.model_dump()

    body = {"repo": user.did, "collection": "com.y.profile", "record": profile_data}

    resp = await pds_authed_req("POST", req_url, body=body, user=user, db=db)
    if "uri" not in resp.json():
        raise HTTPException(status_code=500, detail="Failed to create record")

    try:
        # Check if the user already exists in database
        result = await db.execute(select(User).where(User.did == user.did))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            existing_user.display_name = form_data.display_name
            existing_user.bio = form_data.bio
            existing_user.avatar = form_data.avatar
            existing_user.banner = form_data.banner
        else:
            user = User(
                did=user.did,
                handle=user.handle,
                display_name=form_data.display_name,
                bio=form_data.bio,
                avatar=form_data.avatar,
                banner=form_data.banner,
                pds_url=user.pds_url,
            )
            db.add(user)

        await db.commit()
    except SQLAlchemyError as e:
        await db.rollback()
        print(f"Failed to save user profile to DB: {e}")
        raise HTTPException(status_code=500, detail="Failed to save user profile")

    return {"status": "Record created successfully", "response": resp.json()}


@router.get("/{handle}/profile", response_model=UserReq)
async def get_profile(handle: str, db: AsyncSession = Depends(get_async_session)):
    result = await db.execute(select(User).where(User.handle == handle))
    user = result.scalars().first()
    if user is None:
        res = await fetch_bsky_profile(handle)
        return res

    return user
