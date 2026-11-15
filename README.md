# 🌿 ElderCare – Intelligent Elderly Care & Medication Management Platform

> **A professional, secure, and accessible healthcare ecosystem designed to empower seniors, assist dedicated caregivers, reassure family members, and eliminate missed medications.**

---

## 📌 Executive Summary

**ElderCare** is a full-stack healthcare ecosystem built to solve one of the most critical challenges in geriatric care: **medication non-adherence, communication breakdowns between families and caregivers, and emergency isolation.**

Unlike basic reminder apps that rely on static timers or expect frail seniors to navigate complex mobile interfaces, ElderCare introduces:
- **Elderly-First Accessibility**: High-contrast modes, large typography, simple one-touch card interfaces, and a hands-free **Voice Assistant** powered by the Web Speech API.
- **Proactive Background Reminder Engine**: Runs independent of active browser sessions (FastAPI + APScheduler), detecting upcoming doses, unconfirmed confirmations, and issuing multi-channel caregiver alerts.
- **Sovereign Care Circles**: Elderly users retain full sovereign control over their medical data, explicitly granting and revoking fine-grained permissions for family members and caregivers.
- **Caregiver Attention System**: Analyzes confirmation latency and flags care recipients who may need check-ins without making unsupported medical assumptions.
- **Emergency SOS & Paramedic Medical ID**: One-touch broadcast dispatch to the verified care circle, paired with a print-ready, paramedic-standard medical ID card (blood group, allergies, current medications, DNR status).

---

## 🛠️ Technology Stack & Architecture

### Backend
- **Framework**: Python 3.12+ FastAPI (Asynchronous REST API, OpenAPI/Swagger docs)
- **Database**: SQLite (local zero-dependency development) with SQLAlchemy 2.0 ORM; fully compatible with PostgreSQL in production via `DATABASE_URL`
- **Scheduler**: APScheduler running periodic background jobs (dose generation, reminder dispatch, missed dose alerts)
- **Security & Cryptography**: Passlib (Bcrypt hashing for passwords and access passcodes), PyJWT (HS256 tokens)
- **File Storage**: Secure local vault with MIME-type validation, size limits (15MB), and RBAC access checks

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS with custom healthcare palette (Teal, Sky Blue, Emerald, Rose), accessible focus states, and high-contrast WCAG AAA mode
- **Charts & Data Analytics**: Recharts (14-day adherence fidelity trend line charts, time-of-day bar breakdowns)
- **Icons**: Lucide React
- **Voice Synthesis & Recognition**: Web Speech API (`SpeechRecognition` & `SpeechSynthesisUtterance`)
- **Delight & Gamification**: Canvas Confetti for celebrating taken medication doses

---

## 👥 Three Core User Roles (+ Platform Admin)

| Role | Core Capabilities |
| :--- | :--- |
| **👵 Elderly User** | Personalized dashboard, next dose countdown, today's schedule, 1-click "Mark as Taken", voice assistant, emergency SOS, daily wellness routines (water, steps, sleep), sovereign permission delegation. |
| **👨‍⚕️ Caregiver** | Multi-patient monitoring hub, Caregiver Attention System (missed dose flags), schedule appointments, add/edit medications, log check-in notes, view adherence analytics. |
| **👩 Family Member** | Real-time senior health status, today's medication logs, upcoming doctor visits with companion notes, emergency notifications, shared care circle updates. |
| **🛡️ Administrator** | Platform metrics, user role directory, system-wide HIPAA-grade audit trail, security health monitor. |

---

## 🌟 Pre-Seeded Demo Accounts (One-Click Testing)

The database comes pre-seeded with realistic healthcare data (Margaret Davis - 78, diabetic patient; David Miller, RN - Senior Care Nurse; Sarah Davis - Daughter; Dr. Robert Sterling - Chief Medical Admin).

| Persona | Email | Password | 6-Digit PIN | Direct Dashboard |
| :--- | :--- | :--- | :--- | :--- |
| **Senior (Margaret)** | `margaret.davis@eldercare.health` | `Password123!` | `123456` | `/elderly/dashboard` |
| **Caregiver (David)** | `david.miller@eldercare.health` | `Password123!` | `123456` | `/caregiver/dashboard` |
| **Family (Sarah)** | `sarah.davis@eldercare.health` | `Password123!` | `123456` | `/family/dashboard` |
| **Administrator** | `admin@eldercare.health` | `AdminPassword123!` | `999999` | `/admin` |

