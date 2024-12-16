from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

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


class User(Base):
    __tablename__ = "users"
    handle = Column(String, primary_key=True, index=True)
    description = Column(String, nullable=True)
    disabled = Column(Boolean, nullable=True)
    hashed_password = Column(String, nullable=False)
    session = Column(String, nullable=True)


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


class UserLogin(BaseModel):
    handle: str
    password: str


class UserBase(BaseModel):
    handle: str
    description: str | None = None
    disabled: bool | None = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    handle: str
    password: str
    description: str | None = None
    disabled: bool | None = None


class UserInDB(UserBase):
    hashed_password: str
    session: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    handle: str


class RefreshToken(BaseModel):
    refresh_token: str


class TokenData(BaseModel):
    handle: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class RecordPost(BaseModel):
    title: str
    description: str
    urls: List[str]
    tags: List[str]
    collection: Optional[str] = None
    rkey: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    time_elapsed: Optional[str] = None


class DeletePost(BaseModel):
    collection: str
    rkey: str
