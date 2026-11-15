import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.health_profile import HealthProfile
from app.models.wellness import WellnessLog
from app.models.medication import Medication
from app.models.dose_log import DoseLog
from app.schemas.health_profile import HealthProfileUpdate, HealthProfileResponse
from app.schemas.wellness import WellnessUpdate, WellnessResponse
from app.security import get_current_user, check_elderly_access, log_audit

router = APIRouter(prefix="/users", tags=["User & Health Profile"])

@router.get("/health-profile", response_model=HealthProfileResponse)
def get_health_profile(
    elderly_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = elderly_id or current_user.id
    if not check_elderly_access(target_user_id, current_user, db, "can_view_records"):
        raise HTTPException(status_code=403, detail="Not authorized to view health profile")

    hp = db.query(HealthProfile).filter(HealthProfile.user_id == target_user_id).first()
    if not hp:
        # Create default
        hp = HealthProfile(user_id=target_user_id)
        db.add(hp)
        db.commit()
        db.refresh(hp)

    allergies = json.loads(hp.allergies_json) if hp.allergies_json else []
    conditions = json.loads(hp.conditions_json) if hp.conditions_json else []
    contacts = json.loads(hp.emergency_contacts_json) if hp.emergency_contacts_json else []

    return HealthProfileResponse(
        id=hp.id,
        user_id=hp.user_id,
        date_of_birth=hp.date_of_birth,
        gender=hp.gender,
        blood_type=hp.blood_type,
        height_cm=hp.height_cm,
        weight_kg=hp.weight_kg,
        allergies=allergies,
        conditions=conditions,
        primary_doctor_name=hp.primary_doctor_name,
        primary_doctor_phone=hp.primary_doctor_phone,
        primary_doctor_hospital=hp.primary_doctor_hospital,
        emergency_contacts=contacts,
        dnr_status=hp.dnr_status,
        preferred_hospital=hp.preferred_hospital,
        insurance_provider=hp.insurance_provider,
        insurance_policy_number=hp.insurance_policy_number,
        special_care_notes=hp.special_care_notes,
        updated_at=hp.updated_at
    )

@router.put("/health-profile", response_model=HealthProfileResponse)
def update_health_profile(
    update_data: HealthProfileUpdate,
    request: Request,
    elderly_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = elderly_id or current_user.id
    if current_user.id != target_user_id and current_user.role not in ["caregiver", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit health profile")

    hp = db.query(HealthProfile).filter(HealthProfile.user_id == target_user_id).first()
    if not hp:
        hp = HealthProfile(user_id=target_user_id)
        db.add(hp)

    if update_data.date_of_birth is not None: hp.date_of_birth = update_data.date_of_birth
    if update_data.gender is not None: hp.gender = update_data.gender
    if update_data.blood_type is not None: hp.blood_type = update_data.blood_type
    if update_data.height_cm is not None: hp.height_cm = update_data.height_cm
    if update_data.weight_kg is not None: hp.weight_kg = update_data.weight_kg
    if update_data.allergies is not None: hp.allergies_json = json.dumps(update_data.allergies)
    if update_data.conditions is not None: hp.conditions_json = json.dumps(update_data.conditions)
    if update_data.primary_doctor_name is not None: hp.primary_doctor_name = update_data.primary_doctor_name
    if update_data.primary_doctor_phone is not None: hp.primary_doctor_phone = update_data.primary_doctor_phone
    if update_data.primary_doctor_hospital is not None: hp.primary_doctor_hospital = update_data.primary_doctor_hospital
    if update_data.emergency_contacts is not None: hp.emergency_contacts_json = json.dumps(update_data.emergency_contacts)
    if update_data.dnr_status is not None: hp.dnr_status = update_data.dnr_status
    if update_data.preferred_hospital is not None: hp.preferred_hospital = update_data.preferred_hospital
    if update_data.insurance_provider is not None: hp.insurance_provider = update_data.insurance_provider
    if update_data.insurance_policy_number is not None: hp.insurance_policy_number = update_data.insurance_policy_number
    if update_data.special_care_notes is not None: hp.special_care_notes = update_data.special_care_notes

    db.commit()
    db.refresh(hp)
    log_audit(db, "HEALTH_PROFILE_UPDATED", "RECORD", user_id=current_user.id, request=request, details={"target_user": target_user_id})

    allergies = json.loads(hp.allergies_json) if hp.allergies_json else []
    conditions = json.loads(hp.conditions_json) if hp.conditions_json else []
    contacts = json.loads(hp.emergency_contacts_json) if hp.emergency_contacts_json else []

    return HealthProfileResponse(
        id=hp.id,
        user_id=hp.user_id,
        date_of_birth=hp.date_of_birth,
        gender=hp.gender,
        blood_type=hp.blood_type,
        height_cm=hp.height_cm,
        weight_kg=hp.weight_kg,
        allergies=allergies,
        conditions=conditions,
        primary_doctor_name=hp.primary_doctor_name,
        primary_doctor_phone=hp.primary_doctor_phone,
        primary_doctor_hospital=hp.primary_doctor_hospital,
        emergency_contacts=contacts,
        dnr_status=hp.dnr_status,
        preferred_hospital=hp.preferred_hospital,
        insurance_provider=hp.insurance_provider,
        insurance_policy_number=hp.insurance_policy_number,
        special_care_notes=hp.special_care_notes,
        updated_at=hp.updated_at
    )

@router.get("/wellness/today", response_model=WellnessResponse)
def get_today_wellness(
    elderly_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = elderly_id or current_user.id
    if not check_elderly_access(target_user_id, current_user, db):
        raise HTTPException(status_code=403, detail="Unauthorized")

    today_str = datetime.now().strftime("%Y-%m-%d")
    log = db.query(WellnessLog).filter(WellnessLog.user_id == target_user_id, WellnessLog.log_date == today_str).first()
    if not log:
        default_tasks = [
            {"id": 1, "task": "Drink morning warm water & take pills", "done": False},
            {"id": 2, "task": "15-minute gentle garden walk / light stretch", "done": False},
            {"id": 3, "task": "Afternoon hydration & healthy snack", "done": False},
            {"id": 4, "task": "Evening call or chat with family", "done": False}
        ]
        log = WellnessLog(
            user_id=target_user_id,
            log_date=today_str,
            water_glasses=3,
            water_target=8,
            steps_count=1250,
            steps_target=3000,
            sleep_hours=7.5,
            mood="Good",
            tasks_json=json.dumps(default_tasks)
        )
        db.add(log)
        db.commit()
        db.refresh(log)

    tasks = json.loads(log.tasks_json) if log.tasks_json else []
    return WellnessResponse(
        id=log.id,
        user_id=log.user_id,
        log_date=log.log_date,
        water_glasses=log.water_glasses,
        water_target=log.water_target,
        steps_count=log.steps_count,
        steps_target=log.steps_target,
        sleep_hours=log.sleep_hours,
        mood=log.mood,
        tasks=tasks,
        notes=log.notes,
        updated_at=log.updated_at
    )

@router.put("/wellness/today", response_model=WellnessResponse)
def update_today_wellness(
    update_data: WellnessUpdate,
    elderly_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = elderly_id or current_user.id
    today_str = datetime.now().strftime("%Y-%m-%d")
    log = db.query(WellnessLog).filter(WellnessLog.user_id == target_user_id, WellnessLog.log_date == today_str).first()
    if not log:
        log = WellnessLog(user_id=target_user_id, log_date=today_str)
        db.add(log)

    if update_data.water_glasses is not None: log.water_glasses = update_data.water_glasses
    if update_data.water_target is not None: log.water_target = update_data.water_target
    if update_data.steps_count is not None: log.steps_count = update_data.steps_count
    if update_data.steps_target is not None: log.steps_target = update_data.steps_target
    if update_data.sleep_hours is not None: log.sleep_hours = update_data.sleep_hours
    if update_data.mood is not None: log.mood = update_data.mood
    if update_data.tasks is not None: log.tasks_json = json.dumps(update_data.tasks)
    if update_data.notes is not None: log.notes = update_data.notes

    db.commit()
    db.refresh(log)

    tasks = json.loads(log.tasks_json) if log.tasks_json else []
    return WellnessResponse(
        id=log.id,
        user_id=log.user_id,
        log_date=log.log_date,
        water_glasses=log.water_glasses,
        water_target=log.water_target,
        steps_count=log.steps_count,
        steps_target=log.steps_target,
        sleep_hours=log.sleep_hours,
        mood=log.mood,
        tasks=tasks,
        notes=log.notes,
        updated_at=log.updated_at
    )

@router.post("/voice-command")
def process_voice_command(
    command_data: Dict[str, str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transcript = command_data.get("command", "").lower().strip()
    today_str = datetime.now().strftime("%Y-%m-%d")

    if not transcript:
        return {"action": "none", "response_speech": "I didn't hear a command. Please try again."}

    # Match commands
    if "mark" in transcript and ("taken" in transcript or "done" in transcript or "take" in transcript):
        # Find next upcoming dose
        dose = db.query(DoseLog).join(Medication).filter(
            DoseLog.user_id == current_user.id,
            DoseLog.scheduled_date == today_str,
            DoseLog.status == "upcoming"
        ).order_by(DoseLog.scheduled_time.asc()).first()

        if dose:
            dose.status = "taken"
            dose.taken_at = datetime.utcnow()
            dose.marked_by_user_id = current_user.id
            db.commit()
            med_name = dose.medication.name if dose.medication else "your medication"
            return {
                "action": "dose_marked",
                "dose_id": dose.id,
                "response_speech": f"Great job! I've marked your {med_name} scheduled for {dose.scheduled_time} as taken."
            }
        else:
            return {
                "action": "none",
                "response_speech": "You have no upcoming doses left for today! All medications are up to date."
            }

    elif "next" in transcript and ("medicine" in transcript or "dose" in transcript or "pill" in transcript or "medication" in transcript):
        dose = db.query(DoseLog).join(Medication).filter(
            DoseLog.user_id == current_user.id,
            DoseLog.scheduled_date == today_str,
            DoseLog.status == "upcoming"
        ).order_by(DoseLog.scheduled_time.asc()).first()

        if dose:
            med = dose.medication
            return {
                "action": "next_dose_info",
                "response_speech": f"Your next scheduled medication is {med.name}, {med.dosage}, at {dose.scheduled_time}. {med.instructions}."
            }
        else:
            return {
                "action": "next_dose_info",
                "response_speech": "You have completed all scheduled medications for today!"
            }

    elif "emergency" in transcript or "help" in transcript or "sos" in transcript:
        return {
            "action": "trigger_emergency",
            "response_speech": "Triggering emergency assistance now. Alerting your family and caregivers immediately."
        }

    elif "water" in transcript and ("add" in transcript or "drink" in transcript or "more" in transcript):
        log = db.query(WellnessLog).filter(WellnessLog.user_id == current_user.id, WellnessLog.log_date == today_str).first()
        if log:
            log.water_glasses += 1
            db.commit()
            return {
                "action": "water_logged",
                "response_speech": f"Logged a glass of water! You've had {log.water_glasses} of your {log.water_target} target glasses today."
            }

    return {
        "action": "unrecognized",
        "response_speech": f"I heard: '{transcript}'. You can say: 'Next medicine', 'Mark as taken', 'Add water', or 'Emergency help'."
    }
