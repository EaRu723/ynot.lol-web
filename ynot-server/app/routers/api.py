import uuid
from typing import List

import boto3
from fastapi import (APIRouter, Depends, File, HTTPException, Request,
                     UploadFile, WebSocket, WebSocketDisconnect)
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.config import settings
from app.db.db import get_async_session
from app.middleware.user_middleware import login_required
from app.models.models import Post, Site, Tag, User, UserSession
from app.schemas.schemas import (CreatePostRequest, DeletePostRequest,
                                 FrontendPost, PostResponse,
                                 PreSignedUrlRequest, SiteBase, TagBase)

router = APIRouter()

AWS_BUCKET_NAME = settings.aws_bucket_name
AWS_BUCKET_NAME = "ynot-media"
AWS_REGION = "us-west-1"
AWS_ACCESS_KEY = settings.aws_access_key
AWS_SECRET_KEY = settings.aws_secret_key

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION,
)


# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            print(f"Received from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


tags = [
    {"id": 1, "name": "personal"},
    {"id": 2, "name": "blog"},
    {"id": 3, "name": "tech"},
    {"id": 4, "name": "life"},
    {"id": 5, "name": "developer"},
    {"id": 6, "name": "portfolio"},
    {"id": 7, "name": "notion"},
    {"id": 8, "name": "productivity"},
    {"id": 9, "name": "art"},
    {"id": 10, "name": "gallery"},
    {"id": 11, "name": "artist"},
    {"id": 12, "name": "music"},
    {"id": 13, "name": "events"},
    {"id": 14, "name": "software"},
    {"id": 15, "name": "startup"},
    {"id": 16, "name": "investment"},
    {"id": 17, "name": "entrepreneurship"},
    {"id": 18, "name": "business"},
    {"id": 19, "name": "ai"},
    {"id": 20, "name": "research"},
    {"id": 21, "name": "career"},
]

sites = [
    {
        "name": "Yev Barkalov",
        "owner": "ybarkalov",
        "email": "yev@example.com",
        "url": "https://yev.bar",
        "tags": [1, 2, 3, 4, 5],
        "site_metadata": "Yev's personal blog about technology and life.",
    },
    {
        "name": "Arnav Surve",
        "owner": "asurve",
        "email": "arnav@example.com",
        "url": "https://surve.dev",
        "tags": [6, 5],
        "site_metadata": "Arnav's portfolio showcasing his projects and skills.",
    },
    {
        "name": "Andrea Russo",
        "owner": "arusso",
        "email": "andrea@example.com",
        "url": "https://v2-embednotion.com/13c7550ba3aa8009b2d3d2ed16633852",
        "tags": [7, 8],
        "site_metadata": "Andrea's site about productivity tips and Notion templates.",
    },
    {
        "name": "Peter Cybriwsky",
        "owner": "pcybriwsky",
        "email": "peter@example.com",
        "url": "https://repete.art",
        "tags": [9, 10, 11, 6],
        "site_metadata": "Repete's online art gallery showcasing his artwork.",
    },
    {
        "name": "Ibiyemi Abiodun",
        "owner": "iabiodun",
        "email": "ibiyemi@example.com",
        "url": "http://ibiyemiabiodun.com",
        "tags": [12, 11, 13],
        "site_metadata": "Ibiyemi's official site featuring her music and upcoming events.",
    },
    {
        "name": "Jason Antwi-Appah",
        "owner": "jantwiappah",
        "email": "jason@example.com",
        "url": "https://jasonaa.me",
        "tags": [3, 2, 5, 14],
        "site_metadata": "Jason's tech blog covering the latest in software development.",
    },
    {
        "name": "Sam Altman",
        "owner": "saltman",
        "email": "sam@example.com",
        "url": "https://blog.samaltman.com",
        "tags": [15, 16, 17, 2, 3, 18, 19],
        "site_metadata": "Sam Altman's blog about startups, investments, and entrepreneurship.",
    },
    {
        "name": "Paul Graham",
        "owner": "pgraham",
        "email": "paul@example.com",
        "url": "https://paulgraham.com",
        "tags": [15, 16, 17, 2, 3],
        "site_metadata": "Paul Graham's blog about startups, investments, and entrepreneurship.",
    },
    {
        "name": "Andrej Karpathy",
        "owner": "akarpathy",
        "email": "andrej@example.com",
        "url": "https://knotbin.xyz",
        "tags": [19, 20, 2, 3],
        "site_metadata": "Andrej Karpathy's blog about AI research and technology.",
    },
    {
        "name": "Matt Yao",
        "owner": "myao",
        "email": "matt@example.com",
        "url": "https://mattyao.co",
        "tags": [21, 2, 3, 4],
        "site_metadata": "Matt Yao's blog about career coaching.",
    },
    {
        "name": "Ross Lazerowitz",
        "owner": "rlazerowitz",
        "email": "ross@example.com",
        "url": "https://rosslazer.com",
        "tags": [1, 2, 3, 4, 5, 14, 19],
        "site_metadata": "Ross's personal blog about technology and life.",
    },
]


