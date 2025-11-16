# api/dependencies.py
from typing import Literal
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.security import decode_token
from utils.logger import get_logger

security = HTTPBearer(auto_error=False)
Owner = Literal["kullanici1", "kullanici2"]
logger = get_logger(__name__)

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> Owner:
    if creds is None or not creds.credentials:
        logger.warning("Authentication failed: No credentials provided")
        raise HTTPException(status_code=401, detail="Kimlik doğrulama gerekli.")
    
    token = creds.credentials
    payload = decode_token(token)
    
    if not payload:
        logger.warning(f"Authentication failed: Token decode failed (token: {token[:20]}...)")
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token.")
    
    if "sub" not in payload:
        logger.warning(f"Authentication failed: Token missing 'sub' field (payload keys: {list(payload.keys())})")
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token.")
    
    sub = payload["sub"]
    if sub not in ("kullanici1", "kullanici2"):
        logger.warning(f"Authentication failed: Unauthorized user '{sub}'")
        raise HTTPException(status_code=403, detail="Yetkisiz kullanıcı.")
    
    return sub  # owner
