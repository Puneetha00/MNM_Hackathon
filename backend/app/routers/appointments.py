from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.appointment import Appointment
from app.models.collaboration import CaregiverElderlyLink
from app.models.notification import Notification
from app.schemas.appointment import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse
)
from app.security import get_current_user, check_elderly_access, log_audit

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("", response_model=List[AppointmentResponse])
def get_appointments(
    elderly_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = elderly_id or current_user.id
    if not check_elderly_access(target_user_id, current_user, db, "can_view_appointments"):
        raise HTTPException(status_code=403, detail="Not authorized to view appointments for this user")
        
    query = db.query(Appointment).filter(Appointment.user_id == target_user_id)
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
        
    appts = query.order_by(Appointment.appointment_datetime.asc()).all()
    return appts

@router.post("", response_model=AppointmentResponse)
def create_appointment(
    appt_data: AppointmentCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = appt_data.user_id or current_user.id
    if not check_elderly_access(target_user_id, current_user, db, "can_manage_appointments"):
        # If elderly booking own, check passes. If caregiver booking, requires can_manage_appointments or role caregiver
        if current_user.id != target_user_id and current_user.role not in ["caregiver", "admin"]:
            raise HTTPException(status_code=403, detail="Not authorized to schedule appointments for this user")
            
    appt = Appointment(
        user_id=target_user_id,
        doctor_name=appt_data.doctor_name,
        specialty=appt_data.specialty,
        hospital_clinic=appt_data.hospital_clinic,
        location_address=appt_data.location_address,
        appointment_datetime=appt_data.appointment_datetime,
        purpose=appt_data.purpose,
        status="upcoming",
        transportation_needed=appt_data.transportation_needed,
        accompanied_by=appt_data.accompanied_by,
        doctor_notes=appt_data.doctor_notes,
        preparation_instructions=appt_data.preparation_instructions
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    
    # Notify caregivers and family members about new appointment
    links = db.query(CaregiverElderlyLink).filter(
        CaregiverElderlyLink.elderly_id == target_user_id,
        CaregiverElderlyLink.status == "active",
        CaregiverElderlyLink.can_view_appointments == True
    ).all()
    
    elderly_user = db.query(User).filter(User.id == target_user_id).first()
    elderly_name = elderly_user.full_name if elderly_user else "Senior"
    
    time_str = appt.appointment_datetime.strftime("%b %d, %Y at %I:%M %p")
    for link in links:
        if link.member_id != current_user.id:
            db.add(Notification(
                user_id=link.member_id,
                title=f"New Appointment Scheduled: {elderly_name}",
                message=f"Appointment with Dr. {appt.doctor_name} ({appt.specialty}) scheduled for {time_str}.",
                type="appointment",
                severity="info"
            ))
    db.commit()
    
    log_audit(db, "APPOINTMENT_SCHEDULED", "RECORD", user_id=current_user.id, request=request, details={"appointment_id": appt.id, "doctor": appt.doctor_name, "datetime": str(appt.appointment_datetime)})
    return appt

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    update_data: AppointmentUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if not check_elderly_access(appt.user_id, current_user, db, "can_manage_appointments"):
        if current_user.id != appt.user_id and current_user.role not in ["caregiver", "admin"]:
            raise HTTPException(status_code=403, detail="Not authorized to edit this appointment")
            
    if update_data.doctor_name is not None: appt.doctor_name = update_data.doctor_name
    if update_data.specialty is not None: appt.specialty = update_data.specialty
    if update_data.hospital_clinic is not None: appt.hospital_clinic = update_data.hospital_clinic
    if update_data.location_address is not None: appt.location_address = update_data.location_address
    if update_data.appointment_datetime is not None: 
        appt.appointment_datetime = update_data.appointment_datetime
        appt.reminder_sent = False # reset reminder for new time
    if update_data.purpose is not None: appt.purpose = update_data.purpose
    if update_data.status is not None: appt.status = update_data.status
    if update_data.transportation_needed is not None: appt.transportation_needed = update_data.transportation_needed
    if update_data.accompanied_by is not None: appt.accompanied_by = update_data.accompanied_by
    if update_data.doctor_notes is not None: appt.doctor_notes = update_data.doctor_notes
    if update_data.preparation_instructions is not None: appt.preparation_instructions = update_data.preparation_instructions

    db.commit()
    db.refresh(appt)
    
    log_audit(db, "APPOINTMENT_UPDATED", "RECORD", user_id=current_user.id, request=request, details={"appointment_id": appt.id, "status": appt.status})
    return appt

@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if not check_elderly_access(appt.user_id, current_user, db, "can_manage_appointments"):
        if current_user.id != appt.user_id and current_user.role not in ["caregiver", "admin"]:
            raise HTTPException(status_code=403, detail="Not authorized to cancel this appointment")
            
    appt.status = "cancelled"
    db.commit()
    log_audit(db, "APPOINTMENT_CANCELLED", "RECORD", user_id=current_user.id, request=request, details={"appointment_id": appt.id})
    return {"message": "Appointment cancelled successfully"}
