import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class WellnessLog(Base):
    __tablename__ = "wellness_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    log_date = Column(String(50), nullable=False, index=True) # "2026-11-15"
    water_glasses = Column(Integer, default=0)
    water_target = Column(Integer, default=8)
    
    steps_count = Column(Integer, default=0)
    steps_target = Column(Integer, default=3000)
    
    sleep_hours = Column(Float, default=7.0)
    mood = Column(String(50), default="Good") # Great, Good, Okay, Tired, Resting
    
    # JSON list of daily routine tasks: [{"id": 1, "title": "Morning sunshine & stretching", "completed": true}]
    tasks_json = Column(Text, default="[]")
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="wellness_logs")
