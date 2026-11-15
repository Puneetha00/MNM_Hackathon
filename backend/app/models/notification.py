import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    # type: 'medication_reminder', 'missed_dose', 'caregiver_alert', 'appointment', 'emergency', 'system'
    type = Column(String(50), default="medication_reminder", index=True)
    # severity: 'info', 'warning', 'critical'
    severity = Column(String(50), default="info")
    
    is_read = Column(Boolean, default=False)
    metadata_json = Column(Text, default="{}")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="notifications")
