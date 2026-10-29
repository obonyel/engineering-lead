"""Process & Experience Layer HTTP Endpoints (`/v1/*` and `/copilotkit/turn`)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Header, Request
from fastapi.responses import JSONResponse

from app.agents.sahara_flow import SaharaAgentCoordinator
from app.config import get_settings
from app.models.domain import (
    ConfirmApprovalRequest,
    CopilotTurnRequest,
    CopilotTurnResponse,
    FicaVerifyRequest,
    FicaVerifyResponse,
    PortfolioSummaryResponse,
    ProblemDetails,
    SettlementReceiptResponse,
    StageApprovalRequest,
    StagedApprovalResponse,
    VirtualCardSummary,
    WealthSimulationRequest,
    WealthSimulationResponse,
)
from app.process.fica import FicaValidationError, validate_fica_submission
from app.process.guardrails import simulate_compound_vs_inflation
from app.process.ledger_service import BankingRuleError, LedgerService
from app.system.repository import get_repository

router = APIRouter()


def problem_response(
    *,
    status: int,
    title: str,
    detail: str,
    instance: str,
    correlation_id: str,
    problem_type: str = "about:blank",
) -> JSONResponse:
    body = ProblemDetails(
        type=problem_type,
        title=title,
        status=status,
        detail=detail,
        instance=instance,
        correlation_id=correlation_id,
    )
    return JSONResponse(
        status_code=status,
        content=body.model_dump(),
        media_type="application/problem+json",
    )


def resolve_correlation_id(header_val: str | None) -> str:
    return header_val.strip() if header_val else f"corr_{uuid.uuid4().hex[:12]}"


def resolve_user_id(header_val: str | None) -> str:
    return header_val.strip() if header_val else "demo-user-elena"


@router.post("/v1/onboarding/fica/verify", response_model=FicaVerifyResponse)
def verify_fica(
    payload: FicaVerifyRequest,
    request: Request,
    x_correlation_id: str | None = Header(default=None),
):
    corr_id = resolve_correlation_id(x_correlation_id)
    settings = get_settings()
    try:
        return validate_fica_submission(payload, pepper=settings.fica_id_hash_pepper)
    except FicaValidationError as exc:
        return problem_response(
            status=422,
            title="FICA Verification Failed",
            detail=str(exc),
            instance=str(request.url.path),
            correlation_id=corr_id,
            problem_type="https://saharamzansi.co.za/problems/fica-validation-failed",
        )


@router.get("/v1/portfolio", response_model=PortfolioSummaryResponse)
def get_portfolio(x_sahara_user_id: str | None = Header(default=None)):
    repo = get_repository()
    return repo.get_portfolio(resolve_user_id(x_sahara_user_id))


@router.get("/v1/beneficiaries/resolve")
def resolve_beneficiary(
    q: str,
    request: Request,
    x_correlation_id: str | None = Header(default=None),
):
    corr_id = resolve_correlation_id(x_correlation_id)
    repo = get_repository()
    ben = repo.resolve_beneficiary(q)
    if not ben:
        return problem_response(
            status=404,
            title="Beneficiary Not Found",
            detail=f"No verified beneficiary matched '{q}'.",
            instance=str(request.url.path),
            correlation_id=corr_id,
        )
    return ben


@router.post("/v1/cards/{card_id}/freeze", response_model=VirtualCardSummary)
def toggle_card_freeze(
    card_id: str,
    frozen: bool,
    request: Request,
    x_correlation_id: str | None = Header(default=None),
):
    corr_id = resolve_correlation_id(x_correlation_id)
    repo = get_repository()
    try:
        return repo.set_card_frozen(card_id, frozen=frozen, correlation_id=corr_id)
    except KeyError as exc:
        return problem_response(
            status=404,
            title="Virtual Card Not Found",
            detail=str(exc),
            instance=str(request.url.path),
            correlation_id=corr_id,
        )


@router.post("/v1/approvals/stage", response_model=StagedApprovalResponse, status_code=201)
def stage_approval(
    payload: StageApprovalRequest,
    request: Request,
    x_sahara_user_id: str | None = Header(default=None),
    x_correlation_id: str | None = Header(default=None),
):
    corr_id = resolve_correlation_id(x_correlation_id)
    service = LedgerService(get_repository())
    try:
        return service.stage_transfer(
            user_id=resolve_user_id(x_sahara_user_id),
            req=payload,
            correlation_id=corr_id,
        )
    except BankingRuleError as exc:
        return problem_response(
            status=exc.status_code,
            title=exc.title,
            detail=exc.detail,
            instance=str(request.url.path),
            correlation_id=corr_id,
        )


@router.post(
    "/v1/approvals/{approval_id}/confirm",
    response_model=SettlementReceiptResponse,
)
def confirm_approval(
    approval_id: str,
    payload: ConfirmApprovalRequest,
    request: Request,
    x_idempotency_key: str = Header(default=""),
    x_sahara_user_id: str | None = Header(default=None),
    x_correlation_id: str | None = Header(default=None),
):
    corr_id = resolve_correlation_id(x_correlation_id)
    service = LedgerService(get_repository())
    try:
        return service.confirm_approval(
            user_id=resolve_user_id(x_sahara_user_id),
            approval_id=approval_id,
            idempotency_key=x_idempotency_key,
            req=payload,
            correlation_id=corr_id,
        )
    except BankingRuleError as exc:
        return problem_response(
            status=exc.status_code,
            title=exc.title,
            detail=exc.detail,
            instance=str(request.url.path),
            correlation_id=corr_id,
        )


@router.post("/v1/literacy/simulate", response_model=WealthSimulationResponse)
def simulate_wealth_literacy(payload: WealthSimulationRequest):
    return simulate_compound_vs_inflation(payload)


@router.post("/copilotkit/turn", response_model=CopilotTurnResponse)
def run_copilot_turn(
    payload: CopilotTurnRequest,
    x_sahara_user_id: str | None = Header(default=None),
    x_correlation_id: str | None = Header(default=None),
):
    corr_id = resolve_correlation_id(x_correlation_id)
    settings = get_settings()
    coordinator = SaharaAgentCoordinator(
        ledger_service=LedgerService(get_repository()),
        settings=settings,
    )
    return coordinator.handle_turn(
        user_id=resolve_user_id(x_sahara_user_id),
        message=payload.message,
        correlation_id=corr_id,
    )
