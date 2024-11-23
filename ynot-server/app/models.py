from pydantic import BaseModel
from typing import List


class Site(BaseModel):
    name: str
    url: str
    tags: List[str]
    metadata: str
