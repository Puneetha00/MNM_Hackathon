import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class HealthProfile(Base):
    __tablename__ = "health_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(30), nullable=True)
    blood_type = Column(String(10), nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    
    # Medical data stored as JSON strings
    allergies_json = Column(Text, default="[]")  # [{"allergen": "Penicillin", "severity": "Severe", "reaction": "Anaphylaxis"}]
    conditions_json = Column(Text, default="[]")  # [{"condition": "Type 2 Diabetes", "diagnosed_year": "2015", "notes": "Managed by Metformin"}]
    
    # Doctor info
    primary_doctor_name = Column(String(255), nullable=True)
    primary_doctor_phone = Column(String(50), nullable=True)
    primary_doctor_hospital = Column(String(255), nullable=True)
    
    # Emergency Information & Contacts
    emergency_contacts_json = Column(Text, default="[]") # [{"name": "...", "relationship": "...", "phone": "...", "is_primary": true}]
    dnr_status = Column(Boolean, default=False)
    preferred_hospital = Column(String(255), nullable=True)
    insurance_provider = Column(String(255), nullable=True)
    insurance_policy_number = Column(String(100), nullable=True)
    special_care_notes = Column(Text, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="health_profile")
