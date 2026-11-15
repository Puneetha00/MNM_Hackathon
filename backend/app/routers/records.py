import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.medical_record import MedicalRecord
from app.schemas.records import MedicalRecordResponse
from app.security import get_current_user, check_elderly_access, log_audit

router = APIRouter(prefix="/records", tags=["Medical Records Vault"])

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB

@router.get("", response_model=List[MedicalRecordResponse])
def get_medical_records(
    elderly_id: Optional[int] = None,
    record_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = elderly_id or current_user.id
    if not check_elderly_access(target_user_id, current_user, db, "can_view_records"):
        raise HTTPException(status_code=403, detail="Not authorized to access medical records for this user")
        
    query = db.query(MedicalRecord).filter(MedicalRecord.user_id == target_user_id)
    if record_type:
        query = query.filter(MedicalRecord.record_type == record_type)
        
    records = query.order_by(MedicalRecord.record_date.desc(), MedicalRecord.created_at.desc()).all()
    return records

@router.post("/upload", response_model=MedicalRecordResponse)
async def upload_medical_record(
    request: Request,
    title: str = Form(...),
    record_type: str = Form("Prescription"),
    record_date: str = Form(...),
    doctor_name: Optional[str] = Form(None),
    hospital_clinic: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    elderly_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = elderly_id or current_user.id
    if not check_elderly_access(target_user_id, current_user, db, "can_view_records"):
        if current_user.id != target_user_id and current_user.role not in ["caregiver", "admin"]:
            raise HTTPException(status_code=403, detail="Not authorized to upload records for this user")

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    # Generate safe unique filename
    unique_filename = f"{uuid.uuid4().hex}_{os.path.basename(file.filename)}"
    destination_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Save file
    file_bytes = await file.read()
    file_size_kb = len(file_bytes) // 1024
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 15MB")

    with open(destination_path, "wb") as f:
        f.write(file_bytes)

    record = MedicalRecord(
        user_id=target_user_id,
        title=title,
        record_type=record_type,
        file_path=unique_filename,
        file_name=file.filename or "medical_document",
        file_size_kb=file_size_kb,
        mime_type=file.content_type or "application/octet-stream",
        doctor_name=doctor_name,
        hospital_clinic=hospital_clinic,
        record_date=record_date,
        notes=notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    log_audit(db, "RECORD_UPLOADED", "RECORD", user_id=current_user.id, request=request, details={"record_id": record.id, "title": record.title, "target_user": target_user_id})
    return record

@router.get("/{record_id}/download")
def download_medical_record(
    record_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical document not found")

    if not check_elderly_access(record.user_id, current_user, db, "can_view_records"):
        raise HTTPException(status_code=403, detail="Unauthorized to download this confidential medical document")

    file_full_path = os.path.join(settings.UPLOAD_DIR, record.file_path)
    if not os.path.exists(file_full_path):
        raise HTTPException(status_code=404, detail="File not found on storage")

    log_audit(db, "RECORD_ACCESSED", "RECORD", user_id=current_user.id, request=request, details={"record_id": record.id, "title": record.title})
    return FileResponse(
        path=file_full_path,
        filename=record.file_name,
        media_type=record.mime_type
    )

@router.delete("/{record_id}")
def delete_medical_record(
    record_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if current_user.id != record.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the elderly account owner or administrator can delete medical documents")

    # Delete physical file
    file_full_path = os.path.join(settings.UPLOAD_DIR, record.file_path)
    if os.path.exists(file_full_path):
        try:
            os.remove(file_full_path)
        except Exception:
            pass

    db.delete(record)
    db.commit()

    log_audit(db, "RECORD_DELETED", "RECORD", user_id=current_user.id, request=request, details={"record_id": record_id, "title": record.title})
    return {"message": "Medical record deleted permanently"}
