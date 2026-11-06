"""
CareerForge AI — FastAPI Backend
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api import profile, career, skill_gap, roadmap, interview, reports, dashboard

logging.basicConfig(level=logging.INFO)
settings = get_settings()

app = FastAPI(
    title="CareerForge AI API",
    description="Personalized Career Intelligence Platform — Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(profile.router, prefix="/api")
app.include_router(career.router, prefix="/api")
app.include_router(skill_gap.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "CareerForge AI API", "version": "1.0.0"}


@app.get("/", tags=["Root"])
async def root():
    return {"message": "CareerForge AI API — visit /docs for interactive documentation"}
