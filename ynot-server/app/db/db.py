from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

db_url = f"postgresql+asyncpg://{settings.postgres_user}:{settings.postgres_password}@db:{settings.postgres_port}/{settings.postgres_db}"

engine = create_async_engine(db_url, echo=True)
async_session = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_async_session():
    async with async_session() as session:
        yield session
