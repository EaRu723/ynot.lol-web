import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

DATABASE_URL = f"postgresql+asyncpg://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@db:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"


class Settings(BaseSettings):
    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str
    postgres_port: int
    app_port: int
    app_env: str
    app_url: str
    # atprotocol_client_id: str
    # atprotocol_client_secret: str
    # atprotocol_redirect_uri: str
    # path_to_private_key: str
    jwt_secret: str
    private_jwk: str
    session_secret: str
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str

    class Config:
        env_file = ".env"


settings = Settings()
