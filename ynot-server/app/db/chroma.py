from contextlib import asynccontextmanager

import chromadb

from app.config import settings


@asynccontextmanager
async def get_chroma_client():
    client = await chromadb.AsyncHttpClient(host="chromadb", port=settings.chroma_port)
    try:
        yield client
    finally:
        pass
