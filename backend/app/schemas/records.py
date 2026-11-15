from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MedicalRecordResponse(BaseModel):
    id: int
    user_id: int
    title: str
    record_type: str
    file_path: str
    file_name: str
    file_size_kb: int
    mime_type: str
    doctor_name: Optional[str] = None
    hospital_clinic: Optional[str] = None
    record_date: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
