from datetime import datetime
from typing import List, Optional

from pydantic import AnyHttpUrl, BaseModel, Field, HttpUrl
from sqlalchemy import DateTime


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
    note: str
    tags: List[str] = []
    urls: List[HttpUrl] = []
    file_keys: List[AnyHttpUrl] = []  # S3 URLs for uploaded files


class DeletePostRequest(BaseModel):
    id: int


class PostResponse(BaseModel):
    id: int
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
    note: str
    urls: Optional[List[HttpUrl]]
    tags: List[str]
    file_keys: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True


class RecordPut(BaseModel):
    note: str
    tags: List[str]
    urls: List[str]
    rkey: str


class RecordDelete(BaseModel):
    collection: str
    rkey: str

    class Config:
        from_attributes = True


class GetUserResponse(BaseModel):
    email: str
    username: str
    bio: Optional[str] = ""
    avatar: str
    banner: str


class UserPost(BaseModel):
    display_name: str
    bio: Optional[str] = ""
    avatar: str
    banner: str
