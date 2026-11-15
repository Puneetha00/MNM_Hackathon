import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications & Reminders"])

@router.get("")
def get_notifications(
    limit: int = 50,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
        
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    items = []
    for n in notifications:
        try:
            meta = json.loads(n.metadata_json) if n.metadata_json else {}
        except Exception:
            meta = {}
        items.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "severity": n.severity,
            "is_read": n.is_read,
            "metadata": meta,
            "created_at": n.created_at.isoformat()
        })

    return {
        "unread_count": unread_count,
        "notifications": items
    }

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read"}

@router.put("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

@router.post("/test-trigger")
def trigger_test_reminder(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Triggers an instantaneous test medication reminder to verify alert engine."""
    notif = Notification(
        user_id=current_user.id,
        title="🔔 Test Reminder: Metformin 500mg Due",
        message="This is a test notification from the ElderCare reminder engine. Take with food.",
        type="medication_reminder",
        severity="info",
        metadata_json=json.dumps({"test": True, "time": datetime.now().strftime("%H:%M")})
    )
    db.add(notif)
    db.commit()
    return {"message": "Test notification dispatched successfully", "notification_id": notif.id}
