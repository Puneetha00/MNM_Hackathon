import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class CaregiverElderlyLink(Base):
    __tablename__ = "caregiver_elderly_links"

    id = Column(Integer, primary_key=True, index=True)
    elderly_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    relationship_type = Column(String(50), nullable=False) # 'caregiver', 'family'
    relationship_label = Column(String(100), default="Caregiver") # 'Daughter', 'Son', 'Home Nurse', etc.
    status = Column(String(50), default="active") # 'active', 'revoked', 'pending'
    
    # Fine-grained RBAC permissions controlled by elderly user
    can_view_medications = Column(Boolean, default=True)
    can_manage_medications = Column(Boolean, default=False)
    can_view_adherence = Column(Boolean, default=True)
    can_view_appointments = Column(Boolean, default=True)
    can_manage_appointments = Column(Boolean, default=False)
    can_view_records = Column(Boolean, default=True)
    can_receive_emergency_alerts = Column(Boolean, default=True)
    can_receive_missed_dose_alerts = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    elderly = relationship("User", foreign_keys=[elderly_id])
    member = relationship("User", foreign_keys=[member_id])


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    elderly_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    invite_code = Column(String(50), unique=True, index=True, nullable=False)
    passcode_hash = Column(String(255), nullable=True) # Secure hashed passcode required to accept
    recipient_email = Column(String(255), nullable=False)
    
    relationship_type = Column(String(50), default="family") # 'caregiver' or 'family'
    relationship_label = Column(String(100), default="Family Member")
    
    # Stored as JSON: permissions dict
    permissions_json = Column(Text, default="{}")
    status = Column(String(50), default="pending") # 'pending', 'accepted', 'expired', 'revoked'
    
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    elderly = relationship("User", foreign_keys=[elderly_id])
