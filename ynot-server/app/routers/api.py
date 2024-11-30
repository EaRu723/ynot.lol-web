from typing import List, Optional
from atproto import Client
from fastapi import APIRouter, Depends, Request, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.models import DeletePost, Site, Tag, SiteBase, TagBase, Token, UserBase, UserLogin, RecordPost
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


@router.get("/insert-sample-data")
async def insert_data(session: AsyncSession = Depends(get_async_session)):
    await insert_sample_data(session)
    return {"message": "Sample data inserted successfully"}


@router.get("/ping")
async def ping():
    return {"message": "pong"}


@router.get("/sites", response_model=List[SiteBase])
async def get_sites(session: AsyncSession = Depends(get_async_session)):
    result = await session.execute(select(Site).options(joinedload(Site.tags)))
    sites = result.unique().scalars().all()
    return sites


@router.get("/tags", response_model=List[TagBase])
async def get_tags(session: AsyncSession = Depends(get_async_session)):
    result = await session.execute(select(Tag))
    tags = result.scalars().all()
    return tags


@router.post("/get-profile")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    client = get_async_client()
    profile = await client.login(form_data.username, form_data.password)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect handle or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"profile": profile}

@router.post("/post")
async def post_record(form_data: RecordPost, current_user: User = Depends(get_current_active_user)):
    client = get_async_client()
    if not current_user.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing atproto session. Please re-authenticate.",
        )

    await client.login(session_string=current_user.session)

    record_data = form_data.model_dump()

    response = await client.com.atproto.repo.create_record(
        data = models.ComAtprotoRepoCreateRecord.Data(
            repo=client.me.did,
            collection="com.ynot.post",
            record=record_data,
        )
    )

    if not response or not hasattr(response, "uri"):
        raise HTTPException(status_code=500, detail="Failed to create record")

    return {
        "response": response,
    }

@router.delete("/post")
async def delete_record(request: DeletePost, current_user: User = Depends(get_current_active_user)):
    client = get_async_client()
    if not current_user.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing atproto session. Please re-authenticate.",
        )

    await client.login(session_string=current_user.session)

    try:
        response = await client.com.atproto.repo.delete_record(
            models.ComAtprotoRepoDeleteRecord.Data(
                repo=client.me.did,
                collection=request.collection,
                rkey=request.rkey
            )
        )
    except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete record: {str(e)}")

    return {"status": "Record deleted successfully", "commit": response.commit}


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: UserLogin, db: AsyncSession = Depends(get_async_session)):
    print(form_data)
    user = await get_user(db, form_data.handle)
    if not user:
        client = get_async_client()
        try:
            profile = await client.login(form_data.handle, form_data.password)
        except Exception as e:
            print(e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid ATProto/Bluesky credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Export session string
        session_string = client.export_session_string()

        # Add user to database
        user_data = {
            "handle": profile.handle,
            "description": profile.description,
            "hashed_password": get_password_hash(form_data.password),
            "session": session_string,
            "disabled": False,
        }        
        new_user = User(**user_data)
        db.add(new_user)
        await db.commit()
        user = new_user
    

    # Generate JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await create_access_token(
        db=db ,data={"sub": user.handle}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "handle": user.handle}


@router.get("/users/me", response_model=UserBase)
async def read_users_me(current_user: UserBase = Depends(get_current_active_user)):
    return current_user

