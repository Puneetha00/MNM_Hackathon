import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List
import logging
from app.config import settings

logger = logging.getLogger("eldercare.email")

def send_healthcare_email(
    to_email: str,
    subject: str,
    html_content: str,
    plain_text: Optional[str] = None
) -> bool:
    """
    Sends email via SMTP if configured; otherwise logs a beautifully structured
    healthcare notification dispatch for review and testing.
    """
    if not plain_text:
        plain_text = subject

    if settings.SMTP_ENABLED and settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"[ElderCare] {subject}"
            msg["From"] = settings.EMAIL_FROM
            msg["To"] = to_email

            part1 = MIMEText(plain_text, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
            logger.info(f"Email sent successfully to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    else:
        # Structured log simulation
        print("\n" + "="*70)
        print(f"📧 [ELDERCARE NOTIFICATION DISPATCH - TO: {to_email}]")
        print(f"📌 SUBJECT: {subject}")
        print(f"💬 PREVIEW: {plain_text}")
        print("="*70 + "\n")
        return True

def generate_medication_reminder_email(user_name: str, med_name: str, dosage: str, time_str: str, instructions: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #0d9488; border-radius: 12px; background: #f0fdfa;">
        <h2 style="color: #0f766e; margin-top: 0;">🌿 ElderCare Medication Reminder</h2>
        <p>Dear {user_name},</p>
        <p>It's time for your scheduled medication:</p>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #14b8a6; margin: 15px 0;">
            <h3 style="margin: 0; color: #115e59;">{med_name} ({dosage})</h3>
            <p style="margin: 5px 0 0 0; color: #475569;"><strong>Scheduled Time:</strong> {time_str}</p>
            <p style="margin: 5px 0 0 0; color: #475569;"><strong>Instructions:</strong> {instructions}</p>
        </div>
        <p>Please log in to your dashboard to mark this medication as taken.</p>
        <p style="color: #64748b; font-size: 13px;">ElderCare Platform • Prioritizing Health & Wellbeing</p>
    </div>
    """

def generate_missed_dose_alert_email(caregiver_name: str, senior_name: str, med_name: str, dosage: str, scheduled_time: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ef4444; border-radius: 12px; background: #fef2f2;">
        <h2 style="color: #dc2626; margin-top: 0;">⚠️ ElderCare Alert: Missed Medication</h2>
        <p>Hello {caregiver_name},</p>
        <p>This is an automated safety alert regarding your care-recipient <strong>{senior_name}</strong>.</p>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 15px 0;">
            <h3 style="margin: 0; color: #991b1b;">{med_name} ({dosage})</h3>
            <p style="margin: 5px 0 0 0; color: #475569;"><strong>Scheduled Time:</strong> {scheduled_time}</p>
            <p style="margin: 5px 0 0 0; color: #ef4444;"><strong>Status:</strong> Not confirmed taken after grace period</p>
        </div>
        <p>We recommend giving {senior_name} a friendly check-in call to ensure their safety and medication adherence.</p>
        <p style="color: #64748b; font-size: 13px;">ElderCare Platform • Collaborative Care Circle</p>
    </div>
    """

def generate_emergency_alert_email(recipient_name: str, senior_name: str, emergency_phone: str, medical_summary: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 2px solid #b91c1c; border-radius: 12px; background: #fff1f2;">
        <h1 style="color: #b91c1c; margin-top: 0;">🚨 URGENT: EMERGENCY ASSISTANCE REQUESTED</h1>
        <p>Dear {recipient_name},</p>
        <p style="font-size: 16px;"><strong>{senior_name}</strong> has activated their <strong>Emergency Assistance SOS</strong> on ElderCare.</p>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 5px solid #dc2626; margin: 15px 0;">
            <p style="margin: 0; font-size: 16px;"><strong>Direct Phone:</strong> <a href="tel:{emergency_phone}">{emergency_phone}</a></p>
            <p style="margin: 10px 0 0 0; color: #334155;"><strong>Medical Summary:</strong> {medical_summary}</p>
        </div>
        <p style="color: #dc2626; font-weight: bold;">Please contact {senior_name} immediately or verify their status.</p>
        <p style="color: #64748b; font-size: 13px;">ElderCare Platform Emergency Broadcast System</p>
    </div>
    """
