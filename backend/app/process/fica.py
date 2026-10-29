"""Process Layer — South African 13-Digit ID FICA Validator & POPIA Hashing."""

from __future__ import annotations

import hashlib
from datetime import date

from app.models.domain import FicaVerifyRequest, FicaVerifyResponse


class FicaValidationError(ValueError):
    """Raised when a FICA submission fails POPIA or SA ID checksum rules."""


def verify_luhn_13(sa_id: str) -> bool:
    """Validate a 13-digit South African ID number using modulo-10 Luhn."""
    if len(sa_id) != 13 or not sa_id.isdigit():
        return False
    digits = [int(ch) for ch in sa_id]
    total = 0
    for idx, digit in enumerate(reversed(digits)):
        if idx % 2 == 1:
            doubled = digit * 2
            total += doubled - 9 if doubled > 9 else doubled
        else:
            total += digit
    return total % 10 == 0


def decode_birth_date(sa_id: str) -> date:
    """Decode YYMMDD from the first 6 digits of an SA ID number."""
    yy = int(sa_id[0:2])
    mm = int(sa_id[2:4])
    dd = int(sa_id[4:6])
    current_two_digit_year = date.today().year % 100
    century = 1900 if yy > current_two_digit_year else 2000
    try:
        return date(century + yy, mm, dd)
    except ValueError as exc:
        raise FicaValidationError("Invalid birth date encoded in SA ID number.") from exc


def validate_fica_submission(req: FicaVerifyRequest, pepper: str) -> FicaVerifyResponse:
    """Validate POPIA consent, SA 13-digit ID checksum, citizenship digit, and age >= 18."""
    if not req.popia_consented:
        raise FicaValidationError(
            "Explicit POPIA consent is required before FICA identity verification."
        )

    sa_id = req.sa_id_number.strip()
    if not verify_luhn_13(sa_id):
        raise FicaValidationError(
            "Invalid 13-digit South African ID number (failed modulo-10 checksum)."
        )

    birth_date = decode_birth_date(sa_id)
    today = date.today()
    age_years = (
        today.year
        - birth_date.year
        - ((today.month, today.day) < (birth_date.month, birth_date.day))
    )
    if age_years < 18:
        raise FicaValidationError("Account holder must be at least 18 years old.")

    citizenship_digit = sa_id[10]
    if citizenship_digit == "0":
        citizenship = "SA_CITIZEN"
    elif citizenship_digit == "1":
        citizenship = "PERMANENT_RESIDENT"
    else:
        raise FicaValidationError("Citizenship digit (position 11) must be 0 or 1.")

    salted_hash = hashlib.sha256(f"{pepper}:{sa_id}".encode()).hexdigest()

    return FicaVerifyResponse(
        verified=True,
        fica_status="VERIFIED",
        birth_date=birth_date,
        citizenship=citizenship,
        id_salted_hash=salted_hash,
        educational_notice=(
            "Simulated FICA KYC complete. Your raw 13-digit ID is hashed under POPIA "
            "data-minimization rules and never logged in plaintext."
        ),
    )
