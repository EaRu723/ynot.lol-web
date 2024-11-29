from datetime import datetime
from sqlalchemy import Column, ForeignKey, Integer, String, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
from typing import List, Optional


Base = declarative_base()

site_tag_association = Table(
    "site_tag_association",
    Base.metadata,
    Column("site_id", Integer, ForeignKey("sites.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, index=True)
    sites = relationship("Site", secondary=site_tag_association, back_populates="tags")


class Site(Base):
    __tablename__ = "sites"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, index=True)
    owner = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    url = Column(String, unique=True, index=True)
    site_metadata = Column(String, index=True)
    tags = relationship("Tag", secondary=site_tag_association, back_populates="sites")


class TagBase(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class SiteBase(BaseModel):
    id: int
    name: str
    owner: str
    email: str
    url: str
    site_metadata: Optional[str] = None
    tags: List[TagBase] = []

    class Config:
        from_attributes = True


# atproto models
class User(BaseModel):
    handle: str
    description: str | None = None
    disabled: bool | None = None


class UserInDB(User):
    hashed_password: str
    session: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class PostRecordRequest(BaseModel):
    username: str
    collection: str
    record: dict


class GetRecordRequest(BaseModel):
    username: str
    collection: str
    rkey: str


class BlogPost(BaseModel):
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.now)