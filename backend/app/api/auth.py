from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    # Hardcoded admin credentials for the MVP evaluation
    if request.username == "admin" and request.password == "password123":
        return {
            "access_token": "optimus-admin-token-7x9z",
            "token_type": "bearer",
            "username": "admin"
        }
    
    raise HTTPException(status_code=401, detail="Invalid username or password")
