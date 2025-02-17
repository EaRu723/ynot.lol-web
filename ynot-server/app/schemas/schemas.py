from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class PreSignedUrlRequest(BaseModel):
    file_name: str
    file_type: str


class GoogleAuthRequest(BaseModel):
    id_token: str


class AltRegistrationRequest(BaseModel):
    email: str
    username: str
    password: str


class AltLoginRequest(BaseModel):
    email: str
    password: str


class RegistrationRequest(BaseModel):
    loginId: str
    ownIdData: str
    email: str


class LoginRequest(BaseModel):
    ownIdData: str
    token: str
    userAgent: str


class UpdateProfileRequest(BaseModel):
    displayName: str
    bio: str
    avatarUrl: Optional[str]
    bannerUrl: Optional[str]


class SetOwnIdDataRequest(BaseModel):
    loginId: str
    ownIdData: str


class GetOwnIdDataRequest(BaseModel):
    loginId: str


class GetSessionRequest(BaseModel):
    loginId: str


class ProfileCompletionRequest(BaseModel):
    username: str
    displayName: str
    avatar: Optional[str] = None
    banner: Optional[str] = None


class CreateBookmarkRequest(BaseModel):
    url: str
    highlight: Optional[str]
    note: Optional[str]


class BookmarkResponse(BaseModel):
    id: int
    owner_id: int
    url: str
    highlight: Optional[str]
    note: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            owner_id=obj.owner_id,
            url=obj.url,
            highlight=obj.highlight or "",
            note=obj.note or "",
            created_at=obj.created_at.isoformat(),  # Convert datetime to ISO 8601 string
        )


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


class CreatePostRequest(BaseModel):
    title: str = ""
    note: str
    tags: List[str] = []
    urls: List[str] = []
    file_keys: List[str] = []  # S3 URLs for uploaded files


class DeletePostRequest(BaseModel):
    id: int


class PostResponse(BaseModel):
    id: int
    title: Optional[str]
    note: str
    tags: List[TagBase]
    urls: List[str]
    file_keys: List[str]
    created_at: str

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            title=obj.title,
            note=obj.note,
            tags=[TagBase.model_validate(tag) for tag in obj.tags],
            urls=obj.urls or [],
            file_keys=obj.file_keys or [],
            created_at=obj.created_at.isoformat(),  # Convert datetime to ISO 8601 string
        )


class FrontendPost(BaseModel):
    id: int
    owner_id: int
    owner: str
    title: Optional[str]
    note: str
    urls: Optional[List[str]]
    tags: List[str]
    file_keys: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            owner_id=obj.owner_id,
            owner=obj.owner.username,
            title=obj.title,
            note=obj.note,
            urls=[url.url for url in obj.urls] if obj.urls else [],
            tags=[tag.name for tag in obj.tags] if obj.tags else [],
            file_keys=obj.file_keys or [],
            created_at=obj.created_at.isoformat(),
        )


class GetUserResponse(BaseModel):
    email: str
    display_name: Optional[str]
    username: str
    bio: Optional[str] = ""
    avatar: str
    banner: Optional[str]
