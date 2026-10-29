from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    demo_mode: bool = os.getenv("DEMO_MODE", "true").lower() == "true"
    port: int = int(os.getenv("PORT", "8000"))
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    # Current SDK standard model (gemini-2.5-* is deprecated)
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    tavily_api_key: str = os.getenv("TAVILY_API_KEY", "")
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    max_daily_turns_per_user: int = int(os.getenv("MAX_DAILY_TURNS_PER_USER", "50"))
    fica_id_hash_pepper: str = os.getenv(
        "FICA_ID_HASH_PEPPER", "sahara-mzansi-dev-pepper-override-in-prod"
    )


def get_settings() -> Settings:
    return Settings()
