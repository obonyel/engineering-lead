"""System Layer — CDM-Lite Simulated South African Banking Rail Adapters."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class PayShapDispatchResult:
    network_reference: str
    rail: str
    settled_at: datetime
    status: str = "SETTLED"


class PayShapSimAdapter:
    """Simulates instant interbank PayShap proxy settlement (<10s, R0 fee)."""

    def dispatch_transfer(
        self,
        *,
        shap_id: str | None,
        amount_cents: int,
        reference: str,
        rail: str = "PAYSHAP",
    ) -> PayShapDispatchResult:
        short_id = uuid.uuid4().hex[:10].upper()
        return PayShapDispatchResult(
            network_reference=f"SHAP-ZA-{short_id}",
            rail=rail,
            settled_at=datetime.now(timezone.utc),
        )
