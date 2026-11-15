import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.health_profile import HealthProfile
from app.models.medication import Medication
from app.models.collaboration import CaregiverElderlyLink
from app.models.notification import Notification
from app.security import get_current_user, check_elderly_access, log_audit
from app.services.email_service import send_healthcare_email, generate_emergency_alert_email

router = APIRouter(prefix="/emergency", tags=["Emergency Assistance & Medical ID"])

@router.get("/card")
def get_emergency_card(
    elderly_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns Emergency Medical ID Card for first responders and emergency caregivers."""
    target_id = elderly_id or current_user.id
    if not check_elderly_access(target_id, current_user, db):
        raise HTTPException(status_code=403, detail="Unauthorized")

    senior = db.query(User).filter(User.id == target_id).first()
    if not senior:
        raise HTTPException(status_code=404, detail="Senior user not found")

    hp = senior.health_profile
    allergies = json.loads(hp.allergies_json) if hp and hp.allergies_json else []
    conditions = json.loads(hp.conditions_json) if hp and hp.conditions_json else []
    contacts = json.loads(hp.emergency_contacts_json) if hp and hp.emergency_contacts_json else []

    # Get active medications
    meds = db.query(Medication).filter(Medication.user_id == target_id, Medication.is_active == True).all()
    critical_meds = [{"name": m.name, "dosage": m.dosage, "instructions": m.instructions} for m in meds]

    return {
        "full_name": senior.full_name,
        "date_of_birth": hp.date_of_birth if hp else None,
        "blood_type": hp.blood_type if hp else "Not Specified",
        "dnr_status": hp.dnr_status if hp else False,
        "phone": senior.phone,
        "preferred_hospital": hp.preferred_hospital if hp else None,
        "primary_doctor_name": hp.primary_doctor_name if hp else None,
        "primary_doctor_phone": hp.primary_doctor_phone if hp else None,
        "insurance_provider": hp.insurance_provider if hp else None,
        "insurance_policy_number": hp.insurance_policy_number if hp else None,
        "special_care_notes": hp.special_care_notes if hp else None,
        "allergies": allergies,
        "chronic_conditions": conditions,
        "emergency_contacts": contacts,
        "critical_medications": critical_meds,
        "emergency_dispatch_hotlines": [
            {"service": "Ambulance / Emergency Services", "number": "911 (US/CA) / 112 (EU) / 108 (IN)"},
            {"service": "National Poison Control", "number": "1-800-222-1222"},
            {"service": "Senior Crisis Helpline", "number": "1-800-231-4024"}
        ]
    }

@router.post("/trigger")
def trigger_emergency_assistance(
    payload: Dict[str, Any],
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Activates emergency alert. Dispatches urgent notifications and emails to all
    authorized caregivers and family members who have emergency alert permission.
    """
    notes = payload.get("notes", "Senior requested immediate assistance via ElderCare SOS button.")
    senior = current_user

    # Find authorized contacts
    links = db.query(CaregiverElderlyLink).filter(
        CaregiverElderlyLink.elderly_id == senior.id,
        CaregiverElderlyLink.status == "active",
        CaregiverElderlyLink.can_receive_emergency_alerts == True
    ).all()

    hp = senior.health_profile
    medical_summary = f"Blood Type: {hp.blood_type or 'N/A'}. Conditions: {hp.conditions_json or 'None listed'}."

    notified_contacts = []
    for link in links:
        guardian = link.member
        if guardian:
            # Create urgent notification
            db.add(Notification(
                user_id=guardian.id,
                title=f"🚨 EMERGENCY ALERT: {senior.full_name}",
                message=f"URGENT: {senior.full_name} has triggered an Emergency SOS! Notes: {notes}. Phone: {senior.phone or 'Not provided'}.",
                type="emergency",
                severity="critical",
                metadata_json=json.dumps({"senior_id": senior.id, "senior_name": senior.full_name, "phone": senior.phone})
            ))

            # Send urgent email
            if guardian.email:
                alert_html = generate_emergency_alert_email(
                    recipient_name=guardian.full_name,
                    senior_name=senior.full_name,
                    emergency_phone=senior.phone or "Unknown",
                    medical_summary=medical_summary
                )
                send_healthcare_email(
                    to_email=guardian.email,
                    subject=f"🚨 URGENT: EMERGENCY ALERT for {senior.full_name}",
                    html_content=alert_html
                )
            notified_contacts.append({"name": guardian.full_name, "relationship": link.relationship_label, "email": guardian.email})

    db.commit()

    log_audit(db, "EMERGENCY_TRIGGERED", "EMERGENCY", user_id=senior.id, request=request, details={
        "notified_count": len(notified_contacts),
        "contacts": [c["name"] for c in notified_contacts],
        "notes": notes
    })

    return {
        "status": "alert_dispatched",
        "timestamp": datetime.utcnow().isoformat(),
        "notified_guardians_count": len(notified_contacts),
        "notified_guardians": notified_contacts,
        "message": "Emergency broadcast successfully dispatched to your authorized care circle members."
    }
