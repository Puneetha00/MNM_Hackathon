from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AppointmentBase(BaseModel):
    doctor_name: str
    specialty: str = "General Physician"
    hospital_clinic: str
    location_address: Optional[str] = None
    appointment_datetime: datetime
    purpose: str
    transportation_needed: bool = False
    accompanied_by: Optional[str] = None
    doctor_notes: Optional[str] = None
    preparation_instructions: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    user_id: Optional[int] = None # Caregivers can specify elderly user_id

class AppointmentUpdate(BaseModel):
    doctor_name: Optional[str] = None
    specialty: Optional[str] = None
    hospital_clinic: Optional[str] = None
    location_address: Optional[str] = None
    appointment_datetime: Optional[datetime] = None
    purpose: Optional[str] = None
    status: Optional[str] = None # upcoming, completed, cancelled, rescheduled
    transportation_needed: Optional[bool] = None
    accompanied_by: Optional[str] = None
    doctor_notes: Optional[str] = None
    preparation_instructions: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: int
    user_id: int
    status: str
    reminder_sent: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
