import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    doctor_name = Column(String(255), nullable=False)
    specialty = Column(String(150), default="General Physician")
    hospital_clinic = Column(String(255), nullable=False)
    location_address = Column(String(300), nullable=True)
    
    appointment_datetime = Column(DateTime, nullable=False, index=True)
    purpose = Column(String(300), nullable=False)
    
    # Status: 'upcoming', 'completed', 'cancelled', 'rescheduled'
    status = Column(String(50), default="upcoming")
    
    reminder_sent = Column(Boolean, default=False)
    transportation_needed = Column(Boolean, default=False)
    accompanied_by = Column(String(150), nullable=True)
    
    doctor_notes = Column(Text, nullable=True)
    preparation_instructions = Column(String(300), nullable=True) # e.g. "Fasting for 12 hours before test"
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="appointments")
