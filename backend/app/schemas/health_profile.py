from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class HealthProfileUpdate(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    allergies: Optional[List[Dict[str, Any]]] = None
    conditions: Optional[List[Dict[str, Any]]] = None
    primary_doctor_name: Optional[str] = None
    primary_doctor_phone: Optional[str] = None
    primary_doctor_hospital: Optional[str] = None
    emergency_contacts: Optional[List[Dict[str, Any]]] = None
    dnr_status: Optional[bool] = None
    preferred_hospital: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    special_care_notes: Optional[str] = None

class HealthProfileResponse(BaseModel):
    id: int
    user_id: int
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    allergies: List[Dict[str, Any]] = []
    conditions: List[Dict[str, Any]] = []
    primary_doctor_name: Optional[str] = None
    primary_doctor_phone: Optional[str] = None
    primary_doctor_hospital: Optional[str] = None
    emergency_contacts: List[Dict[str, Any]] = []
    dnr_status: bool = False
    preferred_hospital: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    special_care_notes: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
