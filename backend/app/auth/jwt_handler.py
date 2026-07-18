from jose import jwt, JWTError
from datetime import datetime, timedelta

SECRET_KEY = "multisupport_ai_secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:
        return None

from fastapi import HTTPException

def check_role(authorization: str, allowed_roles: list) -> dict:
    if authorization is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization token missing"
        )
    token = authorization.replace("Bearer ", "")
    user = verify_token(token)
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )
    if user.get("role") not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Access Denied"
        )
    return user