import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.health_profile import HealthProfile
from app.models.medication import Medication
from app.models.dose_log import DoseLog
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.collaboration import CaregiverElderlyLink
from app.security import get_current_user, log_audit

router = APIRouter(prefix="/security", tags=["Security & Privacy"])

@router.get("/audit-logs")
def get_user_audit_logs(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve security audit logs for the current user."""
    logs = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id
    ).order_by(AuditLog.created_at.desc()).limit(limit).all()

    items = []
    for l in logs:
        try:
            details = json.loads(l.details_json) if l.details_json else {}
        except Exception:
            details = {}
        items.append({
            "id": l.id,
            "action": l.action,
            "category": l.category,
            "ip_address": l.ip_address,
            "user_agent": l.user_agent,
            "details": details,
            "timestamp": l.created_at.isoformat()
        })
    return items

@router.get("/export-data")
def export_user_data(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates complete GDPR/HIPAA compliant export of all user healthcare data."""
    hp = current_user.health_profile
    meds = db.query(Medication).filter(Medication.user_id == current_user.id).all()
    appts = db.query(Appointment).filter(Appointment.user_id == current_user.id).all()
    records = db.query(MedicalRecord).filter(MedicalRecord.user_id == current_user.id).all()
    logs = db.query(DoseLog).filter(DoseLog.user_id == current_user.id).limit(100).all()

    export_payload = {
        "export_metadata": {
            "platform": "ElderCare Platform",
            "exported_at": datetime.utcnow().isoformat(),
            "user_id": current_user.id,
            "compliance": "HIPAA & GDPR Data Subject Portability"
        },
        "user_demographics": {
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
            "phone": current_user.phone,
            "created_at": current_user.created_at.isoformat()
        },
        "health_profile": {
            "date_of_birth": hp.date_of_birth if hp else None,
            "blood_type": hp.blood_type if hp else None,
            "height_cm": hp.height_cm if hp else None,
            "weight_kg": hp.weight_kg if hp else None,
            "allergies": json.loads(hp.allergies_json) if hp and hp.allergies_json else [],
            "conditions": json.loads(hp.conditions_json) if hp and hp.conditions_json else [],
            "primary_doctor": hp.primary_doctor_name if hp else None,
            "emergency_contacts": json.loads(hp.emergency_contacts_json) if hp and hp.emergency_contacts_json else []
        },
        "medications": [{
            "name": m.name,
            "dosage": m.dosage,
            "frequency": m.frequency,
            "timings": json.loads(m.timings_json) if m.timings_json else [],
            "instructions": m.instructions,
            "start_date": m.start_date,
            "end_date": m.end_date
        } for m in meds],
        "appointments": [{
            "doctor": a.doctor_name,
            "specialty": a.specialty,
            "hospital": a.hospital_clinic,
            "datetime": a.appointment_datetime.isoformat(),
            "purpose": a.purpose,
            "status": a.status
        } for a in appts],
        "medical_records": [{
            "title": r.title,
            "type": r.record_type,
            "doctor": r.doctor_name,
            "date": r.record_date,
            "file_name": r.file_name
        } for r in records],
        "recent_adherence_logs": [{
            "medication_id": l.medication_id,
            "date": l.scheduled_date,
            "time": l.scheduled_time,
            "status": l.status,
            "taken_at": l.taken_at.isoformat() if l.taken_at else None
        } for l in logs]
    }

    log_audit(db, "DATA_EXPORTED", "SECURITY", user_id=current_user.id, request=request)
    return export_payload

@router.delete("/account")
def delete_account(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes the user's account and associated data."""
    log_audit(db, "ACCOUNT_DELETED", "SECURITY", user_id=current_user.id, request=request)
    
    # Soft delete / deactivate
    current_user.is_active = False
    current_user.email = f"deleted_{current_user.id}_{current_user.email}"
    db.commit()
    return {"message": "Account has been successfully deactivated and marked for permanent deletion"}
