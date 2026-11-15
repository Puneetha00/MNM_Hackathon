from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class WellnessUpdate(BaseModel):
    water_glasses: Optional[int] = None
    water_target: Optional[int] = None
    steps_count: Optional[int] = None
    steps_target: Optional[int] = None
    sleep_hours: Optional[float] = None
    mood: Optional[str] = None
    tasks: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None

class WellnessResponse(BaseModel):
    id: int
    user_id: int
    log_date: str
    water_glasses: int
    water_target: int
    steps_count: int
    steps_target: int
    sleep_hours: float
    mood: str
    tasks: List[Dict[str, Any]]
    notes: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
