import secrets
import json
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.medication import Medication
from app.models.dose_log import DoseLog
from app.models.appointment import Appointment
from app.models.collaboration import CaregiverElderlyLink, Invitation
from app.models.notification import Notification
from app.schemas.collaboration import (
    InvitationCreate, InvitationAccept, PermissionUpdate, CaregiverElderlyLinkResponse
)
from app.security import (
    get_current_user, hash_passcode, verify_passcode, log_audit, check_elderly_access
)
from app.services.email_service import send_healthcare_email

router = APIRouter(prefix="/family", tags=["Family & Caregiver Collaboration"])

@router.get("/dashboard")
def get_family_dashboard(
    elderly_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dashboard view for family members showing authorized elderly profile status."""
    links = db.query(CaregiverElderlyLink).filter(
        CaregiverElderlyLink.member_id == current_user.id,
        CaregiverElderlyLink.status == "active"
    ).all()

    if not links:
        return {
            "family_member_name": current_user.full_name,
            "seniors": [],
            "message": "No elderly care profiles currently linked. Use an invitation code to link with your loved one."
        }

    seniors_data = []
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")

    for link in links:
        senior = link.elderly
        if not senior or not senior.is_active:
            continue

        # Today's dose logs if permitted
        today_meds_summary = None
        if link.can_view_medications:
            doses = db.query(DoseLog).join(Medication).filter(
                DoseLog.user_id == senior.id,
                DoseLog.scheduled_date == today_str
            ).order_by(DoseLog.scheduled_time.asc()).all()

            taken = sum(1 for d in doses if d.status == "taken")
            missed = sum(1 for d in doses if d.status == "missed")
            upcoming = sum(1 for d in doses if d.status == "upcoming")
            
            today_meds_summary = {
                "total": len(doses),
                "taken": taken,
                "missed": missed,
                "upcoming": upcoming,
                "doses": [{
                    "medication_name": d.medication.name,
                    "dosage": d.medication.dosage,
                    "time": d.scheduled_time,
                    "status": d.status
                } for d in doses]
            }

        # Adherence rate
        adherence_rate = 100.0
        if link.can_view_adherence:
            week_start = (now - timedelta(days=7)).strftime("%Y-%m-%d")
            week_logs = db.query(DoseLog).filter(
                DoseLog.user_id == senior.id,
                DoseLog.scheduled_date >= week_start
            ).all()
            eval_count = sum(1 for l in week_logs if l.status in ["taken", "missed"])
            taken_count = sum(1 for l in week_logs if l.status == "taken")
            if eval_count > 0:
                adherence_rate = round((taken_count / eval_count * 100), 1)

        # Upcoming doctor appointments if permitted
        upcoming_appts = []
        if link.can_view_appointments:
            appts = db.query(Appointment).filter(
                Appointment.user_id == senior.id,
                Appointment.status == "upcoming",
                Appointment.appointment_datetime >= now
            ).order_by(Appointment.appointment_datetime.asc()).limit(3).all()

            upcoming_appts = [{
                "id": a.id,
                "doctor_name": a.doctor_name,
                "specialty": a.specialty,
                "hospital": a.hospital_clinic,
                "datetime": a.appointment_datetime.isoformat(),
                "purpose": a.purpose
            } for a in appts]

        seniors_data.append({
            "senior_id": senior.id,
            "senior_name": senior.full_name,
            "avatar_url": senior.avatar_url,
            "relationship_label": link.relationship_label,
            "relationship_type": link.relationship_type,
            "permissions": {
                "can_view_medications": link.can_view_medications,
                "can_manage_medications": link.can_manage_medications,
                "can_view_adherence": link.can_view_adherence,
                "can_view_appointments": link.can_view_appointments,
                "can_manage_appointments": link.can_manage_appointments,
                "can_view_records": link.can_view_records,
                "can_receive_emergency_alerts": link.can_receive_emergency_alerts,
                "can_receive_missed_dose_alerts": link.can_receive_missed_dose_alerts
            },
            "adherence_rate": adherence_rate,
            "today_meds": today_meds_summary,
            "upcoming_appointments": upcoming_appts
        })

    return {
        "family_member_name": current_user.full_name,
        "seniors": seniors_data
    }

@router.get("/members", response_model=List[CaregiverElderlyLinkResponse])
def get_collaborators(
    elderly_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all family members & caregivers linked to this elderly profile."""
    target_id = elderly_id or current_user.id
    if current_user.id != target_id and current_user.role not in ["caregiver", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    links = db.query(CaregiverElderlyLink).filter(
        CaregiverElderlyLink.elderly_id == target_id,
        CaregiverElderlyLink.status == "active"
    ).all()

    results = []
    for l in links:
        results.append(CaregiverElderlyLinkResponse(
            id=l.id,
            elderly_id=l.elderly_id,
            elderly_name=l.elderly.full_name,
            elderly_email=l.elderly.email,
            member_id=l.member_id,
            member_name=l.member.full_name,
            member_email=l.member.email,
            relationship_type=l.relationship_type,
            relationship_label=l.relationship_label,
            status=l.status,
            can_view_medications=l.can_view_medications,
            can_manage_medications=l.can_manage_medications,
            can_view_adherence=l.can_view_adherence,
            can_view_appointments=l.can_view_appointments,
            can_manage_appointments=l.can_manage_appointments,
            can_view_records=l.can_view_records,
            can_receive_emergency_alerts=l.can_receive_emergency_alerts,
            can_receive_missed_dose_alerts=l.can_receive_missed_dose_alerts,
            created_at=l.created_at
        ))
    return results

@router.post("/invite")
def create_invitation(
    invite_data: InvitationCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Elderly user creates a secure invitation with passcode for caregiver or family."""
    if current_user.role != "elderly" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the elderly user can invite care circle members")

    # Generate 8-character unique invite code
    code = f"EC-{secrets.token_hex(3).upper()}"
    passcode_h = hash_passcode(invite_data.passcode) if invite_data.passcode else None

    perms = {
        "can_view_medications": invite_data.can_view_medications,
        "can_manage_medications": invite_data.can_manage_medications,
        "can_view_adherence": invite_data.can_view_adherence,
        "can_view_appointments": invite_data.can_view_appointments,
        "can_manage_appointments": invite_data.can_manage_appointments,
        "can_view_records": invite_data.can_view_records,
        "can_receive_emergency_alerts": invite_data.can_receive_emergency_alerts,
        "can_receive_missed_dose_alerts": invite_data.can_receive_missed_dose_alerts
    }

    invitation = Invitation(
        elderly_id=current_user.id,
        invite_code=code,
        passcode_hash=passcode_h,
        recipient_email=invite_data.recipient_email.lower(),
        relationship_type=invite_data.relationship_type,
        relationship_label=invite_data.relationship_label,
        permissions_json=json.dumps(perms),
        status="pending",
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(invitation)
    db.commit()

    # Send invitation notification email
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #0d9488; border-radius: 12px; background: #f0fdfa;">
        <h2 style="color: #0f766e; margin-top: 0;">🌿 ElderCare Circle Invitation</h2>
        <p>Hello,</p>
        <p><strong>{current_user.full_name}</strong> has invited you to join their personal care circle as their <strong>{invite_data.relationship_label}</strong>.</p>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #14b8a6; margin: 15px 0;">
            <p style="margin: 0;"><strong>Invite Code:</strong> <span style="font-size: 18px; color: #0d9488; font-weight: bold; letter-spacing: 2px;">{code}</span></p>
            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 13px;">Security Passcode: Shared privately by {current_user.full_name}</p>
        </div>
        <p>Log in or register on ElderCare, go to Family Collaboration, and accept this invitation using your code.</p>
    </div>
    """
    send_healthcare_email(
        to_email=invite_data.recipient_email,
        subject=f"{current_user.full_name} invited you to ElderCare",
        html_content=email_html
    )

    log_audit(db, "INVITATION_CREATED", "COLLABORATION", user_id=current_user.id, request=request, details={"invite_code": code, "recipient": invite_data.recipient_email})
    return {
        "message": "Invitation created and dispatched",
        "invite_code": code,
        "recipient_email": invite_data.recipient_email,
        "relationship_label": invite_data.relationship_label,
        "passcode_hint": "Secured with your designated passcode"
    }

@router.post("/accept")
def accept_invitation(
    accept_data: InvitationAccept,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Caregiver or family accepts invitation using code and passcode."""
    invitation = db.query(Invitation).filter(
        Invitation.invite_code == accept_data.invite_code.strip(),
        Invitation.status == "pending"
    ).first()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation code")

    if invitation.expires_at < datetime.utcnow():
        invitation.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="This invitation code has expired")

    # Verify security passcode
    if invitation.passcode_hash:
        if not verify_passcode(accept_data.passcode, invitation.passcode_hash):
            raise HTTPException(status_code=401, detail="Incorrect security passcode for this invitation")

    # Prevent linking to oneself
    if invitation.elderly_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot link your own account as a caregiver or family member")

    # Check if link already exists
    existing_link = db.query(CaregiverElderlyLink).filter(
        CaregiverElderlyLink.elderly_id == invitation.elderly_id,
        CaregiverElderlyLink.member_id == current_user.id
    ).first()

    perms = json.loads(invitation.permissions_json) if invitation.permissions_json else {}

    if existing_link:
        existing_link.status = "active"
        existing_link.relationship_type = invitation.relationship_type
        existing_link.relationship_label = invitation.relationship_label
        for k, v in perms.items():
            if hasattr(existing_link, k):
                setattr(existing_link, k, v)
    else:
        new_link = CaregiverElderlyLink(
            elderly_id=invitation.elderly_id,
            member_id=current_user.id,
            relationship_type=invitation.relationship_type,
            relationship_label=invitation.relationship_label,
            status="active",
            can_view_medications=perms.get("can_view_medications", True),
            can_manage_medications=perms.get("can_manage_medications", False),
            can_view_adherence=perms.get("can_view_adherence", True),
            can_view_appointments=perms.get("can_view_appointments", True),
            can_manage_appointments=perms.get("can_manage_appointments", False),
            can_view_records=perms.get("can_view_records", True),
            can_receive_emergency_alerts=perms.get("can_receive_emergency_alerts", True),
            can_receive_missed_dose_alerts=perms.get("can_receive_missed_dose_alerts", True)
        )
        db.add(new_link)

    invitation.status = "accepted"
    db.commit()

    # Notify elderly user
    senior = invitation.elderly
    if senior:
        db.add(Notification(
            user_id=senior.id,
            title=f"Invitation Accepted: {current_user.full_name}",
            message=f"{current_user.full_name} has accepted your invitation and joined your care circle as {invitation.relationship_label}.",
            type="caregiver_alert",
            severity="info"
        ))
        db.commit()

    log_audit(db, "INVITATION_ACCEPTED", "COLLABORATION", user_id=current_user.id, request=request, details={"elderly_id": invitation.elderly_id, "code": invitation.invite_code})
    return {"message": f"Successfully joined {senior.full_name}'s care circle!", "senior_id": invitation.elderly_id}

@router.put("/permissions/{link_id}")
def update_collaborator_permissions(
    link_id: int,
    perm_data: PermissionUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Elderly user adjusts fine-grained permissions for a collaborator."""
    link = db.query(CaregiverElderlyLink).filter(CaregiverElderlyLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Caregiver link not found")

    if current_user.id != link.elderly_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the elderly user can adjust collaborator access permissions")

    if perm_data.can_view_medications is not None: link.can_view_medications = perm_data.can_view_medications
    if perm_data.can_manage_medications is not None: link.can_manage_medications = perm_data.can_manage_medications
    if perm_data.can_view_adherence is not None: link.can_view_adherence = perm_data.can_view_adherence
    if perm_data.can_view_appointments is not None: link.can_view_appointments = perm_data.can_view_appointments
    if perm_data.can_manage_appointments is not None: link.can_manage_appointments = perm_data.can_manage_appointments
    if perm_data.can_view_records is not None: link.can_view_records = perm_data.can_view_records
    if perm_data.can_receive_emergency_alerts is not None: link.can_receive_emergency_alerts = perm_data.can_receive_emergency_alerts
    if perm_data.can_receive_missed_dose_alerts is not None: link.can_receive_missed_dose_alerts = perm_data.can_receive_missed_dose_alerts
    if perm_data.relationship_label is not None: link.relationship_label = perm_data.relationship_label

    db.commit()
    log_audit(db, "PERMISSIONS_UPDATED", "COLLABORATION", user_id=current_user.id, request=request, details={"link_id": link.id, "member_id": link.member_id})
    return {"message": "Permissions updated successfully"}

@router.delete("/permissions/{link_id}")
def revoke_collaborator_access(
    link_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Elderly user revokes access for a collaborator."""
    link = db.query(CaregiverElderlyLink).filter(CaregiverElderlyLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Caregiver link not found")

    if current_user.id != link.elderly_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the elderly user can revoke collaborator access")

    link.status = "revoked"
    db.commit()
    log_audit(db, "ACCESS_REVOKED", "COLLABORATION", user_id=current_user.id, request=request, details={"link_id": link.id, "member_id": link.member_id})
    return {"message": "Access revoked successfully"}
