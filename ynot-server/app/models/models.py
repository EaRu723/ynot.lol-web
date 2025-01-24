from datetime import datetime, timezone

from sqlalchemy import (JSON, Boolean, CheckConstraint, Column, DateTime,
                        ForeignKey, Integer, MetaData, String, Table, Text,
                        func)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base(metadata=MetaData())

site_tag_association = Table(
    "site_tag_association",
    Base.metadata,
    Column("site_id", Integer, ForeignKey("sites.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)

post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    note = Column(Text, nullable=False)
    urls = Column(JSON, nullable=True)  # Parsed urls from post note
    file_keys = Column(JSON, nullable=True)  # S3 urls for uploaded files
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    tags = relationship("Tag", secondary=post_tags, back_populates="posts")
    owner = relationship("User", back_populates="posts")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, index=True)

    posts = relationship("Post", secondary=post_tags, back_populates="tags")
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

    id = Column(Integer, primary_key=True, autoincrement=True)
    login_id = Column(String, unique=True, index=True)
    ownid_data = Column(Text)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    username = Column(String, unique=True)
    bio = Column(Text, unique=True)
    avatar = Column(String, nullable=True)
    banner = Column(String, nullable=True)
    is_profile_complete = Column(Boolean, default=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    sessions = relationship(
        "UserSession", back_populates="user", cascade="all, delete-orphan"
    )
    posts = relationship("Post", back_populates="owner")

    # __table_args__ = (
    #     CheckConstraint("LENGTH(ownid_data) >= 5000", name="ownid_data_min_length"),
    # )

    def __repr__(self):
        return f"<User(id={self.id}, google_id={self.login_id}, email={self.email})>"


class UserSession(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_token = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at = Column(DateTime(timezone=True), nullable=False)
    ip_address = Column(String, nullable=True)  # Optional: Store the user's IP address
    user_agent = Column(
        String, nullable=True
    )  # Optional: Store the user's user agent string
    is_active = Column(Boolean, nullable=False, default=True)

    user = relationship("User", back_populates="sessions")
