# api/routes/auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from utils.security import identify_owner_by_password, create_access_token

router = APIRouter()

class LoginRequest(BaseModel):
    password: str = Field(..., min_length=48, max_length=48)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    owner: str

@router.post("/login", response_model=LoginResponse, summary="48 haneli parola ile giriş")
def login(body: LoginRequest):
    owner = identify_owner_by_password(body.password)
    if not owner:
        # Her zaman aynı hata, timing/enum sızdırmamak için
        raise HTTPException(status_code=401, detail="Geçersiz kimlik bilgileri.")
    token = create_access_token({"sub": owner})
    return LoginResponse(access_token=token, owner=owner)

@router.get("/me")
def me():
    return {"message": "Auth çalışma testi için. /validate veya guard kullanılan uçları tercih et."}