async def insert_sample_data(session: AsyncSession):
    """Insert sample data into the database"""
    async with session.begin():
        # Insert tags if they do not exist
        for tag in tags:
            existing_tag = await session.execute(
                select(Tag).where(Tag.name == tag["name"])
            )
            existing_tag = existing_tag.scalars().first()
            if not existing_tag:
                tag_obj = Tag(**tag)
                session.add(tag_obj)

        # Insert sites if they do not exist
        for site in sites:
            existing_site = await session.execute(
                select(Site).where(Site.url == site["url"])
            )
            existing_site = existing_site.scalars().first()
            if not existing_site:
                tag_objs = await session.execute(
                    select(Tag).where(Tag.id.in_(site["tags"]))
                )
                tag_objs = tag_objs.scalars().all()
                site_obj = Site(
                    name=site["name"],
                    owner=site["owner"],
                    email=site["email"],
                    url=site["url"],
                    site_metadata=site["site_metadata"],
                    tags=tag_objs,
                )
                session.add(site_obj)
        await session.commit()


@router.get("/insert-sample-data")
async def insert_data(session: AsyncSession = Depends(get_async_session)):
    """Insert sample data into the database"""
    await insert_sample_data(session)
    return {"message": "Sample data inserted successfully"}


@router.get("/ping")
async def ping():
    """Check if the API is running"""
    return {"message": "pong"}


@router.get("/sites", response_model=List[SiteBase])
async def get_sites(session: AsyncSession = Depends(get_async_session)):
    """Get all sites"""
    result = await session.execute(select(Site).options(joinedload(Site.tags)))
    sites = result.unique().scalars().all()
    return sites


@router.get("/tags", response_model=List[TagBase])
async def get_tags(session: AsyncSession = Depends(get_async_session)):
    result = await session.execute(select(Tag))
    tags = result.scalars().all()
    return tags


@router.post("/generate-presigned-url")
async def generate_presigned_url(request: PreSignedUrlRequest):
    """
    Endpoint to generate a presigned url for a file to be uploaded to S3.
    """
    try:
        unique_filename = f"{uuid.uuid4()}-{request.file_name}".replace(" ", "_")
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": AWS_BUCKET_NAME,
                "Key": unique_filename,
                "ContentType": request.file_type,
            },
            ExpiresIn=3600,  # URL valid for 1 hour
        )
        return {"url": presigned_url, "key": unique_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-upload-s3")
async def batch_upload(
    request: Request,
    files: List[UploadFile] = File(...),
    session: UserSession = Depends(login_required),
) -> dict:
    """
    Endpoint to upload multiple media files to S3. Validates files to ensure allowed filetype and under maximum size.
    """
    urls = []
    max_file_size = 5 * 1024 * 1024  # 5 MB
    allowed_types = ["image/jpeg", "image/png", "image/gif", "video/mp4"]

    try:
        for file in files:
            # Validate file size
            file_content = await file.read()
            if len(file_content) > max_file_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} exceeds size limit of 5 MB",
                )

            # Validate file type
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} has unsupported type {file.content_type}",
                )

            # Generate a unique filename
            unique_filename = f"{uuid.uuid4()}-{file.filename}".replace(" ", "_")
            public_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"

            # Upload file to S3
            s3_client.put_object(
                Bucket=AWS_BUCKET_NAME,
                Key=unique_filename,
                ContentType=file.content_type,
                Body=file_content,
            )

            urls.append(public_url)

        return {"file_urls": urls}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")


