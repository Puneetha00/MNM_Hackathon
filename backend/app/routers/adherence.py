import json
from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.medication import Medication
from app.models.dose_log import DoseLog
from app.security import get_current_user, check_elderly_access

router = APIRouter(prefix="/adherence", tags=["Adherence Reports & Insights"])

@router.get("/summary")
def get_adherence_summary(
    elderly_id: Optional[int] = None,
    days: int = 14,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = elderly_id or current_user.id
    if not check_elderly_access(target_user_id, current_user, db, "can_view_adherence"):
        raise HTTPException(status_code=403, detail="Not authorized to view adherence for this user")

    now = datetime.now()
    start_date = (now - timedelta(days=days - 1)).strftime("%Y-%m-%d")
    today_str = now.strftime("%Y-%m-%d")

    # Fetch all dose logs in range
    logs = db.query(DoseLog).join(Medication).filter(
        DoseLog.user_id == target_user_id,
        DoseLog.scheduled_date >= start_date,
        DoseLog.scheduled_date <= today_str,
        Medication.is_active == True
    ).all()

    total_doses = len(logs)
    taken_doses = sum(1 for l in logs if l.status == "taken")
    missed_doses = sum(1 for l in logs if l.status == "missed")
    upcoming_doses = sum(1 for l in logs if l.status == "upcoming")
    skipped_doses = sum(1 for l in logs if l.status == "skipped")

    # Only count taken + missed for adherence rate to avoid penalizing future doses
    evaluated_doses = taken_doses + missed_doses
    overall_rate = round((taken_doses / evaluated_doses * 100), 1) if evaluated_doses > 0 else 100.0

    # Daily breakdown for charts
    daily_stats = {}
    for i in range(days):
        d_str = (now - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        daily_stats[d_str] = {"date": d_str, "taken": 0, "missed": 0, "upcoming": 0, "rate": 0}

    # Group by medication to find frequently missed
    med_missed_count = {}
    med_total_count = {}
    med_name_map = {}

    # Time of day pattern breakdown
    time_slots = {
        "Morning (6AM - 12PM)": {"taken": 0, "missed": 0, "total": 0},
        "Afternoon (12PM - 5PM)": {"taken": 0, "missed": 0, "total": 0},
        "Evening (5PM - 9PM)": {"taken": 0, "missed": 0, "total": 0},
        "Night (9PM - 6AM)": {"taken": 0, "missed": 0, "total": 0},
    }

    for log in logs:
        med_id = log.medication_id
        med_name = log.medication.name if log.medication else f"Med #{med_id}"
        med_name_map[med_id] = med_name
        
        med_total_count[med_id] = med_total_count.get(med_id, 0) + 1
        if log.status == "missed":
            med_missed_count[med_id] = med_missed_count.get(med_id, 0) + 1

        if log.scheduled_date in daily_stats:
            if log.status == "taken":
                daily_stats[log.scheduled_date]["taken"] += 1
            elif log.status == "missed":
                daily_stats[log.scheduled_date]["missed"] += 1
            elif log.status == "upcoming":
                daily_stats[log.scheduled_date]["upcoming"] += 1

        # Classify time slot
        try:
            hour = int(log.scheduled_time.split(":")[0])
            if 6 <= hour < 12:
                slot = "Morning (6AM - 12PM)"
            elif 12 <= hour < 17:
                slot = "Afternoon (12PM - 5PM)"
            elif 17 <= hour < 21:
                slot = "Evening (5PM - 9PM)"
            else:
                slot = "Night (9PM - 6AM)"
                
            time_slots[slot]["total"] += 1
            if log.status == "taken":
                time_slots[slot]["taken"] += 1
            elif log.status == "missed":
                time_slots[slot]["missed"] += 1
        except Exception:
            pass

    # Compute daily rates
    trend_data = []
    for d_str, data in sorted(daily_stats.items()):
        denom = data["taken"] + data["missed"]
        data["rate"] = round((data["taken"] / denom * 100), 1) if denom > 0 else 100.0
        # format date for display e.g. "Nov 15"
        try:
            dt = datetime.strptime(d_str, "%Y-%m-%d")
            data["display_date"] = dt.strftime("%b %d")
        except Exception:
            data["display_date"] = d_str
        trend_data.append(data)

    # Compile frequently missed list
    frequently_missed = []
    for med_id, missed_cnt in med_missed_count.items():
        total_sched = med_total_count.get(med_id, 1)
        miss_rate = round((missed_cnt / total_sched * 100), 1)
        frequently_missed.append({
            "medication_id": med_id,
            "medication_name": med_name_map.get(med_id, "Unknown"),
            "missed_count": missed_cnt,
            "total_scheduled": total_sched,
            "miss_rate": miss_rate
        })
    frequently_missed.sort(key=lambda x: x["missed_count"], reverse=True)

    # Time slot adherence summary
    time_pattern_summary = []
    for slot_name, stats in time_slots.items():
        evaluated = stats["taken"] + stats["missed"]
        rate = round((stats["taken"] / evaluated * 100), 1) if evaluated > 0 else 100.0
        time_pattern_summary.append({
            "slot": slot_name,
            "taken": stats["taken"],
            "missed": stats["missed"],
            "total": stats["total"],
            "adherence_rate": rate
        })

    # Rating badge
    if overall_rate >= 90:
        score_category = "Excellent"
        recommendation = "Medication routine is well maintained! Continue with standard scheduled reminders."
    elif overall_rate >= 75:
        score_category = "Moderate"
        recommendation = "Some doses are being missed, especially during afternoon/evening. Consider setting audible alerts."
    else:
        score_category = "Needs Attention"
        recommendation = "Adherence is significantly below recommended threshold. Caregiver intervention is recommended."

    return {
        "overall_adherence_rate": overall_rate,
        "score_category": score_category,
        "recommendation": recommendation,
        "total_doses": total_doses,
        "taken_doses": taken_doses,
        "missed_doses": missed_doses,
        "upcoming_doses": upcoming_doses,
        "skipped_doses": skipped_doses,
        "trend_data": trend_data,
        "time_pattern_summary": time_pattern_summary,
        "frequently_missed": frequently_missed[:5],
        "days_analyzed": days
    }
