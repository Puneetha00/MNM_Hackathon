import os
import json
from datetime import datetime, timedelta, date
from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.health_profile import HealthProfile
from app.models.medication import Medication
from app.models.dose_log import DoseLog
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.collaboration import CaregiverElderlyLink, Invitation
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.models.wellness import WellnessLog
from app.security import hash_password, hash_passcode

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    existing_user = db.query(User).filter(User.email == "margaret.davis@eldercare.health").first()
    if existing_user:
        print("Database already contains seed data.")
        db.close()
        return

    print("Seeding ElderCare database with realistic healthcare ecosystem data...")

    # 1. Create Core Users
    margaret = User(
        email="margaret.davis@eldercare.health",
        hashed_password=hash_password("Password123!"),
        full_name="Margaret Davis",
        role="elderly",
        phone="+1 (555) 234-5678",
        avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
        passcode_hash=hash_passcode("123456"),
        accessibility_mode=False,
        large_font=False,
        high_contrast=False,
        voice_enabled=True,
        email_notifications=True,
        push_notifications=True,
        sound_alerts=True,
        reminder_advance_minutes=15
    )

    robert = User(
        email="robert.chen@eldercare.health",
        hashed_password=hash_password("Password123!"),
        full_name="Robert Chen",
        role="elderly",
        phone="+1 (555) 345-6789",
        avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        passcode_hash=hash_passcode("123456")
    )

    david = User(
        email="david.miller@eldercare.health",
        hashed_password=hash_password("Password123!"),
        full_name="David Miller, RN",
        role="caregiver",
        phone="+1 (555) 456-7890",
        avatar_url="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=face",
        passcode_hash=hash_passcode("123456")
    )

    sarah = User(
        email="sarah.davis@eldercare.health",
        hashed_password=hash_password("Password123!"),
        full_name="Sarah Davis",
        role="family",
        phone="+1 (555) 567-8901",
        avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
        passcode_hash=hash_passcode("123456")
    )

    admin = User(
        email="admin@eldercare.health",
        hashed_password=hash_password("AdminPassword123!"),
        full_name="Dr. Robert Sterling",
        role="admin",
        phone="+1 (555) 890-1234",
        avatar_url="https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&h=150&fit=crop&crop=face",
        passcode_hash=hash_passcode("999999")
    )

    db.add_all([margaret, robert, david, sarah, admin])
    db.commit()

    # 2. Care Circles (Links)
    link_caregiver_margaret = CaregiverElderlyLink(
        elderly_id=margaret.id,
        member_id=david.id,
        relationship_type="caregiver",
        relationship_label="Registered Nurse",
        status="active",
        can_view_medications=True,
        can_manage_medications=True,
        can_view_adherence=True,
        can_view_appointments=True,
        can_manage_appointments=True,
        can_view_records=True,
        can_receive_emergency_alerts=True,
        can_receive_missed_dose_alerts=True
    )

    link_family_margaret = CaregiverElderlyLink(
        elderly_id=margaret.id,
        member_id=sarah.id,
        relationship_type="family",
        relationship_label="Daughter",
        status="active",
        can_view_medications=True,
        can_manage_medications=False,
        can_view_adherence=True,
        can_view_appointments=True,
        can_manage_appointments=True,
        can_view_records=True,
        can_receive_emergency_alerts=True,
        can_receive_missed_dose_alerts=True
    )

    link_caregiver_robert = CaregiverElderlyLink(
        elderly_id=robert.id,
        member_id=david.id,
        relationship_type="caregiver",
        relationship_label="Home Care Specialist",
        status="active",
        can_view_medications=True,
        can_manage_medications=True,
        can_view_adherence=True,
        can_view_appointments=True,
        can_manage_appointments=True,
        can_view_records=True,
        can_receive_emergency_alerts=True,
        can_receive_missed_dose_alerts=True
    )

    db.add_all([link_caregiver_margaret, link_family_margaret, link_caregiver_robert])
    db.commit()

    # 3. Health Profiles
    margaret_hp = HealthProfile(
        user_id=margaret.id,
        date_of_birth="1948-04-12",
        gender="Female",
        blood_type="O+",
        height_cm=162.0,
        weight_kg=68.5,
        allergies_json=json.dumps([
            {"allergen": "Penicillin", "severity": "Severe", "reaction": "Skin rash & breathing difficulty"},
            {"allergen": "Sulfa Antibiotics", "severity": "Moderate", "reaction": "Nausea & hives"}
        ]),
        conditions_json=json.dumps([
            {"condition": "Type 2 Diabetes Mellitus", "diagnosed_year": "2012", "notes": "Monitored via morning blood sugar & Metformin"},
            {"condition": "Essential Hypertension", "diagnosed_year": "2015", "notes": "Target BP < 130/80 mmHg"},
            {"condition": "Mild Osteoarthritis (Knees)", "diagnosed_year": "2019", "notes": "Requires low-impact physical routine"}
        ]),
        primary_doctor_name="Dr. Elizabeth Vance, MD",
        primary_doctor_phone="+1 (555) 789-0123",
        primary_doctor_hospital="St. Jude Geriatric Medical Center",
        emergency_contacts_json=json.dumps([
            {"name": "Sarah Davis", "relationship": "Daughter", "phone": "+1 (555) 567-8901", "is_primary": True},
            {"name": "David Miller, RN", "relationship": "Primary Caregiver", "phone": "+1 (555) 456-7890", "is_primary": False},
            {"name": "Mark Davis", "relationship": "Son", "phone": "+1 (555) 678-9012", "is_primary": False}
        ]),
        dnr_status=False,
        preferred_hospital="St. Jude Memorial Hospital, Emergency Wing",
        insurance_provider="Medicare Blue Shield Premier",
        insurance_policy_number="MED-7829-0149-X",
        special_care_notes="Needs reading glasses for fine print. Prefers morning medication after a warm cup of oatmeal."
    )

    robert_hp = HealthProfile(
        user_id=robert.id,
        date_of_birth="1944-09-21",
        gender="Male",
        blood_type="A-",
        height_cm=174.0,
        weight_kg=76.0,
        allergies_json=json.dumps([
            {"allergen": "Aspirin", "severity": "Moderate", "reaction": "Gastric irritation"}
        ]),
        conditions_json=json.dumps([
            {"condition": "Congestive Heart Failure (NYHA II)", "diagnosed_year": "2018", "notes": "Restricted sodium diet"},
            {"condition": "Atrial Fibrillation", "diagnosed_year": "2020", "notes": "On blood thinners"}
        ]),
        primary_doctor_name="Dr. Jonathan Hayes, FACC",
        primary_doctor_phone="+1 (555) 890-2345",
        primary_doctor_hospital="Metropolitan Heart & Vascular Institute",
        emergency_contacts_json=json.dumps([
            {"name": "David Miller, RN", "relationship": "Caregiver", "phone": "+1 (555) 456-7890", "is_primary": True}
        ]),
        preferred_hospital="Metropolitan General Hospital"
    )

    db.add_all([margaret_hp, robert_hp])
    db.commit()

    # 4. Medications for Margaret
    today = date.today()
    start_date_str = (today - timedelta(days=30)).strftime("%Y-%m-%d")

    m1 = Medication(
        user_id=margaret.id,
        name="Metformin",
        generic_name="Metformin Hydrochloride",
        dosage="500 mg",
        form="Tablet",
        frequency="Twice Daily",
        timings_json=json.dumps(["08:00", "20:00"]),
        instructions="Take with or immediately after meals with a glass of water",
        start_date=start_date_str,
        color="teal",
        pill_shape="oval",
        prescribing_doctor="Dr. Elizabeth Vance",
        refill_remaining=3,
        notes="Blood sugar management for Type 2 Diabetes"
    )

    m2 = Medication(
        user_id=margaret.id,
        name="Lisinopril",
        generic_name="Lisinopril",
        dosage="10 mg",
        form="Tablet",
        frequency="Once Daily (Morning)",
        timings_json=json.dumps(["08:00"]),
        instructions="Take in morning with or without food. Avoid potassium supplements.",
        start_date=start_date_str,
        color="blue",
        pill_shape="round",
        prescribing_doctor="Dr. Jonathan Hayes",
        refill_remaining=2,
        notes="Blood pressure control"
    )

    m3 = Medication(
        user_id=margaret.id,
        name="Atorvastatin",
        generic_name="Atorvastatin Calcium",
        dosage="20 mg",
        form="Tablet",
        frequency="Once Daily (Bedtime)",
        timings_json=json.dumps(["21:00"]),
        instructions="Take once daily at evening/bedtime",
        start_date=start_date_str,
        color="indigo",
        pill_shape="round",
        prescribing_doctor="Dr. Jonathan Hayes",
        refill_remaining=4,
        notes="Cholesterol & cardiovascular risk reduction"
    )

    m4 = Medication(
        user_id=margaret.id,
        name="Calcium + Vitamin D3",
        generic_name="Calcium Carbonate & Cholecalciferol",
        dosage="600 mg / 400 IU",
        form="Capsule",
        frequency="Once Daily (Afternoon)",
        timings_json=json.dumps(["13:00"]),
        instructions="Take with lunch for optimal bone absorption",
        start_date=start_date_str,
        color="amber",
        pill_shape="capsule",
        prescribing_doctor="Dr. Elizabeth Vance",
        refill_remaining=5,
        notes="Bone density support for mild osteoarthritis"
    )

    m5 = Medication(
        user_id=robert.id,
        name="Carvedilol",
        dosage="12.5 mg",
        form="Tablet",
        frequency="Twice Daily",
        timings_json=json.dumps(["08:30", "20:30"]),
        instructions="Take with food to minimize hypotension",
        start_date=start_date_str,
        color="rose",
        pill_shape="round"
    )

    db.add_all([m1, m2, m3, m4, m5])
    db.commit()

    # 5. Realistic Historical Dose Logs (Past 14 days)
    for day_offset in range(14, 0, -1):
        log_date = today - timedelta(days=day_offset)
        log_date_str = log_date.strftime("%Y-%m-%d")

        # Metformin Morning (8:00) - 95% taken
        db.add(DoseLog(
            medication_id=m1.id,
            user_id=margaret.id,
            scheduled_date=log_date_str,
            scheduled_time="08:00",
            status="taken",
            taken_at=datetime.combine(log_date, datetime.min.time()) + timedelta(hours=8, minutes=12),
            reminder_sent=True,
            marked_by_user_id=margaret.id
        ))

        # Metformin Evening (20:00) - Day 2 & Day 6 missed for realistic adherence patterns!
        if day_offset in [2, 6]:
            db.add(DoseLog(
                medication_id=m1.id,
                user_id=margaret.id,
                scheduled_date=log_date_str,
                scheduled_time="20:00",
                status="missed",
                reminder_sent=True,
                missed_alert_sent=True
            ))
        else:
            db.add(DoseLog(
                medication_id=m1.id,
                user_id=margaret.id,
                scheduled_date=log_date_str,
                scheduled_time="20:00",
                status="taken",
                taken_at=datetime.combine(log_date, datetime.min.time()) + timedelta(hours=20, minutes=5),
                reminder_sent=True,
                marked_by_user_id=margaret.id
            ))

        # Lisinopril Morning (8:00) - taken
        db.add(DoseLog(
            medication_id=m2.id,
            user_id=margaret.id,
            scheduled_date=log_date_str,
            scheduled_time="08:00",
            status="taken",
            taken_at=datetime.combine(log_date, datetime.min.time()) + timedelta(hours=8, minutes=15),
            reminder_sent=True,
            marked_by_user_id=margaret.id
        ))

        # Calcium Afternoon (13:00) - Day 5 missed
        if day_offset == 5:
            db.add(DoseLog(
                medication_id=m4.id,
                user_id=margaret.id,
                scheduled_date=log_date_str,
                scheduled_time="13:00",
                status="missed",
                reminder_sent=True,
                missed_alert_sent=True
            ))
        else:
            db.add(DoseLog(
                medication_id=m4.id,
                user_id=margaret.id,
                scheduled_date=log_date_str,
                scheduled_time="13:00",
                status="taken",
                taken_at=datetime.combine(log_date, datetime.min.time()) + timedelta(hours=13, minutes=20),
                reminder_sent=True,
                marked_by_user_id=margaret.id
            ))

        # Atorvastatin Night (21:00) - taken
        db.add(DoseLog(
            medication_id=m3.id,
            user_id=margaret.id,
            scheduled_date=log_date_str,
            scheduled_time="21:00",
            status="taken",
            taken_at=datetime.combine(log_date, datetime.min.time()) + timedelta(hours=21, minutes=10),
            reminder_sent=True,
            marked_by_user_id=margaret.id
        ))

    # Today's doses for Margaret:
    today_str = today.strftime("%Y-%m-%d")
    # Morning doses already taken
    db.add(DoseLog(
        medication_id=m1.id,
        user_id=margaret.id,
        scheduled_date=today_str,
        scheduled_time="08:00",
        status="taken",
        taken_at=datetime.now() - timedelta(hours=3),
        reminder_sent=True,
        marked_by_user_id=margaret.id
    ))
    db.add(DoseLog(
        medication_id=m2.id,
        user_id=margaret.id,
        scheduled_date=today_str,
        scheduled_time="08:00",
        status="taken",
        taken_at=datetime.now() - timedelta(hours=3),
        reminder_sent=True,
        marked_by_user_id=margaret.id
    ))
    # Afternoon Calcium - upcoming
    db.add(DoseLog(
        medication_id=m4.id,
        user_id=margaret.id,
        scheduled_date=today_str,
        scheduled_time="13:00",
        status="upcoming",
        reminder_sent=False
    ))
    # Evening Metformin - upcoming
    db.add(DoseLog(
        medication_id=m1.id,
        user_id=margaret.id,
        scheduled_date=today_str,
        scheduled_time="20:00",
        status="upcoming",
        reminder_sent=False
    ))
    # Night Atorvastatin - upcoming
    db.add(DoseLog(
        medication_id=m3.id,
        user_id=margaret.id,
        scheduled_date=today_str,
        scheduled_time="21:00",
        status="upcoming",
        reminder_sent=False
    ))
    db.commit()

    # 6. Appointments
    appt1 = Appointment(
        user_id=margaret.id,
        doctor_name="Dr. Elizabeth Vance",
        specialty="Geriatric Medicine",
        hospital_clinic="St. Jude Geriatric Medical Center",
        location_address="450 Health Sciences Blvd, Suite 300",
        appointment_datetime=datetime.now() + timedelta(days=3, hours=2),
        purpose="Quarterly Diabetic Wellness Review & HbA1c Lab Follow-up",
        status="upcoming",
        transportation_needed=False,
        accompanied_by="Daughter Sarah",
        preparation_instructions="Fasting required for blood draw before visit"
    )

    appt2 = Appointment(
        user_id=margaret.id,
        doctor_name="Dr. Jonathan Hayes",
        specialty="Cardiology",
        hospital_clinic="Metropolitan Heart & Vascular Institute",
        location_address="120 Heart Park Way, Floor 4",
        appointment_datetime=datetime.now() + timedelta(days=12, hours=4),
        purpose="Hypertension Follow-up & 12-Lead ECG Review",
        status="upcoming",
        transportation_needed=True,
        accompanied_by="Caregiver David Miller"
    )

    appt3 = Appointment(
        user_id=margaret.id,
        doctor_name="Dr. Clara Montgomery",
        specialty="Ophthalmology",
        hospital_clinic="Downtown Eye Center",
        location_address="88 Vista Ridge Ave",
        appointment_datetime=datetime.now() - timedelta(days=20),
        purpose="Annual Diabetic Retinopathy & Glaucoma Checkup",
        status="completed",
        doctor_notes="No sign of diabetic retinopathy. Intraocular pressure normal at 15 mmHg. Next exam in 12 months."
    )

    db.add_all([appt1, appt2, appt3])
    db.commit()

    # 7. Medical Records (Pre-create sample files in upload directory)
    upload_dir = "./uploads"
    os.makedirs(upload_dir, exist_ok=True)

    sample_cmp_file = "sample_cmp_lab_report.pdf"
    with open(os.path.join(upload_dir, sample_cmp_file), "w") as f:
        f.write("%PDF-1.4 [Sample Comprehensive Metabolic Panel - Margaret Davis: HbA1c 6.8%, Fasting Glucose 118 mg/dL, eGFR 72 mL/min]")

    sample_ecg_file = "sample_ecg_cardiogram.pdf"
    with open(os.path.join(upload_dir, sample_ecg_file), "w") as f:
        f.write("%PDF-1.4 [Sample 12-Lead Electrocardiogram - Normal sinus rhythm, rate 68 bpm, no ischemic ST changes]")

    r1 = MedicalRecord(
        user_id=margaret.id,
        title="Comprehensive Metabolic Panel (CMP & HbA1c)",
        record_type="Lab Report",
        file_path=sample_cmp_file,
        file_name="CMP_HbA1c_Nov2026.pdf",
        file_size_kb=420,
        mime_type="application/pdf",
        doctor_name="Dr. Elizabeth Vance",
        hospital_clinic="Quest Diagnostics / St. Jude",
        record_date=(today - timedelta(days=14)).strftime("%Y-%m-%d"),
        notes="HbA1c steady at 6.8% (Target < 7.0%). Kidney function eGFR 72 (normal for age)."
    )

    r2 = MedicalRecord(
        user_id=margaret.id,
        title="12-Lead Resting Electrocardiogram (ECG)",
        record_type="Radiology / Scan",
        file_path=sample_ecg_file,
        file_name="Cardiology_ECG_Oct2026.pdf",
        file_size_kb=650,
        mime_type="application/pdf",
        doctor_name="Dr. Jonathan Hayes",
        hospital_clinic="Metropolitan Heart Institute",
        record_date=(today - timedelta(days=28)).strftime("%Y-%m-%d"),
        notes="Normal sinus rhythm. Blood pressure controlled on Lisinopril 10mg."
    )

    db.add_all([r1, r2])
    db.commit()

    # 8. Today's Wellness Log
    tasks = [
        {"id": 1, "task": "Drink morning warm water & take 8:00 AM medications", "done": True},
        {"id": 2, "task": "15-minute gentle garden walk / light stretch", "done": True},
        {"id": 3, "task": "Afternoon hydration & healthy oatmeal snack", "done": False},
        {"id": 4, "task": "Evening check-in call with daughter Sarah", "done": False}
    ]
    w_log = WellnessLog(
        user_id=margaret.id,
        log_date=today_str,
        water_glasses=4,
        water_target=8,
        steps_count=1820,
        steps_target=3000,
        sleep_hours=7.5,
        mood="Great",
        tasks_json=json.dumps(tasks),
        notes="Felt energized after morning walk with sunshine. Knee discomfort is minimal today."
    )
    db.add(w_log)
    db.commit()

    # 9. Initial Notifications
    n1 = Notification(
        user_id=margaret.id,
        title="Welcome to ElderCare!",
        message="Your medication schedule and health profile are securely configured. Your daughter Sarah and Nurse David are connected.",
        type="system",
        severity="info"
    )
    n2 = Notification(
        user_id=margaret.id,
        title="Upcoming Doctor Visit",
        message="Reminder: Dr. Elizabeth Vance appointment in 3 days. Fasting required.",
        type="appointment",
        severity="info"
    )
    n3 = Notification(
        user_id=david.id,
        title="Care Circle Active: Margaret Davis",
        message="You are monitoring Margaret Davis. Daily adherence is currently at 91.4%.",
        type="caregiver_alert",
        severity="info"
    )
    n4 = Notification(
        user_id=sarah.id,
        title="Morning Update: Margaret Davis",
        message="Margaret has confirmed all morning medications and logged 1,820 steps.",
        type="caregiver_alert",
        severity="info"
    )
    db.add_all([n1, n2, n3, n4])
    db.commit()

    # 10. Audit Logs
    a1 = AuditLog(
        user_id=admin.id,
        action="PLATFORM_INITIALIZED",
        category="SECURITY",
        ip_address="127.0.0.1",
        user_agent="System Bootstrap",
        details_json=json.dumps({"status": "All HIPAA security controls engaged"})
    )
    a2 = AuditLog(
        user_id=margaret.id,
        action="LOGIN_SUCCESS",
        category="AUTH",
        ip_address="127.0.0.1",
        user_agent="ElderCare Desktop Client",
        details_json=json.dumps({"method": "Password + Passcode"})
    )
    db.add_all([a1, a2])
    db.commit()

    db.close()
    print("✅ ElderCare database successfully seeded with complete professional dataset!")

if __name__ == "__main__":
    seed_database()
