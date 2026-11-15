import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="elderly")  # elderly, caregiver, family, admin
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Security & Passcode
    passcode_hash = Column(String(255), nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    inactivity_timeout_minutes = Column(Integer, default=15)
    
    # Accessibility preferences
    accessibility_mode = Column(Boolean, default=False)
    large_font = Column(Boolean, default=False)
    high_contrast = Column(Boolean, default=False)
    voice_enabled = Column(Boolean, default=True)
    
    # Notification preferences
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    sound_alerts = Column(Boolean, default=True)
    reminder_advance_minutes = Column(Integer, default=15)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    health_profile = relationship("HealthProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="user", cascade="all, delete-orphan")
    dose_logs = relationship("DoseLog", back_populates="user", cascade="all, delete-orphan", foreign_keys="DoseLog.user_id")
    appointments = relationship("Appointment", back_populates="user", cascade="all, delete-orphan")
    medical_records = relationship("MedicalRecord", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    wellness_logs = relationship("WellnessLog", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
