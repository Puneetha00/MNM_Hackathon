import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class DoseLog(Base):
    __tablename__ = "dose_logs"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    scheduled_date = Column(String(50), nullable=False, index=True) # "2026-11-15"
    scheduled_time = Column(String(50), nullable=False)             # "08:00"
    
    # Status: 'upcoming', 'taken', 'missed', 'skipped'
    status = Column(String(50), default="upcoming", index=True)
    taken_at = Column(DateTime, nullable=True)
    
    marked_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    
    reminder_sent = Column(Boolean, default=False)
    missed_alert_sent = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    medication = relationship("Medication", back_populates="dose_logs")
    user = relationship("User", foreign_keys=[user_id], back_populates="dose_logs")
    marked_by = relationship("User", foreign_keys=[marked_by_user_id])