*(Tip: On the Login page `/login` and Landing page `/`, click any demo button to log in instantly with one click!)*

---

## 📱 Complete 18 Application Pages

1. **Landing Page** (`/`): Mission overview, role-based workflows, interactive 1-click demo switcher, and emergency helpline references.
2. **Registration Page** (`/register`): Role selector, accessible form fields, password security, optional 6-digit PIN, and consent agreement.
3. **Login Page** (`/login`): Standard authentication and instant one-click demo login buttons for all 4 roles.
4. **Secure Passcode Verification** (`/verify-passcode`): Large number keypad tailored for elderly users or quick PIN unlocks.
5. **Elderly User Dashboard** (`/elderly/dashboard`): Warm personalized greeting, next dose countdown, today's medication schedule, prominent Emergency SOS button, and daily wellness tracker (water glasses, steps, sleep, mood).
6. **Caregiver Dashboard** (`/caregiver/dashboard`): Multi-patient KPIs, Caregiver Attention Alert list (missed doses, low adherence flags), patient switcher cards, and recent adherence activity feed.
7. **Family Member Dashboard** (`/family/dashboard`): Loved one's status, today's medication logs, upcoming doctor appointments, and invitation code linking modal.
8. **Medication Management** (`/medications`): Today's dose tracker (Taken, Upcoming, Missed), add/edit medications with dosage, frequency, specific 24h timings, meal instructions, and pill color.
9. **Medication Adherence Reports** (`/adherence`): 14-day adherence line chart, time-of-day bar chart (Morning vs Afternoon vs Evening vs Night), frequently missed pills analysis, and printable doctor summary.
10. **Appointment Management** (`/appointments`): Upcoming doctor consultations, hospital details, purpose, preparation instructions (e.g. fasting), transportation needs, and cancellation workflow.
11. **Medical Records Vault** (`/records`): Drag-and-drop secure file upload (PDF/Images, max 15MB), document category filtering, in-browser preview, and authorized downloads.
12. **Health Profile** (`/profile`): Blood type, known allergies with severity tags, chronic conditions, primary physician, hospital preferences, and emergency contact list.
13. **Emergency Assistance (SOS)** (`/emergency`): 5-second countdown alert broadcast, direct calling for 911 / Poison Control, and paramedic-ready Emergency Medical ID card.
14. **Notifications Center** (`/notifications`): Centralized alert feed, severity filters (Critical, Warning, Info), mark as read, and live "Test Reminder Engine" button.
15. **Family Collaboration & Care Circle** (`/collaboration`): Active circle members, invite modal with unique code & passcode, and fine-grained permission toggles.
16. **User Settings** (`/settings`): Reminder lead time (10m, 15m, 30m, 1h), email/push/sound toggles, accessibility toggles, and inactivity timeout selector.
17. **Privacy & Security Settings** (`/security`): PIN setup, GDPR/HIPAA patient data export (full JSON package), account deactivation, and immutable security audit logs.
18. **Admin Dashboard** (`/admin`): System metrics, user directory with role badges, and platform-wide security audit stream.

---

## 🚀 Step-by-Step Setup & Running Instructions

### Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (v3.10+)

### 1. Start the Backend API Server
```powershell
# Navigate to the backend directory
cd backend

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
# source venv/bin/activate

# Seed initial database (Margaret, David, Sarah, Admin data)
python -m app.seed

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The interactive Swagger API documentation will be accessible at: `http://127.0.0.1:8000/docs`*

### 2. Start the Frontend Development Server
```powershell
# In a new terminal, navigate to the frontend directory
cd frontend

# Install packages (already installed)
npm install

# Start Vite development server
npm run dev
```
*The web application will open at: `http://localhost:5173`*

---

## 🔒 Security & Privacy Highlights
- **Server-Side Authorization**: Every sensitive route validates token authenticity, active user status, and specific permission flags (`can_view_medications`, `can_manage_appointments`, etc.).
- **Passcode Hashing**: PINs and invitation passcodes are hashed using Bcrypt; never stored in plaintext.
- **Inactivity Timeout**: Configurable auto-logout listener clears cached sessions upon inactivity.
- **Tamper-Evident Audit Logging**: Tracks every login attempt, medical file access, emergency broadcast, and permission mutation with IP and timestamp.
- **Data Portability**: Full JSON export capability meeting GDPR Article 20 & HIPAA privacy regulations.

---

*ElderCare Platform — Designed with empathy, built with rigor.*
