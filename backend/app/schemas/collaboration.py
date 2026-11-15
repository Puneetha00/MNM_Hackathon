from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class InvitationCreate(BaseModel):
    recipient_email: EmailStr
    relationship_type: str = "family" # 'caregiver' or 'family'
    relationship_label: str = "Family Member"
    passcode: Optional[str] = "123456" # 6 digit security passcode
    can_view_medications: bool = True
    can_manage_medications: bool = False
    can_view_adherence: bool = True
    can_view_appointments: bool = True
    can_manage_appointments: bool = False
    can_view_records: bool = True
    can_receive_emergency_alerts: bool = True
    can_receive_missed_dose_alerts: bool = True

class InvitationAccept(BaseModel):
    invite_code: str
    passcode: str

class PermissionUpdate(BaseModel):
    can_view_medications: Optional[bool] = None
    can_manage_medications: Optional[bool] = None
    can_view_adherence: Optional[bool] = None
    can_view_appointments: Optional[bool] = None
    can_manage_appointments: Optional[bool] = None
    can_view_records: Optional[bool] = None
    can_receive_emergency_alerts: Optional[bool] = None
    can_receive_missed_dose_alerts: Optional[bool] = None
    relationship_label: Optional[str] = None

class CaregiverElderlyLinkResponse(BaseModel):
    id: int
    elderly_id: int
    elderly_name: str
    elderly_email: str
    member_id: int
    member_name: str
    member_email: str
    relationship_type: str
    relationship_label: str
    status: str
    can_view_medications: bool
    can_manage_medications: bool
    can_view_adherence: bool
    can_view_appointments: bool
    can_manage_appointments: bool
    can_view_records: bool
    can_receive_emergency_alerts: bool
    can_receive_missed_dose_alerts: bool
    created_at: datetime

    class Config:
        from_attributes = True
