from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str
    postgres_port: int
    app_port: int
    app_env: str
    app_url: str
    jwt_secret: str
    private_jwk: str
    session_secret: str
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    aws_access_key: str
    aws_secret_key: str
    aws_bucket_name: str
    ownid_shared_secret: str
    lsd_url: str
    lsd_db: str
    lsd_user: str
    lsd_host: str
    lsd_password: str

    class Config:
        env_file = ".env"


settings = Settings()
