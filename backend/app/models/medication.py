import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    generic_name = Column(String(255), nullable=True)
    dosage = Column(String(100), nullable=False)  # e.g., "500 mg", "1 tablet"
    form = Column(String(50), default="Tablet")   # Tablet, Capsule, Liquid, Inhaler, Injection, Drops
    frequency = Column(String(100), nullable=False) # "Once Daily", "Twice Daily", "Three Times Daily", "Every 8 hours"
    
    # List of dose times e.g. ["08:00", "20:00"]
    timings_json = Column(Text, nullable=False, default="[\"08:00\"]")
    instructions = Column(String(255), default="Take after food with water") # Before food, After food, With food, Bedtime
    
    start_date = Column(String(50), nullable=False) # "YYYY-MM-DD"
    end_date = Column(String(50), nullable=True)     # "YYYY-MM-DD" or None
    
    color = Column(String(50), default="teal")      # teal, blue, amber, emerald, indigo, rose
    pill_shape = Column(String(50), default="round")# round, oval, capsule, liquid
    
    prescribing_doctor = Column(String(255), nullable=True)
    refill_remaining = Column(Integer, default=3)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="medications")
    dose_logs = relationship("DoseLog", back_populates="medication", cascade="all, delete-orphan")
