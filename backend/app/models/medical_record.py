import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    record_type = Column(String(100), default="Prescription") # Prescription, Lab Report, Radiology / Scan, Discharge Summary, Other
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size_kb = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    
    doctor_name = Column(String(255), nullable=True)
    hospital_clinic = Column(String(255), nullable=True)
    record_date = Column(String(50), nullable=False) # YYYY-MM-DD
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="medical_records")
