from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.db import get_async_session
from app.middleware.user_middleware import login_required
from app.models.models import Post, User, UserSession
from app.schemas.schemas import (FrontendPost, GetUserResponse,
                                 ProfileCompletionRequest)

router = APIRouter()

BUCKET_NAME = "ynot-media"


# async def resolve_handle_to_did(handle: str) -> str:
#     resolver = AsyncHandleResolver()
#     did = await resolver.resolve(handle)
#     if not did:
#         raise HTTPException(
#             status_code=404, detail=f"Unable to resolve handle: {handle}"
#         )
#
#     return did


@router.post("/complete-profile")
async def complete_profile(
    request: ProfileCompletionRequest,
    db: AsyncSession = Depends(get_async_session),
    session: UserSession = Depends(login_required),
):
    """
    Completes a user's profile data after registration. Updates username, avatar,
    and banner. Also toggles the is_profile_complete flag to indicate the profile
    completion modal is not needed in the frontend.
    """
    existing_user_result = await db.execute(
        select(User).where(User.username == request.username)
    )
    existing_user = existing_user_result.scalar()
    if existing_user and existing_user.id != session.user.id:
        raise HTTPException(status_code=400, detail="Username is already taken")

    query = select(User).where(User.id == session.user.id)
    result = await db.execute(query)
    user = result.scalar()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    print(request)

    user.username = request.username
    if request.avatar:
        user.avatar = request.avatar
    if request.banner:
        user.banner = request.banner
    user.is_profile_complete = True

    await db.commit()
    return {"message": "Profile completed"}


@router.get("/{username}/posts")
async def get_posts(
    username: str,
    db: AsyncSession = Depends(get_async_session),
) -> List[FrontendPost]:
    """
    Return a list of all posts by username.
    """
    user_query = select(User).where(User.username == username)
    result = await db.execute(user_query)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    posts_query = (
        select(Post)
        .options(joinedload(Post.tags))
        .where(Post.owner_id == user.id)
        .order_by(Post.created_at.desc())
    )
    posts_result = await db.execute(posts_query)
    posts = posts_result.unique().scalars().all()

    frontend_posts = [
        FrontendPost(
            id=post.id,
            owner_id=post.owner_id,
            owner=user.username,
            note=post.note,
            urls=post.urls,
            file_keys=post.file_keys,
            created_at=post.created_at,
            tags=[tag.name for tag in post.tags],
        )
        for post in posts
    ]

    return frontend_posts


@router.get("/{username}/profile")
async def get_user_profile(
    username: str,
    db: AsyncSession = Depends(get_async_session),
) -> GetUserResponse:
    """
    Returns data for displaying a user's profile page.
    """
    query = select(User).where(User.username == username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return GetUserResponse(
        email=user.email,
        username=user.username,
        bio=user.bio,
        avatar=user.avatar,
        banner=user.banner,
    )


#
# @router.get("/{handle}/profile", response_model=UserReq)
# async def get_profile(handle: str, db: AsyncSession = Depends(get_async_session)):
#     result = await db.execute(select(Users).where(Users.handle == handle))
#     user = result.scalars().first()
#     if user is None:
#         res = await fetch_bsky_profile(handle)
#         return res
#
#     return user


#
#
# @router.post("/profile")
# async def post_profile(
#     form_data: UserPost,
#     user: OAuthSession = Depends(login_required),
#     db=Depends(get_async_session),
# ):
#     req_url = f"{user.pds_url}/xrpc/com.atproto.repo.createRecord"
#     profile_data = form_data.model_dump()
#
#     body = {"repo": user.did, "collection": "com.y.profile", "record": profile_data}
#
#     resp = await pds_authed_req("POST", req_url, body=body, user=user, db=db)
#     if "uri" not in resp.json():
#         raise HTTPException(status_code=500, detail="Failed to create record")
#
#     try:
#         # Check if the user already exists in database
#         result = await db.execute(select(Users).where(Users.did == user.did))
#         existing_user = result.scalar_one_or_none()
#
#         if existing_user:
#             existing_user.display_name = form_data.display_name
#             existing_user.bio = form_data.bio
#             existing_user.avatar = form_data.avatar
#             existing_user.banner = form_data.banner
#         else:
#             user = Users(
#                 did=user.did,
#                 handle=user.handle,
#                 display_name=form_data.display_name,
#                 bio=form_data.bio,
#                 avatar=form_data.avatar,
#                 banner=form_data.banner,
#                 pds_url=user.pds_url,
#             )
#             db.add(user)
#
#         await db.commit()
#     except SQLAlchemyError as e:
#         await db.rollback()
#         print(f"Failed to save user profile to DB: {e}")
#         raise HTTPException(status_code=500, detail="Failed to save user profile")
#
#     return {"status": "Record created successfully", "response": resp.json()}
#
