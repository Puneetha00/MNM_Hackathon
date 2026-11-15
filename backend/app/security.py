import json
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.collaboration import CaregiverElderlyLink

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def hash_passcode(passcode: str) -> str:
    return pwd_context.hash(passcode)

def verify_passcode(plain_passcode: str, hashed_passcode: str) -> bool:
    if not hashed_passcode:
        return False
    try:
        return pwd_context.verify(plain_passcode, hashed_passcode)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_val = payload.get("sub")
        if user_id_val is None:
            raise credentials_exception
        user_id = int(user_id_val)
    except Exception:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{current_user.role}'"
            )
        return current_user
    return role_checker

def check_elderly_access(
    elderly_id: int, 
    current_user: User, 
    db: Session, 
    required_permission: Optional[str] = None
) -> bool:
    """
    Checks if current_user has authorized access to the elderly user's healthcare data.
    - If user is the elderly user themselves: full access.
    - If user is admin: full access.
    - If user is caregiver or family: checks active CaregiverElderlyLink and specific permission.
    """
    if current_user.id == elderly_id:
        return True
    if current_user.role == "admin":
        return True
        
    link = db.query(CaregiverElderlyLink).filter(
        CaregiverElderlyLink.elderly_id == elderly_id,
        CaregiverElderlyLink.member_id == current_user.id,
        CaregiverElderlyLink.status == "active"
    ).first()
    
    if not link:
        return False
        
    if required_permission:
        perm_value = getattr(link, required_permission, False)
        return bool(perm_value)
        
    return True

def log_audit(
    db: Session,
    action: str,
    category: str,
    user_id: Optional[int] = None,
    request: Optional[Request] = None,
    details: Optional[Dict[str, Any]] = None
):
    ip_addr = None
    ua = None
    if request:
        ip_addr = request.client.host if request.client else "127.0.0.1"
        ua = request.headers.get("user-agent", "Unknown")
        
    audit = AuditLog(
        user_id=user_id,
        action=action,
        category=category,
        ip_address=ip_addr,
        user_agent=ua,
        details_json=json.dumps(details or {}),
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
