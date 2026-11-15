import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.seed import seed_database
from app.services.reminder_scheduler import start_scheduler, shutdown_scheduler

# Import Routers
from app.routers import (
    auth,
    users,
    medications,
    adherence,
    appointments,
    records,
    caregiver,
    family,
    emergency,
    notifications,
    security,
    admin,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables, seed demo data, start background scheduler
    Base.metadata.create_all(bind=engine)
    seed_database()
    start_scheduler()
    yield
    # Shutdown
    shutdown_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ElderCare – Intelligent Elderly Care & Medication Management Platform API",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for document uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(medications.router, prefix=settings.API_V1_STR)
app.include_router(adherence.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(records.router, prefix=settings.API_V1_STR)
app.include_router(caregiver.router, prefix=settings.API_V1_STR)
app.include_router(family.router, prefix=settings.API_V1_STR)
app.include_router(emergency.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(security.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ElderCare Platform Backend API",
        "version": settings.VERSION,
        "scheduler": "active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
