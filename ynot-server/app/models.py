from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table, MetaData, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base(metadata = MetaData())

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


class FrontendPost(BaseModel):
    note: str
    urls: List[str]
    tags: List[str]
    collection: Optional[str] = None
    rkey: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    time_elapsed: Optional[str] = None

class RecordPost(BaseModel):
    note: str
    tags: List[str]
    urls: List[str]
    createdAt: datetime = Field(default_factory=datetime.now)


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