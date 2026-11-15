import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.health_profile import HealthProfile
from app.schemas.auth import (
    UserRegister, UserLogin, PasscodeVerify, 
    UserProfileUpdate, UserResponse, Token
)
from app.security import (
    hash_password, verify_password, hash_passcode, verify_passcode,
    create_access_token, get_current_user, log_audit
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_data: UserRegister, request: Request, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
        
    passcode_h = hash_passcode(user_data.passcode) if user_data.passcode else None
    
    new_user = User(
        email=user_data.email.lower(),
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        phone=user_data.phone,
        passcode_hash=passcode_h,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # If elderly, create health profile
    if new_user.role == "elderly":
        hp = HealthProfile(
            user_id=new_user.id,
            allergies_json="[]",
            conditions_json="[]",
            emergency_contacts_json="[]"
        )
        db.add(hp)
        db.commit()
        
    log_audit(db, "USER_REGISTER", "AUTH", user_id=new_user.id, request=request, details={"role": new_user.role})
    
    token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email, "role": new_user.role})
    
    user_dict = {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "phone": new_user.phone,
        "avatar_url": new_user.avatar_url,
        "mfa_enabled": new_user.mfa_enabled,
        "is_active": new_user.is_active,
        "has_passcode": bool(new_user.passcode_hash),
        "inactivity_timeout_minutes": new_user.inactivity_timeout_minutes,
        "accessibility_mode": new_user.accessibility_mode,
        "large_font": new_user.large_font,
        "high_contrast": new_user.high_contrast,
        "voice_enabled": new_user.voice_enabled,
        "email_notifications": new_user.email_notifications,
        "push_notifications": new_user.push_notifications,
        "sound_alerts": new_user.sound_alerts,
        "reminder_advance_minutes": new_user.reminder_advance_minutes,
        "created_at": new_user.created_at.isoformat()
    }
    
    return {"access_token": token, "token_type": "bearer", "user": user_dict}

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        log_audit(db, "LOGIN_FAILED", "SECURITY", user_id=user.id if user else None, request=request, details={"attempted_email": login_data.email})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated"
        )
        
    log_audit(db, "LOGIN_SUCCESS", "AUTH", user_id=user.id, request=request, details={"role": user.role})
    
    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    
    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "mfa_enabled": user.mfa_enabled,
        "is_active": user.is_active,
        "has_passcode": bool(user.passcode_hash),
        "inactivity_timeout_minutes": user.inactivity_timeout_minutes,
        "accessibility_mode": user.accessibility_mode,
        "large_font": user.large_font,
        "high_contrast": user.high_contrast,
        "voice_enabled": user.voice_enabled,
        "email_notifications": user.email_notifications,
        "push_notifications": user.push_notifications,
        "sound_alerts": user.sound_alerts,
        "reminder_advance_minutes": user.reminder_advance_minutes,
        "created_at": user.created_at.isoformat()
    }
    
    return {"access_token": token, "token_type": "bearer", "user": user_dict}

@router.post("/verify-passcode")
def verify_user_passcode(data: PasscodeVerify, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.passcode_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No passcode configured for this user")
        
    is_valid = verify_passcode(data.passcode, current_user.passcode_hash)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid passcode")
        
    return {"verified": True, "message": "Passcode verified successfully"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "phone": current_user.phone,
        "avatar_url": current_user.avatar_url,
        "mfa_enabled": current_user.mfa_enabled,
        "is_active": current_user.is_active,
        "has_passcode": bool(current_user.passcode_hash),
        "inactivity_timeout_minutes": current_user.inactivity_timeout_minutes,
        "accessibility_mode": current_user.accessibility_mode,
        "large_font": current_user.large_font,
        "high_contrast": current_user.high_contrast,
        "voice_enabled": current_user.voice_enabled,
        "email_notifications": current_user.email_notifications,
        "push_notifications": current_user.push_notifications,
        "sound_alerts": current_user.sound_alerts,
        "reminder_advance_minutes": current_user.reminder_advance_minutes,
        "created_at": current_user.created_at.isoformat()
    }

@router.put("/me")
def update_me(update_data: UserProfileUpdate, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
    if update_data.phone is not None:
        current_user.phone = update_data.phone
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url
    if update_data.passcode is not None:
        current_user.passcode_hash = hash_passcode(update_data.passcode) if update_data.passcode else None
    if update_data.mfa_enabled is not None:
        current_user.mfa_enabled = update_data.mfa_enabled
    if update_data.inactivity_timeout_minutes is not None:
        current_user.inactivity_timeout_minutes = update_data.inactivity_timeout_minutes
    if update_data.accessibility_mode is not None:
        current_user.accessibility_mode = update_data.accessibility_mode
    if update_data.large_font is not None:
        current_user.large_font = update_data.large_font
    if update_data.high_contrast is not None:
        current_user.high_contrast = update_data.high_contrast
    if update_data.voice_enabled is not None:
        current_user.voice_enabled = update_data.voice_enabled
    if update_data.email_notifications is not None:
        current_user.email_notifications = update_data.email_notifications
    if update_data.push_notifications is not None:
        current_user.push_notifications = update_data.push_notifications
    if update_data.sound_alerts is not None:
        current_user.sound_alerts = update_data.sound_alerts
    if update_data.reminder_advance_minutes is not None:
        current_user.reminder_advance_minutes = update_data.reminder_advance_minutes

    db.commit()
    log_audit(db, "PROFILE_UPDATED", "AUTH", user_id=current_user.id, request=request)
    return {"message": "Profile updated successfully"}

@router.post("/demo-login/{demo_role}", response_model=Token)
def demo_login(demo_role: str, request: Request, db: Session = Depends(get_db)):
    """Convenience endpoint to log in as pre-seeded demo user."""
    role_email_map = {
        "elderly": "margaret.davis@eldercare.health",
        "caregiver": "david.miller@eldercare.health",
        "family": "sarah.davis@eldercare.health",
        "admin": "admin@eldercare.health"
    }
    email = role_email_map.get(demo_role.lower())
    if not email:
        raise HTTPException(status_code=400, detail=f"Invalid demo role: {demo_role}")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Demo user for '{demo_role}' not seeded yet")
        
    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    log_audit(db, "DEMO_LOGIN", "AUTH", user_id=user.id, request=request, details={"demo_role": demo_role})
    
    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "mfa_enabled": user.mfa_enabled,
        "is_active": user.is_active,
        "has_passcode": bool(user.passcode_hash),
        "inactivity_timeout_minutes": user.inactivity_timeout_minutes,
        "accessibility_mode": user.accessibility_mode,
        "large_font": user.large_font,
        "high_contrast": user.high_contrast,
        "voice_enabled": user.voice_enabled,
        "email_notifications": user.email_notifications,
        "push_notifications": user.push_notifications,
        "sound_alerts": user.sound_alerts,
        "reminder_advance_minutes": user.reminder_advance_minutes,
        "created_at": user.created_at.isoformat()
    }
    return {"access_token": token, "token_type": "bearer", "user": user_dict}
