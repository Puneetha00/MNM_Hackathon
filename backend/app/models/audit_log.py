import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    action = Column(String(100), nullable=False) # e.g. "USER_LOGIN", "RECORD_ACCESSED"
    category = Column(String(50), default="SECURITY") # SECURITY, MEDICATION, RECORD, COLLABORATION, EMERGENCY
    
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(300), nullable=True)
    details_json = Column(Text, default="{}")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")
