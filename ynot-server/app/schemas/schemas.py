from datetime import datetime
from typing import List, Optional

from pydantic import AnyHttpUrl, BaseModel, Field, HttpUrl


class PreSignedUrlRequest(BaseModel):
    file_name: str
    file_type: str


class GoogleAuthRequest(BaseModel):
    id_token: str


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
    avatar: Optional[str] = None
    banner: Optional[str] = None


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
    urls: List[HttpUrl] = []
    file_keys: List[AnyHttpUrl] = []  # S3 URLs for uploaded files


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
    urls: Optional[List[HttpUrl]]
    tags: List[str]
    file_keys: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True


class GetUserResponse(BaseModel):
    email: str
    display_name: str
    username: str
    bio: Optional[str] = ""
    avatar: str
    banner: str