@router.post("/post")
async def create_post(
    request: CreatePostRequest,
    session: UserSession = Depends(login_required),
    db: AsyncSession = Depends(get_async_session),
):
    # Fetch or create tags
    tag_objs = []
    for tag_name in request.tags:
        try:
            # Check if the tag exists
            existing_tag = await db.execute(select(Tag).where(Tag.name == tag_name))
            existing_tag = existing_tag.scalars().first()

            if existing_tag:
                tag_objs.append(existing_tag)
            else:
                # Create a new tag if it doesn't exist
                new_tag = Tag(name=tag_name)
                db.add(new_tag)
                await db.flush()
                tag_objs.append(new_tag)
        except IntegrityError:
            # Handle race condition where tag was created by another request
            await db.rollback()
            existing_tag = await db.execute(select(Tag).where(Tag.name == tag_name))
            existing_tag = existing_tag.scalars().first()
            if existing_tag:
                tag_objs.append(existing_tag)

    post = Post(
        owner_id=session.user.id,
        title=request.title,
        note=request.note,
        urls=request.urls,
        tags=tag_objs,
        file_keys=request.file_keys,
    )
    try:
        db.add(post)
        await db.commit()
        await db.refresh(post)
    except SQLAlchemyError as e:
        await db.rollback()
        print(f"Error creating post: {e}")
        raise HTTPException(status_code=500, detail="Failed to create post") from e

    # Fetch post with relationships loaded
    result = await db.execute(
        select(Post).options(joinedload(Post.tags)).where(Post.id == post.id)
    )
    returned_post = result.unique().scalar_one()

    return PostResponse.from_orm(returned_post)


