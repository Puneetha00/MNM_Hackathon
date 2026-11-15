import json
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.medication import Medication
from app.models.dose_log import DoseLog
from app.models.appointment import Appointment
from app.models.collaboration import CaregiverElderlyLink
from app.models.notification import Notification
from app.security import get_current_user, require_role

router = APIRouter(prefix="/caregiver", tags=["Caregiver Monitoring"])

@router.get("/dashboard")
def get_caregiver_dashboard(
    current_user: User = Depends(require_role(["caregiver", "admin"])),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")

    # Get all active elderly patients assigned to this caregiver
    if current_user.role == "admin":
        links = db.query(CaregiverElderlyLink).filter(CaregiverElderlyLink.status == "active").all()
        elderly_users = db.query(User).filter(User.role == "elderly", User.is_active == True).all()
    else:
        links = db.query(CaregiverElderlyLink).filter(
            CaregiverElderlyLink.member_id == current_user.id,
            CaregiverElderlyLink.status == "active"
        ).all()
        elderly_ids = [l.elderly_id for l in links]
        elderly_users = db.query(User).filter(User.id.in_(elderly_ids), User.is_active == True).all() if elderly_ids else []

    patients_summary = []
    total_missed_today = 0
    total_doses_evaluated = 0
    total_doses_taken = 0
    attention_alerts = []

    for patient in elderly_users:
        # Today's doses
        today_doses = db.query(DoseLog).filter(
            DoseLog.user_id == patient.id,
            DoseLog.scheduled_date == today_str
        ).all()

        taken_today = sum(1 for d in today_doses if d.status == "taken")
        missed_today = sum(1 for d in today_doses if d.status == "missed")
        upcoming_today = sum(1 for d in today_doses if d.status == "upcoming")
        total_missed_today += missed_today

        # Past 7 days adherence
        seven_days_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        week_logs = db.query(DoseLog).filter(
            DoseLog.user_id == patient.id,
            DoseLog.scheduled_date >= seven_days_ago,
            DoseLog.scheduled_date <= today_str
        ).all()

        week_taken = sum(1 for l in week_logs if l.status == "taken")
        week_missed = sum(1 for l in week_logs if l.status == "missed")
        total_doses_evaluated += (week_taken + week_missed)
        total_doses_taken += week_taken

        week_denom = week_taken + week_missed
        adherence_pct = round((week_taken / week_denom * 100), 1) if week_denom > 0 else 100.0

        # Check Attention System triggers
        needs_attention = False
        attention_reasons = []

        if missed_today > 0:
            needs_attention = True
            attention_reasons.append(f"Missed {missed_today} scheduled dose(s) today")
            
        if adherence_pct < 75.0:
            needs_attention = True
            attention_reasons.append(f"Weekly adherence low ({adherence_pct}%)")

        if needs_attention:
            attention_alerts.append({
                "patient_id": patient.id,
                "patient_name": patient.full_name,
                "avatar_url": patient.avatar_url,
                "phone": patient.phone,
                "reasons": attention_reasons,
                "severity": "high" if missed_today >= 2 or adherence_pct < 60 else "medium",
                "last_active": "Today"
            })

        # Next upcoming dose for this patient
        next_dose = db.query(DoseLog).join(Medication).filter(
            DoseLog.user_id == patient.id,
            DoseLog.scheduled_date == today_str,
            DoseLog.status == "upcoming"
        ).order_by(DoseLog.scheduled_time.asc()).first()

        next_dose_info = None
        if next_dose:
            next_dose_info = {
                "medication_name": next_dose.medication.name,
                "dosage": next_dose.medication.dosage,
                "time": next_dose.scheduled_time
            }

        patients_summary.append({
            "id": patient.id,
            "full_name": patient.full_name,
            "email": patient.email,
            "phone": patient.phone,
            "avatar_url": patient.avatar_url,
            "adherence_rate": adherence_pct,
            "today_status": {
                "total": len(today_doses),
                "taken": taken_today,
                "missed": missed_today,
                "upcoming": upcoming_today
            },
            "next_dose": next_dose_info,
            "needs_attention": needs_attention
        })

    # Upcoming appointments across assigned patients
    patient_ids = [p["id"] for p in patients_summary]
    upcoming_appts = []
    if patient_ids:
        appts = db.query(Appointment).filter(
            Appointment.user_id.in_(patient_ids),
            Appointment.status == "upcoming",
            Appointment.appointment_datetime >= now
        ).order_by(Appointment.appointment_datetime.asc()).limit(5).all()

        for a in appts:
            user_match = next((p for p in patients_summary if p["id"] == a.user_id), None)
            upcoming_appts.append({
                "id": a.id,
                "patient_name": user_match["full_name"] if user_match else "Patient",
                "doctor_name": a.doctor_name,
                "specialty": a.specialty,
                "hospital": a.hospital_clinic,
                "datetime": a.appointment_datetime.isoformat(),
                "purpose": a.purpose
            })

    # Recent healthcare activity feed across patients
    recent_activities = []
    if patient_ids:
        recent_logs = db.query(DoseLog).join(Medication).filter(
            DoseLog.user_id.in_(patient_ids),
            DoseLog.status.in_(["taken", "missed"])
        ).order_by(DoseLog.updated_at.desc()).limit(10).all()

        for r in recent_logs:
            user_match = next((p for p in patients_summary if p["id"] == r.user_id), None)
            recent_activities.append({
                "id": r.id,
                "patient_name": user_match["full_name"] if user_match else "Patient",
                "medication_name": r.medication.name,
                "dosage": r.medication.dosage,
                "status": r.status,
                "time": r.scheduled_time,
                "date": r.scheduled_date,
                "timestamp": r.updated_at.isoformat() if r.updated_at else None
            })

    # Overall adherence rate across all assigned patients
    overall_adherence = round((total_doses_taken / total_doses_evaluated * 100), 1) if total_doses_evaluated > 0 else 100.0

    return {
        "caregiver_name": current_user.full_name,
        "total_patients": len(patients_summary),
        "overall_adherence_rate": overall_adherence,
        "missed_medications_today": total_missed_today,
        "patients": patients_summary,
        "attention_alerts": attention_alerts,
        "upcoming_appointments": upcoming_appts,
        "recent_activities": recent_activities
    }
