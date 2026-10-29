"""Sahara Mzansi — FastAPI Process & Agentic Backend Entrypoint."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as v1_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Sahara Mzansi Banking & Agentic API",
    version="0.2.0",
    description=(
        "Deterministic Process-layer ledger, FICA verification, Two-Phase Biometric "
        "HITL gate, and Experience-layer specialist agents (Jabu, Kagiso, Thabo)."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "service": "sahara-mzansi-backend",
        "status": "ok",
        "demo_mode": settings.demo_mode,
        "gemini_model": settings.gemini_model,
    }
