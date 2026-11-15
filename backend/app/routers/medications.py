import json
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.medication import Medication
from app.models.dose_log import DoseLog
from app.models.collaboration import CaregiverElderlyLink
from app.schemas.medication import (
    MedicationCreate, MedicationUpdate, MedicationResponse, 
    DoseLogResponse, DoseActionRequest
)
from app.security import get_current_user, check_elderly_access, log_audit
from app.services.reminder_scheduler import ensure_daily_dose_logs

router = APIRouter(prefix="/medications", tags=["Medications"])

@router.get("", response_model=List[MedicationResponse])
def get_medications(
    elderly_id: Optional[int] = None, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    target_user_id = elderly_id or current_user.id
    if not check_elderly_access(target_user_id, current_user, db, "can_view_medications"):
        raise HTTPException(status_code=403, detail="Not authorized to view medications for this user")
        
    meds = db.query(Medication).filter(Medication.user_id == target_user_id, Medication.is_active == True).all()
    
    result = []
    for m in meds:
        try:
            timings = json.loads(m.timings_json) if m.timings_json else ["08:00"]
        except Exception:
            timings = ["08:00"]
        result.append(MedicationResponse(
            id=m.id,
            user_id=m.user_id,
            name=m.name,
            generic_name=m.generic_name,
            dosage=m.dosage,
            form=m.form,
            frequency=m.frequency,
            timings=timings,
            instructions=m.instructions,
            start_date=m.start_date,
            end_date=m.end_date,
            color=m.color,
            pill_shape=m.pill_shape,
            prescribing_doctor=m.prescribing_doctor,
            refill_remaining=m.refill_remaining,
            notes=m.notes,
            is_active=m.is_active,
            created_at=m.created_at,
            updated_at=m.updated_at
        ))
    return result

@router.post("", response_model=MedicationResponse)
def create_medication(
    med_data: MedicationCreate, 
    request: Request,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    target_user_id = med_data.user_id or current_user.id
    if not check_elderly_access(target_user_id, current_user, db, "can_manage_medications"):
        raise HTTPException(status_code=403, detail="Not authorized to add medications for this user")
        
    timings_str = json.dumps(med_data.timings)
    
    med = Medication(
        user_id=target_user_id,
        name=med_data.name,
        generic_name=med_data.generic_name,
        dosage=med_data.dosage,
        form=med_data.form,
        frequency=med_data.frequency,
        timings_json=timings_str,
        instructions=med_data.instructions,
        start_date=med_data.start_date,
        end_date=med_data.end_date,
        color=med_data.color,
        pill_shape=med_data.pill_shape,
        prescribing_doctor=med_data.prescribing_doctor,
        refill_remaining=med_data.refill_remaining,
        notes=med_data.notes,
        is_active=True
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    
    # Generate dose logs for today
    today_str = datetime.now().strftime("%Y-%m-%d")
    ensure_daily_dose_logs(db, today_str)
    
    log_audit(db, "MEDICATION_ADDED", "MEDICATION", user_id=current_user.id, request=request, details={"medication_id": med.id, "name": med.name, "target_user": target_user_id})
    
    return MedicationResponse(
        id=med.id,
        user_id=med.user_id,
        name=med.name,
        generic_name=med.generic_name,
        dosage=med.dosage,
        form=med.form,
        frequency=med.frequency,
        timings=med_data.timings,
        instructions=med.instructions,
        start_date=med.start_date,
        end_date=med.end_date,
        color=med.color,
        pill_shape=med.pill_shape,
        prescribing_doctor=med.prescribing_doctor,
        refill_remaining=med.refill_remaining,
        notes=med.notes,
        is_active=med.is_active,
        created_at=med.created_at,
        updated_at=med.updated_at
    )

@router.put("/{medication_id}", response_model=MedicationResponse)
def update_medication(
    medication_id: int, 
    update_data: MedicationUpdate, 
    request: Request,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    med = db.query(Medication).filter(Medication.id == medication_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
        
    if not check_elderly_access(med.user_id, current_user, db, "can_manage_medications"):
        raise HTTPException(status_code=403, detail="Not authorized to edit this medication")
        
    if update_data.name is not None: med.name = update_data.name
    if update_data.generic_name is not None: med.generic_name = update_data.generic_name
    if update_data.dosage is not None: med.dosage = update_data.dosage
    if update_data.form is not None: med.form = update_data.form
    if update_data.frequency is not None: med.frequency = update_data.frequency
    if update_data.timings is not None: med.timings_json = json.dumps(update_data.timings)
    if update_data.instructions is not None: med.instructions = update_data.instructions
    if update_data.start_date is not None: med.start_date = update_data.start_date
    if update_data.end_date is not None: med.end_date = update_data.end_date
    if update_data.color is not None: med.color = update_data.color
    if update_data.pill_shape is not None: med.pill_shape = update_data.pill_shape
    if update_data.prescribing_doctor is not None: med.prescribing_doctor = update_data.prescribing_doctor
    if update_data.refill_remaining is not None: med.refill_remaining = update_data.refill_remaining
    if update_data.notes is not None: med.notes = update_data.notes
    if update_data.is_active is not None: med.is_active = update_data.is_active
    
    db.commit()
    db.refresh(med)
    
    log_audit(db, "MEDICATION_UPDATED", "MEDICATION", user_id=current_user.id, request=request, details={"medication_id": med.id, "name": med.name})
    
    timings = json.loads(med.timings_json) if med.timings_json else ["08:00"]
    return MedicationResponse(
        id=med.id,
        user_id=med.user_id,
        name=med.name,
        generic_name=med.generic_name,
        dosage=med.dosage,
        form=med.form,
        frequency=med.frequency,
        timings=timings,
        instructions=med.instructions,
        start_date=med.start_date,
        end_date=med.end_date,
        color=med.color,
        pill_shape=med.pill_shape,
        prescribing_doctor=med.prescribing_doctor,
        refill_remaining=med.refill_remaining,
        notes=med.notes,
        is_active=med.is_active,
        created_at=med.created_at,
        updated_at=med.updated_at
    )

@router.delete("/{medication_id}")
def delete_medication(
    medication_id: int, 
    request: Request,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    med = db.query(Medication).filter(Medication.id == medication_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
        
    if not check_elderly_access(med.user_id, current_user, db, "can_manage_medications"):
        raise HTTPException(status_code=403, detail="Not authorized to delete this medication")
        
    med.is_active = False
    db.commit()
    
    log_audit(db, "MEDICATION_DELETED", "MEDICATION", user_id=current_user.id, request=request, details={"medication_id": med.id, "name": med.name})
    return {"message": "Medication archived/deleted successfully"}

@router.get("/schedule/today", response_model=List[DoseLogResponse])
def get_today_schedule(
    elderly_id: Optional[int] = None, 
    target_date: Optional[str] = None,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    target_user_id = elderly_id or current_user.id
    if not check_elderly_access(target_user_id, current_user, db, "can_view_medications"):
        raise HTTPException(status_code=403, detail="Not authorized to view schedule for this user")
        
    date_str = target_date or datetime.now().strftime("%Y-%m-%d")
    ensure_daily_dose_logs(db, date_str)
    
    # Query logs sorted by time
    logs = db.query(DoseLog).join(Medication).filter(
        DoseLog.user_id == target_user_id,
        DoseLog.scheduled_date == date_str,
        Medication.is_active == True
    ).order_by(DoseLog.scheduled_time.asc()).all()
    
    # If past scheduled time by grace period and still upcoming, mark as missed for display
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    
    results = []
    for log in logs:
        med = log.medication
        # Check if overdue on today
        if date_str == today_str and log.status == "upcoming":
            try:
                hour, minute = map(int, log.scheduled_time.split(":"))
                sched_dt = datetime(now.year, now.month, now.day, hour, minute)
                if now > (sched_dt + datetime.timedelta(minutes=45) if hasattr(datetime, "timedelta") else sched_dt):
                    pass # Handled by scheduler or display as overdue
            except Exception:
                pass
                
        marked_name = log.marked_by.full_name if log.marked_by else None
        results.append(DoseLogResponse(
            id=log.id,
            medication_id=log.medication_id,
            medication_name=med.name,
            dosage=med.dosage,
            instructions=med.instructions,
            form=med.form,
            color=med.color,
            pill_shape=med.pill_shape,
            scheduled_date=log.scheduled_date,
            scheduled_time=log.scheduled_time,
            status=log.status,
            taken_at=log.taken_at,
            notes=log.notes,
            marked_by_name=marked_name
        ))
    return results

@router.post("/dose/{dose_log_id}/status")
def mark_dose_status(
    dose_log_id: int, 
    action: DoseActionRequest, 
    request: Request,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    log = db.query(DoseLog).filter(DoseLog.id == dose_log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Dose log record not found")
        
    # Check permission: elderly can mark their own, caregiver can mark if authorized
    if not check_elderly_access(log.user_id, current_user, db, "can_manage_medications"):
        # Even if not full manage, elderly or primary caregiver should be allowed to mark taken
        if current_user.id != log.user_id and current_user.role not in ["caregiver", "admin"]:
            raise HTTPException(status_code=403, detail="Not authorized to update dose status")
            
    log.status = action.status
    if action.status == "taken":
        log.taken_at = action.taken_at or datetime.utcnow()
    else:
        log.taken_at = None
        
    log.notes = action.notes
    log.marked_by_user_id = current_user.id
    db.commit()
    
    med = log.medication
    log_audit(db, f"DOSE_{action.status.upper()}", "MEDICATION", user_id=current_user.id, request=request, details={
        "dose_log_id": log.id,
        "medication_id": log.medication_id,
        "medication_name": med.name if med else "Unknown",
        "status": action.status,
        "elderly_id": log.user_id
    })
    
    return {"message": f"Dose marked as {action.status}", "status": action.status, "taken_at": log.taken_at}
