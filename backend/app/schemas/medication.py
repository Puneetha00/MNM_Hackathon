from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class MedicationBase(BaseModel):
    name: str
    generic_name: Optional[str] = None
    dosage: str
    form: str = "Tablet"
    frequency: str = "Once Daily"
    timings: List[str] = ["08:00"] # List of HH:MM strings
    instructions: str = "Take after food with water"
    start_date: str # YYYY-MM-DD
    end_date: Optional[str] = None
    color: str = "teal"
    pill_shape: str = "round"
    prescribing_doctor: Optional[str] = None
    refill_remaining: int = 3
    notes: Optional[str] = None

class MedicationCreate(MedicationBase):
    user_id: Optional[int] = None # Caregivers can specify elderly user_id

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    dosage: Optional[str] = None
    form: Optional[str] = None
    frequency: Optional[str] = None
    timings: Optional[List[str]] = None
    instructions: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    color: Optional[str] = None
    pill_shape: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    refill_remaining: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class MedicationResponse(MedicationBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DoseLogResponse(BaseModel):
    id: int
    medication_id: int
    medication_name: str
    dosage: str
    instructions: str
    form: str
    color: str
    pill_shape: str
    scheduled_date: str
    scheduled_time: str
    status: str # 'upcoming', 'taken', 'missed', 'skipped'
    taken_at: Optional[datetime] = None
    notes: Optional[str] = None
    marked_by_name: Optional[str] = None

class DoseActionRequest(BaseModel):
    status: str # 'taken', 'missed', 'skipped', 'upcoming'
    notes: Optional[str] = None
    taken_at: Optional[datetime] = None
