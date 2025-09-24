# api/dependencies.py
from typing import Literal
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.security import decode_token

security = HTTPBearer(auto_error=False)
Owner = Literal["kullanici1", "kullanici2"]

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> Owner:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=401, detail="Kimlik doğrulama gerekli.")
    payload = decode_token(creds.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token.")
    sub = payload["sub"]
    if sub not in ("kullanici1", "kullanici2"):
        raise HTTPException(status_code=403, detail="Yetkisiz kullanıcı.")
    return sub  # owner
