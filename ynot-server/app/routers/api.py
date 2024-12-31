from typing import List

from fastapi import (APIRouter, Depends, HTTPException, Request, WebSocket,
                     WebSocketDisconnect)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.db import get_async_session
from app.middleware.user_middleware import login_required
from app.models import (FrontendPost, OAuthSession, Post, RecordDelete,
                        RecordPost, RecordPut, Site, SiteBase, Tag, TagBase)
from app.routers.oauth.atproto_oauth import pds_authed_req

router = APIRouter()


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


@router.post("/post")
async def post_record(
    form_data: RecordPost,
    user: OAuthSession = Depends(login_required),
    db=Depends(get_async_session),
):
    req_url = f"{user.pds_url}/xrpc/com.atproto.repo.createRecord"
    record_data = form_data.model_dump()
    body = {
        "repo": user.did,
        "collection": "com.y.post",
        # "validate": "true",
        "record": record_data,
    }

    resp = await pds_authed_req("POST", req_url, body=body, user=user, db=db)

    if "uri" not in resp.json():
        raise HTTPException(status_code=500, detail="Failed to create record")

    rkey = resp.json().get("uri").split("/")[-1]

    post = Post(
        did=user.did,
        handle=user.handle,
        rkey=rkey,
        note=form_data.note,
        tags=form_data.tags,
        urls=form_data.urls,
        collection="com.y.post",
        created_at=form_data.created_at,
    )

    try:
        db.add(post)
        await db.commit()

        await manager.broadcast(
            {
                "type": "com.y.post",
                "data": {
                    "did": user.did,
                    "handle": user.handle,
                    "note": form_data.note,
                    "tags": form_data.tags,
                    "urls": form_data.urls,
                    "created_at": form_data.created_at.isoformat(),
                },
            }
        )
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Post already exists")

    return {"status": "Record created successfully", "response": resp.json()}


@router.put("/post")
async def edit_record(
    request: RecordPut,
    user: OAuthSession = Depends(login_required),
    db=Depends(get_async_session),
):
    parsed_req = request.model_dump()

    # Convert to type RecordPost to comply with the lexicon. This effectively drops the rkey field
    # which we do not want in the record body but still want to include in the PDS request.
    record_body = RecordPost(**parsed_req).model_dump()

    req_url = f"{user.pds_url}/xrpc/com.atproto.repo.putRecord"
    body = {
        "repo": user.did,
        "collection": "com.y.post",
        "rkey": parsed_req.get("rkey"),
        "record": record_body,
    }

    resp = await pds_authed_req("POST", req_url, body=body, user=user, db=db)

    if "uri" not in resp.json():
        raise HTTPException(status_code=500, detail="Failed to update record")

    async with db.begin():
        existing_post = await db.execute(
            select(Post).where(
                Post.rkey == parsed_req.get("rkey"), Post.did == user.did
            )
        )
        existing_post = existing_post.scalars().first()

        if not existing_post:
            raise HTTPException(
                status_code=404, detail="Record not found in the database"
            )

        existing_post.note = parsed_req.get("note", existing_post.note)
        existing_post.tags = parsed_req.get("tags", existing_post.tags)
        existing_post.urls = parsed_req.get("urls", existing_post.urls)
        existing_post.created_at = parsed_req.get(
            "created_at", existing_post.created_at
        )

        try:
            db.add(existing_post)
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise HTTPException(
                status_code=400, detail="Failed to update record in the database"
            )

    return {"status": "Record updated successfully", "response": resp.json()}


@router.delete("/post")
async def delete_record(
    request: RecordDelete,
    user: OAuthSession = Depends(login_required),
    db: AsyncSession = Depends(get_async_session),
):
    req_url = f"{user.pds_url}/xrpc/com.atproto.repo.deleteRecord"
    body = {"repo": user.did, "collection": request.collection, "rkey": request.rkey}

    resp = await pds_authed_req("POST", req_url, body=body, user=user, db=db)

    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to delete record")

    async with db.begin():
        existing_post = await db.execute(
            select(Post).where(Post.rkey == request.rkey, Post.did == user.did)
        )
        existing_post = existing_post.scalars().first()

        if not existing_post:
            raise HTTPException(
                status_code=404, detail="Record not found in the database"
            )

        await db.delete(existing_post)

        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise HTTPException(
                status_code=400, detail="Failed to delete record in the database"
            )

    return {"status": "Record deleted successfully", "response": resp.json()}


@router.get("/recent-posts", response_model=List[FrontendPost])
async def get_recent_posts(
    limit: int = 10, db: AsyncSession = Depends(get_async_session)
):
    result = await db.execute(
        select(Post).order_by(Post.created_at.desc()).limit(limit)
    )
    posts = result.scalars().all()

    frontend_posts = [
        FrontendPost(
            handle=post.handle,
            did=post.did,
            note=post.note,
            urls=post.urls or [],
            tags=post.tags or [],
            collection=post.collection,
            rkey=post.rkey,
            created_at=post.created_at,
        )
        for post in posts
    ]

    return frontend_posts


@router.get("/whoami")
async def whoami(user: OAuthSession = Depends(login_required)):
    return {"user": {"handle": user.handle, "did": user.did}}
