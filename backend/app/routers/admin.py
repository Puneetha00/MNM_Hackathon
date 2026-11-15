import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.medication import Medication
from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.security import get_current_user, require_role

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.get("/metrics")
def get_system_metrics(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    elderly_count = db.query(User).filter(User.role == "elderly").count()
    caregiver_count = db.query(User).filter(User.role == "caregiver").count()
    family_count = db.query(User).filter(User.role == "family").count()
    
    total_meds = db.query(Medication).filter(Medication.is_active == True).count()
    total_appts = db.query(Appointment).count()
    total_audit_events = db.query(AuditLog).count()
    total_notifications = db.query(Notification).count()

    return {
        "total_users": total_users,
        "role_breakdown": {
            "elderly": elderly_count,
            "caregivers": caregiver_count,
            "family_members": family_count,
            "administrators": total_users - (elderly_count + caregiver_count + family_count)
        },
        "total_active_medications": total_meds,
        "total_appointments_managed": total_appts,
        "total_audit_events_logged": total_audit_events,
        "total_notifications_dispatched": total_notifications,
        "system_status": "Healthy - All engines operational",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/users")
def get_all_users(
    role: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.order_by(User.created_at.desc()).limit(limit).all()

    return [{
        "id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "role": u.role,
        "phone": u.phone,
        "is_active": u.is_active,
        "mfa_enabled": u.mfa_enabled,
        "has_passcode": bool(u.passcode_hash),
        "created_at": u.created_at.isoformat()
    } for u in users]

@router.get("/audit-logs")
def get_system_audit_logs(
    category: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if category:
        query = query.filter(AuditLog.category == category)
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()

    results = []
    for l in logs:
        try:
            details = json.loads(l.details_json) if l.details_json else {}
        except Exception:
            details = {}
        user_name = l.user.full_name if l.user else "System/Guest"
        results.append({
            "id": l.id,
            "user_id": l.user_id,
            "user_name": user_name,
            "action": l.action,
            "category": l.category,
            "ip_address": l.ip_address,
            "user_agent": l.user_agent,
            "details": details,
            "timestamp": l.created_at.isoformat()
        })
    return results
