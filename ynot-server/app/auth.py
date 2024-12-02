from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.config import settings
from app.db.db import get_async_session
from app.models import TokenData, UserInDB, User

# Secret key to encode and decode JWT tokens
SECRET_KEY = settings.jwt_secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# Retrieve a user from the database by handle
async def get_user(db: AsyncSession, handle: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.handle == handle))
    user = result.scalars().first()
    if user:
        return user
    return None


async def authenticate_user(db: AsyncSession, handle: str, password: str) -> Optional[UserInDB]:
    user = await get_user(db, handle)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def create_access_token(db: AsyncSession, data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    handle = data.get("sub")
    user = await get_user(db, handle)
    if not user:
        user_data = {
            "handle": handle,
            "description": data.get("description"),
            "hashed_password": get_password_hash(data.get("password")),
            "disabled": False,
        }
        new_user = User(**user_data)
        db.add(new_user)
        await db.commit()

    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_refresh_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(payload)
        return payload
    except JWTError as e:
        print(e)
        return None


# Validates the JWT token and returns the corresponding user
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_async_session)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        handle: str = payload.get("sub")
        if handle is None:
            raise credentials_exception
        token_data = TokenData(handle=handle)
    except JWTError as e:
        raise credentials_exception

    # Retrieve the user from DB
    user = await get_user(db, handle=token_data.handle)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user