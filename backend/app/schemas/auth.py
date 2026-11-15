from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "elderly" # elderly, caregiver, family, admin
    phone: Optional[str] = None
    passcode: Optional[str] = None # 4-6 digit passcode

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasscodeVerify(BaseModel):
    passcode: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    passcode: Optional[str] = None
    mfa_enabled: Optional[bool] = None
    inactivity_timeout_minutes: Optional[int] = None
    accessibility_mode: Optional[bool] = None
    large_font: Optional[bool] = None
    high_contrast: Optional[bool] = None
    voice_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    sound_alerts: Optional[bool] = None
    reminder_advance_minutes: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    mfa_enabled: bool
    is_active: bool
    has_passcode: bool = False
    inactivity_timeout_minutes: int
    accessibility_mode: bool
    large_font: bool
    high_contrast: bool
    voice_enabled: bool
    email_notifications: bool
    push_notifications: bool
    sound_alerts: bool
    reminder_advance_minutes: int
    created_at: datetime

    class Config:
        from_attributes = True
