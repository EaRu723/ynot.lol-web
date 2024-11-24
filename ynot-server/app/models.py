from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from typing import List, Optional


Base = declarative_base()


# class User(Base):
#     __tablename__ = "users"
#     id = Column(Integer, primary_key=True, index=True)
#     username = Column(String, unique=True, index=True)
#     email = Column(String, unique=True, index=True)
#     url = Column(String, index=True)


class Site(Base):
    __tablename__ = "sites"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    url = Column(String, unique=True, index=True)
    tags = Column(String, index=True)
    site_metadata = Column(String, index=True)

class SiteBase(BaseModel):
    id: int
    name: str
    url: str
    tags: str
    site_metadata: Optional[str] = None

    class Config:
        from_attributes = True