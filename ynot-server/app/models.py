from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import (JSON, Column, DateTime, ForeignKey, Integer,
                        MetaData, String, Table, Text)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base(metadata=MetaData())

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
    tags: List[TagBase] = Field(default_factory=list)

    class Config:
        from_attributes = True


class FrontendPost(BaseModel):
    note: str
    did: str = None
    handle: str = None
    urls: List[str]
    tags: List[str]
    collection: str
    rkey: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RecordPost(BaseModel):
    note: str
    tags: List[str]
    urls: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RecordPut(BaseModel):
    note: str
    tags: List[str]
    urls: List[str]
    rkey: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RecordDelete(BaseModel):
    collection: str
    rkey: str

    class Config:
        from_attributes = True


class OAuthAuthRequestBase(BaseModel):
    state: str
    authserver_iss: str
    did: Optional[str] = None
    handle: Optional[str] = None
    pds_url: Optional[str] = None
    pkce_verifier: str
    scope: str
    dpop_authserver_nonce: str
    dpop_private_ec_key: dict

    class Config:
        arbitrary_types_allowed = True
        from_attributes = True


class OAuthAuthRequest(Base):
    __tablename__ = "oauth_auth_request"

    state = Column(String, primary_key=True)
    authserver_iss = Column(String, nullable=False)
    did = Column(String, nullable=True)
    handle = Column(String, nullable=True)
    pds_url = Column(String, nullable=True)
    pkce_verifier = Column(String, nullable=False)
    scope = Column(String, nullable=False)
    dpop_authserver_nonce = Column(String, nullable=False)
    dpop_private_ec_key = Column(JSON, nullable=False)


class OAuthSession(Base):
    __tablename__ = "oauth_session"
    did = Column(String, primary_key=True)
    handle = Column(String)
    pds_url = Column(String)
    authserver_iss = Column(String)
    access_token = Column(String)
    refresh_token = Column(String)
    dpop_authserver_nonce = Column(String)
    dpop_private_jwk = Column(JSON, nullable=False)


class User(Base):
    __tablename__ = "users"
    did = Column(String, primary_key=True)
    handle = Column(String)
    display_name = Column(String)
    bio = Column(String, default="")
    avatar = Column(String)
    banner = Column(String)
    pds_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())


class UserPost(BaseModel):
    display_name: str
    bio: Optional[str] = ""
    avatar: str
    banner: str

class UserReq(BaseModel):
    did: str
    pds_url: str
    display_name: str
    bio: Optional[str] = ""
    avatar: str
    banner: str


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    did = Column(String, nullable=False)
    handle = Column(String, nullable=False)
    rkey = Column(String, unique=True, nullable=False, index=True)
    note = Column(Text, nullable=False)
    tags = Column(JSON, nullable=True)
    urls = Column(JSON, nullable=True)
    collection = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
