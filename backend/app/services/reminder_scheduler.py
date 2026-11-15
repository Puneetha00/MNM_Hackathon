import json
import logging
from datetime import datetime, date, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.medication import Medication
from app.models.dose_log import DoseLog
from app.models.appointment import Appointment
from app.models.notification import Notification
from app.models.collaboration import CaregiverElderlyLink
from app.services.email_service import (
    send_healthcare_email, 
    generate_medication_reminder_email,
    generate_missed_dose_alert_email
)
from app.config import settings

logger = logging.getLogger("eldercare.scheduler")
scheduler = BackgroundScheduler()

def ensure_daily_dose_logs(db: Session, target_date_str: str):
    """
    Ensures that for all active medications, DoseLog entries exist for the given day.
    """
    meds = db.query(Medication).filter(Medication.is_active == True).all()
    for med in meds:
        # Check start and end date
        if med.start_date and med.start_date > target_date_str:
            continue
        if med.end_date and med.end_date < target_date_str:
            continue
            
        try:
            timings = json.loads(med.timings_json) if med.timings_json else ["08:00"]
        except Exception:
            timings = ["08:00"]
            
        for t in timings:
            t = t.strip()
            existing = db.query(DoseLog).filter(
                DoseLog.medication_id == med.id,
                DoseLog.scheduled_date == target_date_str,
                DoseLog.scheduled_time == t
            ).first()
            
            if not existing:
                log = DoseLog(
                    medication_id=med.id,
                    user_id=med.user_id,
                    scheduled_date=target_date_str,
                    scheduled_time=t,
                    status="upcoming",
                    reminder_sent=False,
                    missed_alert_sent=False
                )
                db.add(log)
    db.commit()

def run_reminder_checks():
    """Periodic job executed by the scheduler every 60 seconds."""
    db: Session = SessionLocal()
    try:
        now = datetime.now()
        today_str = now.strftime("%Y-%m-%d")
        current_time_str = now.strftime("%H:%M")
        
        # 1. Ensure today's logs exist
        ensure_daily_dose_logs(db, today_str)
        
        # 2. Check upcoming reminders
        logs = db.query(DoseLog).filter(
            DoseLog.scheduled_date == today_str,
            DoseLog.status == "upcoming",
            DoseLog.reminder_sent == False
        ).all()
        
        for log in logs:
            med = log.medication
            user = log.user
            if not med or not user:
                continue
                
            # Parse scheduled time
            try:
                hour, minute = map(int, log.scheduled_time.split(":"))
                sched_dt = datetime(now.year, now.month, now.day, hour, minute)
            except Exception:
                continue
                
            lead_time = timedelta(minutes=user.reminder_advance_minutes or 15)
            reminder_window_start = sched_dt - lead_time
            
            if now >= reminder_window_start:
                # Time to send reminder
                log.reminder_sent = True
                
                # Create in-app notification
                notif = Notification(
                    user_id=user.id,
                    title=f"Medication Due: {med.name} ({med.dosage})",
                    message=f"Scheduled for {log.scheduled_time}. {med.instructions}",
                    type="medication_reminder",
                    severity="info",
                    metadata_json=json.dumps({"medication_id": med.id, "dose_log_id": log.id, "time": log.scheduled_time})
                )
                db.add(notif)
                
                # Send email if enabled
                if user.email_notifications and user.email:
                    html_content = generate_medication_reminder_email(
                        user_name=user.full_name,
                        med_name=med.name,
                        dosage=med.dosage,
                        time_str=log.scheduled_time,
                        instructions=med.instructions
                    )
                    send_healthcare_email(
                        to_email=user.email,
                        subject=f"Reminder: {med.name} at {log.scheduled_time}",
                        html_content=html_content
                    )
                    
        db.commit()
        
        # 3. Check for missed doses past grace period
        grace_limit = timedelta(minutes=settings.MISSED_DOSE_GRACE_MINUTES)
        unconfirmed_logs = db.query(DoseLog).filter(
            DoseLog.scheduled_date == today_str,
            DoseLog.status == "upcoming",
            DoseLog.missed_alert_sent == False
        ).all()
        
        for log in unconfirmed_logs:
            try:
                hour, minute = map(int, log.scheduled_time.split(":"))
                sched_dt = datetime(now.year, now.month, now.day, hour, minute)
            except Exception:
                continue
                
            if now > (sched_dt + grace_limit):
                # Mark as missed
                log.status = "missed"
                log.missed_alert_sent = True
                med = log.medication
                user = log.user
                
                # Elderly notification
                db.add(Notification(
                    user_id=user.id,
                    title=f"Missed Dose: {med.name}",
                    message=f"The scheduled dose at {log.scheduled_time} was not confirmed. Please check with your caregiver if you took it late.",
                    type="missed_dose",
                    severity="warning",
                    metadata_json=json.dumps({"medication_id": med.id, "dose_log_id": log.id})
                ))
                
                # Notify authorized caregivers and family members
                links = db.query(CaregiverElderlyLink).filter(
                    CaregiverElderlyLink.elderly_id == user.id,
                    CaregiverElderlyLink.status == "active",
                    CaregiverElderlyLink.can_receive_missed_dose_alerts == True
                ).all()
                
                for link in links:
                    guardian = link.member
                    if guardian:
                        db.add(Notification(
                            user_id=guardian.id,
                            title=f"Care Alert: {user.full_name} missed {med.name}",
                            message=f"{user.full_name} did not confirm {med.name} ({med.dosage}) scheduled for {log.scheduled_time}.",
                            type="caregiver_alert",
                            severity="warning",
                            metadata_json=json.dumps({"elderly_id": user.id, "medication_id": med.id})
                        ))
                        if guardian.email_notifications and guardian.email:
                            alert_html = generate_missed_dose_alert_email(
                                caregiver_name=guardian.full_name,
                                senior_name=user.full_name,
                                med_name=med.name,
                                dosage=med.dosage,
                                scheduled_time=log.scheduled_time
                            )
                            send_healthcare_email(
                                to_email=guardian.email,
                                subject=f"ElderCare Missed Dose Alert: {user.full_name}",
                                html_content=alert_html
                            )
        db.commit()
        
        # 4. Check appointment reminders (within next 24 hours)
        tomorrow = now + timedelta(days=1)
        upcoming_appts = db.query(Appointment).filter(
            Appointment.status == "upcoming",
            Appointment.reminder_sent == False,
            Appointment.appointment_datetime >= now,
            Appointment.appointment_datetime <= tomorrow
        ).all()
        
        for appt in upcoming_appts:
            appt.reminder_sent = True
            appt_user = appt.user
            if appt_user:
                time_display = appt.appointment_datetime.strftime("%b %d at %I:%M %p")
                db.add(Notification(
                    user_id=appt_user.id,
                    title=f"Upcoming Doctor Visit: Dr. {appt.doctor_name}",
                    message=f"Tomorrow: {appt.purpose} at {appt.hospital_clinic} ({time_display}).",
                    type="appointment",
                    severity="info",
                    metadata_json=json.dumps({"appointment_id": appt.id})
                ))
        db.commit()
        
    except Exception as e:
        logger.error(f"Error in scheduler job: {e}")
        db.rollback()
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            run_reminder_checks, 
            "interval", 
            seconds=settings.REMINDER_CHECK_INTERVAL_SECONDS,
            id="eldercare_reminders",
            replace_existing=True
        )
        scheduler.start()
        logger.info("ElderCare proactive background scheduler started.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("ElderCare proactive background scheduler stopped.")
