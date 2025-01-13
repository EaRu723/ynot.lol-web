from typing import List, Optional

from pydantic import BaseModel, Field


class PreSignedUrlRequest(BaseModel):
    file_name: str
    file_type: str


class GoogleAuthRequest(BaseModel):
    id_token: str


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


class GetPosts(BaseModel):
    username: str


class CreatePost(BaseModel):
    note: str
    tags: List[str] = []
    urls: List[str] = []
    file_keys: List[str] = []  # S3 keys for uploaded files


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
    note: str
    did: str = ""
    handle: str = ""
    urls: List[str]
    tags: List[str]
    collection: str
    rkey: str


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
