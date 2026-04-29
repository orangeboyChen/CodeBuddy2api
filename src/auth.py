"""
Authentication module for CodeBuddy2API
"""
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from config import get_server_password

security = HTTPBearer()


def authenticate(credentials = Depends(security)) -> str:
    """验证用户身份"""
    password = get_server_password()
    if not password:
        raise HTTPException(
            status_code=500, 
            detail="CODEBUDDY_PASSWORD is not configured on the server."
        )
    
    token = credentials.credentials
    if token != password:
        raise HTTPException(status_code=403, detail="Invalid password")
    
    return token