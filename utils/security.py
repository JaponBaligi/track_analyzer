# utils/security.py
import os
import hmac
import time
from typing import Optional, Literal, Dict, Any
from jose import jwt, JWTError

ALGORITHM = os.getenv("JWT_ALGORITHM")
USER1_PASSWORD = os.getenv("USER1_PASSWORD", "")
USER2_PASSWORD = os.getenv("USER2_PASSWORD", "")
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME__VERY_LONG_RANDOM")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 gün

Owner = Literal["kullanici1", "kullanici2"]

def constant_time_equals(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))

def identify_owner_by_password(password: str) -> Optional[Owner]:
    if len(password) != 48:
        return None
    if USER1_PASSWORD and constant_time_equals(password, USER1_PASSWORD):
        return "kullanici1"
    if USER2_PASSWORD and constant_time_equals(password, USER2_PASSWORD):
        return "kullanici2"
    return None

def create_access_token(data: Dict[str, Any], expires_minutes: Optional[int] = None) -> str:
    to_encode = data.copy()
    now = int(time.time())
    exp_minutes = expires_minutes if expires_minutes is not None else JWT_EXPIRE_MINUTES
    exp = now + exp_minutes * 60
    to_encode.update({"iat": now, "exp": exp})
    token = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return token

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