@router.delete("/post")
async def delete_post(
    request: DeletePostRequest,
    session: UserSession = Depends(login_required),
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    query = delete(Post).where(Post.id == request.id, Post.owner_id == session.user.id)
    try:
        result = await db.execute(query)
        await db.commit()

        if result.rowcount == 0:
            raise HTTPException(
                status_code=404, detail="Post not found or unauthorized"
            )

        return {"message": "Post deleted successfully"}

    except SQLAlchemyError as e:
        print(f"Database error while deleting post with id {request.id}: {e}")
        raise HTTPException(status_code=500, detail="Database error on delete post")

    except Exception as e:
        print(f"Unexpected error while deleting post with id {request.id}: {e}")
        raise HTTPException(status_code=500, detail="Unexpected error on delete post")


# @router.post("/post")
# async def create_post(
#     form_data: CreatePost,
#     user: User = Depends(login_required),
#     db: AsyncSession = Depends(get_async_session),
# ):
#     file_urls = []
#     allowed_types = {"image/jpeg", "image/png", "video/mp4"}
#     max_file_size = 10 * 1024 * 1024  # 10 MB
#
#     # Upload files to S3
#     for file in form_data.files:
#         # Validate file type
#         if file.content_type not in allowed_types:
#             raise HTTPException(status_code=400, detail="Unsupported file type")
#
#         # Compute file size
#         file_content = await file.read()
#         file_size = len(file_content)
#
#         # Validate file size
#         if file_size > max_file_size:
#             raise HTTPException(status_code=400, detail="File size exceeds limit")
#
#         # Reset file pointer before upload
#         file.file = BytesIO(file_content)
#
#         # Upload to S3
#         folder = "images" if file.content_type.startswith("image/") else "videos"
#         unique_filename = f"{folder}/{uuid.uuid4()}-{file.filename}"
#         s3_client.upload_fileobj(
#             file.file,
#             AWS_BUCKET_NAME,
#             unique_filename,
#             ExtraArgs={"ContentType": file.content_type},
#         )
#         file_url = (
#             f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"
#         )
#         file_urls.append(file_url)
#
#     # Handle tags
#     tags = []
#     for tag_name in form_data.tags:
#         tag = await db.execute(select(Tag).where(Tag.name == tag_name))
#         tag = tag.scalar_one_or_none()
#         if not tag:
#             tag = Tag(name=tag_name)
#             db.add(tag)
#         tags.append(tag)
#
#     # Create post
#     new_post = Post(note=form_data.note, urls=form_data.urls, file_keys=file_urls tags=tags, owner_id=user.id)
#     db.add(new_post)
#     await db.commit()
#     await db.refresh(new_post)
#
#     return {
#         "id": new_post.id,
#         "note": new_post.note,
#         "urls": new_post.urls,
#         "tags": new_post.tags,
#     }


# @router.post("/post")
# async def post_record(
#     form_data: RecordPost,
#     user: OAuthSession = Depends(login_required),
#     db=Depends(get_async_session),
# ):
#     req_url = f"{user.pds_url}/xrpc/com.atproto.repo.createRecord"
#     record_data = form_data.model_dump()
#     body = {
#         "repo": user.did,
#         "collection": "com.y.post",
#         # "validate": "true",
#         "record": record_data,
#     }
#
#     resp = await pds_authed_req("POST", req_url, body=body, user=user, db=db)
#
#     if "uri" not in resp.json():
#         raise HTTPException(status_code=500, detail="Failed to create record")
#
#     rkey = resp.json().get("uri").split("/")[-1]
#
#     post = Post(
#         did=user.did,
#         handle=user.handle,
#         rkey=rkey,
#         note=form_data.note,
#         tags=form_data.tags,
#         urls=form_data.urls,
#         collection="com.y.post",
#         created_at=form_data.created_at,
#     )
#
#     try:
#         db.add(post)
#         await db.commit()
#
#         await manager.broadcast(
#             {
#                 "type": "com.y.post",
#                 "data": {
#                     "did": user.did,
#                     "handle": user.handle,
#                     "note": form_data.note,
#                     "tags": form_data.tags,
#                     "urls": form_data.urls,
#                     "created_at": form_data.created_at.isoformat(),
#                 },
#             }
#         )
#     except IntegrityError:
#         await db.rollback()
#         raise HTTPException(status_code=400, detail="Post already exists")
#
#     return {"status": "Record created successfully", "response": resp.json()}
#
#
# @router.put("/post")
# async def edit_record(
#     request: RecordPut,
#     user: OAuthSession = Depends(login_required),
#     db=Depends(get_async_session),
# ):
#     parsed_req = request.model_dump()
#
#     # Convert to type RecordPost to comply with the lexicon. This effectively drops the rkey field
#     # which we do not want in the record body but still want to include in the PDS request.
#     record_body = RecordPost(**parsed_req).model_dump()
#
#     req_url = f"{user.pds_url}/xrpc/com.atproto.repo.putRecord"
#     body = {
#         "repo": user.did,
#         "collection": "com.y.post",
#         "rkey": parsed_req.get("rkey"),
#         "record": record_body,
#     }
#
#     resp = await pds_authed_req("POST", req_url, body=body, user=user, db=db)
#
#     if "uri" not in resp.json():
#         raise HTTPException(status_code=500, detail="Failed to update record")
#
#     async with db.begin():
#         existing_post = await db.execute(
#             select(Post).where(
#                 Post.rkey == parsed_req.get("rkey"), Post.did == user.did
#             )
#         )
#         existing_post = existing_post.scalars().first()
#
#         if not existing_post:
#             raise HTTPException(
#                 status_code=404, detail="Record not found in the database"
#             )
#
#         existing_post.note = parsed_req.get("note", existing_post.note)
#         existing_post.tags = parsed_req.get("tags", existing_post.tags)
#         existing_post.urls = parsed_req.get("urls", existing_post.urls)
#         existing_post.created_at = parsed_req.get(
#             "created_at", existing_post.created_at
#         )
#
#         try:
#             db.add(existing_post)
#             await db.commit()
#         except IntegrityError:
#             await db.rollback()
#             raise HTTPException(
#                 status_code=400, detail="Failed to update record in the database"
#             )
#
#     return {"status": "Record updated successfully", "response": resp.json()}
#
#
# @router.delete("/post")
# async def delete_record(
#     request: RecordDelete,
#     user: OAuthSession = Depends(login_required),
#     db: AsyncSession = Depends(get_async_session),
# ):
#     req_url = f"{user.pds_url}/xrpc/com.atproto.repo.deleteRecord"
#     body = {"repo": user.did, "collection": request.collection, "rkey": request.rkey}
#
#     resp = await pds_authed_req("POST", req_url, body=body, user=user, db=db)
#
#     if resp.status_code != 200:
#         raise HTTPException(status_code=500, detail="Failed to delete record")
#
#     async with db.begin():
#         existing_post = await db.execute(
#             select(Post).where(Post.rkey == request.rkey, Post.did == user.did)
#         )
#         existing_post = existing_post.scalars().first()
#
#         if not existing_post:
#             raise HTTPException(
#                 status_code=404, detail="Record not found in the database"
#             )
#
#         await db.delete(existing_post)
#
#         try:
#             await db.commit()
#         except IntegrityError:
#             await db.rollback()
#             raise HTTPException(
#                 status_code=400, detail="Failed to delete record in the database"
#             )
#
#     return {"status": "Record deleted successfully", "response": resp.json()}
#


@router.get("/recent-posts", response_model=List[FrontendPost])
async def get_recent_posts(
    limit: int = 10, db: AsyncSession = Depends(get_async_session)
) -> List[FrontendPost]:
    result = await db.execute(
        select(Post)
        .options(selectinload(Post.owner), selectinload(Post.tags))
        .order_by(Post.created_at.desc())
        .limit(limit)
    )
    posts = result.scalars().all()

    frontend_posts = [
        FrontendPost(
            id=post.id,
            owner_id=post.owner_id,
            owner=post.owner.username,
            title=post.title,
            note=post.note,
            urls=post.urls or [],
            tags=[tag.name for tag in post.tags],
            file_keys=post.file_keys or [],
            created_at=post.created_at,
        )
        for post in posts
    ]

    return frontend_posts
