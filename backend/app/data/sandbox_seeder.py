import os
import logging
from decimal import Decimal
from datetime import datetime
from typing import Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import Engine

from app.database.connection import SessionLocal
from app.repository.models import (
    CustomerModel,
    PaymentModel,
    RecoveryCaseModel,
    RecoveryAttemptModel,
    RecoveryJobModel,
    AuditEventModel,
)

logger = logging.getLogger("recoverflow.sandbox_seeder")

# Environment Variable Name
SEED_SANDBOX_ENV = "RECOVERFLOW_SEED_SANDBOX"

# Curated Sandbox Dataset Definitions (Matching Approved Baseline Specifications)
CURATED_CUSTOMERS = [
    {
        "id": "cust_usr_8912",
        "external_customer_id": "SANDBOX_SEED",
        "segment": "PREMIUM",
        "total_payments": 12,
        "successful_payments": 11,
        "failed_payments": 1,
        "total_spent": Decimal("148500.00"),
        "average_payment_delay": 1.2,
        "recovery_success_rate": 100.0,
        "created_at": datetime(2026, 8, 20, 10, 0, 0),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "cust_usr_4402",
        "external_customer_id": "SANDBOX_SEED",
        "segment": "HIGH_VALUE",
        "total_payments": 8,
        "successful_payments": 7,
        "failed_payments": 1,
        "total_spent": Decimal("34320.00"),
        "average_payment_delay": 0.8,
        "recovery_success_rate": 87.5,
        "created_at": datetime(2026, 8, 21, 11, 0, 0),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "cust_usr_9931",
        "external_customer_id": "SANDBOX_SEED",
        "segment": "REGULAR",
        "total_payments": 5,
        "successful_payments": 4,
        "failed_payments": 1,
        "total_spent": Decimal("113600.00"),
        "average_payment_delay": 3.4,
        "recovery_success_rate": 80.0,
        "created_at": datetime(2026, 8, 22, 9, 30, 0),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "cust_usr_1204",
        "external_customer_id": "SANDBOX_SEED",
        "segment": "REGULAR",
        "total_payments": 14,
        "successful_payments": 13,
        "failed_payments": 1,
        "total_spent": Decimal("25480.00"),
        "average_payment_delay": 0.5,
        "recovery_success_rate": 100.0,
        "created_at": datetime(2026, 8, 22, 12, 0, 0),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "cust_usr_7721",
        "external_customer_id": "SANDBOX_SEED",
        "segment": "HIGH_VALUE",
        "total_payments": 9,
        "successful_payments": 8,
        "failed_payments": 1,
        "total_spent": Decimal("85050.00"),
        "average_payment_delay": 1.1,
        "recovery_success_rate": 90.0,
        "created_at": datetime(2026, 8, 23, 14, 15, 0),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "cust_usr_3189",
        "external_customer_id": "SANDBOX_SEED",
        "segment": "REGULAR",
        "total_payments": 6,
        "successful_payments": 5,
        "failed_payments": 1,
        "total_spent": Decimal("37080.00"),
        "average_payment_delay": 2.8,
        "recovery_success_rate": 75.0,
        "created_at": datetime(2026, 8, 23, 15, 0, 0),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "cust_demo_1g",
        "external_customer_id": "SANDBOX_SEED",
        "segment": "REGULAR",
        "total_payments": 3,
        "successful_payments": 2,
        "failed_payments": 1,
        "total_spent": Decimal("14997.00"),
        "average_payment_delay": 0.9,
        "recovery_success_rate": 100.0,
        "created_at": datetime(2026, 8, 22, 14, 0, 0),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "cust_demo_1h",
        "external_customer_id": "SANDBOX_SEED",
        "segment": "REGULAR",
        "total_payments": 4,
        "successful_payments": 3,
        "failed_payments": 1,
        "total_spent": Decimal("19996.00"),
        "average_payment_delay": 1.0,
        "recovery_success_rate": 100.0,
        "created_at": datetime(2026, 8, 22, 14, 10, 0),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "cust_sec_verify_001",
        "external_customer_id": "SANDBOX_SEED",
        "segment": "PREMIUM",
        "total_payments": 10,
        "successful_payments": 9,
        "failed_payments": 1,
        "total_spent": Decimal("25000.00"),
        "average_payment_delay": 0.4,
        "recovery_success_rate": 100.0,
        "created_at": datetime(2026, 8, 22, 18, 0, 0),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "cust_replay_001",
        "external_customer_id": "SANDBOX_SEED",
        "segment": "REGULAR",
        "total_payments": 2,
        "successful_payments": 1,
        "failed_payments": 1,
        "total_spent": Decimal("3000.00"),
        "average_payment_delay": 0.2,
        "recovery_success_rate": 100.0,
        "created_at": datetime(2026, 8, 22, 14, 30, 0),
        "data_source": "SANDBOX_SEED",
    },
]

CURATED_PAYMENTS = [
    {
        "id": "pay_9xM8k21Lm",
        "customer_id": "cust_usr_8912",
        "amount": Decimal("14850.00"),
        "currency": "USD",
        "status": "FAILED",
        "failure_code": "BANK_TIMEOUT",
        "provider_payment_id": "sandbox_seed",
        "created_at": datetime(2026, 8, 25, 14, 8, 37),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "pay_7vP31q82B",
        "customer_id": "cust_usr_4402",
        "amount": Decimal("4290.00"),
        "currency": "USD",
        "status": "FAILED",
        "failure_code": "NETWORK_FAILURE",
        "provider_payment_id": "sandbox_seed",
        "created_at": datetime(2026, 8, 25, 14, 4, 12),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "pay_4nL52k91Z",
        "customer_id": "cust_usr_9931",
        "amount": Decimal("28400.00"),
        "currency": "USD",
        "status": "FAILED",
        "failure_code": "AUTHENTICATION_FAILURE",
        "provider_payment_id": "sandbox_seed",
        "created_at": datetime(2026, 8, 25, 13, 58, 20),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "pay_1mQ84v29C",
        "customer_id": "cust_usr_1204",
        "amount": Decimal("1820.00"),
        "currency": "USD",
        "status": "FAILED",
        "failure_code": "BANK_TIMEOUT",
        "provider_payment_id": "sandbox_seed",
        "created_at": datetime(2026, 8, 25, 13, 41, 0),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "pay_8kR29p41D",
        "customer_id": "cust_usr_7721",
        "amount": Decimal("9450.00"),
        "currency": "USD",
        "status": "FAILED",
        "failure_code": "GATEWAY_DOWN",
        "provider_payment_id": "sandbox_seed",
        "created_at": datetime(2026, 8, 25, 13, 35, 10),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "pay_3xZ18m72A",
        "customer_id": "cust_usr_3189",
        "amount": Decimal("6180.00"),
        "currency": "USD",
        "status": "FAILED",
        "failure_code": "CARD_DECLINED",
        "provider_payment_id": "sandbox_seed",
        "created_at": datetime(2026, 8, 25, 13, 20, 0),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "pay_demo_1g",
        "customer_id": "cust_demo_1g",
        "amount": Decimal("4999.00"),
        "currency": "INR",
        "status": "FAILED",
        "failure_code": "BANK_TIMEOUT",
        "provider_payment_id": "sandbox_seed",
        "created_at": datetime(2026, 8, 22, 14, 8, 37),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "pay_demo_1h",
        "customer_id": "cust_demo_1h",
        "amount": Decimal("4999.00"),
        "currency": "INR",
        "status": "FAILED",
        "failure_code": "BANK_TIMEOUT",
        "provider_payment_id": "sandbox_seed",
        "created_at": datetime(2026, 8, 22, 14, 20, 19),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "pay_sec_verify_001",
        "customer_id": "cust_sec_verify_001",
        "amount": Decimal("2500.00"),
        "currency": "INR",
        "status": "FAILED",
        "failure_code": "BANK_TIMEOUT",
        "provider_payment_id": "sandbox_seed",
        "created_at": datetime(2026, 8, 22, 19, 0, 0),
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "pay_replay_001",
        "customer_id": "cust_replay_001",
        "amount": Decimal("1500.00"),
        "currency": "INR",
        "status": "FAILED",
        "failure_code": "BANK_TIMEOUT",
        "provider_payment_id": "sandbox_seed",
        "created_at": datetime(2026, 8, 22, 14, 38, 21),
        "data_source": "SANDBOX_SEED",
    },
]

CURATED_CASES = [
    {
        "id": "CASE-2026-9812",
        "payment_id": "pay_9xM8k21Lm",
        "customer_id": "cust_usr_8912",
        "state": "RECOVERED",
        "priority": "HIGH",
        "attempt_count": 2,
        "max_allowed_attempts": 3,
        "created_at": datetime(2026, 8, 25, 14, 8, 37),
        "updated_at": datetime(2026, 8, 25, 14, 12, 19),
        "terminal_reason": None,
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "CASE-2026-9811",
        "payment_id": "pay_7vP31q82B",
        "customer_id": "cust_usr_4402",
        "state": "ACTIVE",
        "priority": "MEDIUM",
        "attempt_count": 1,
        "max_allowed_attempts": 3,
        "created_at": datetime(2026, 8, 25, 14, 4, 12),
        "updated_at": datetime(2026, 8, 25, 14, 5, 0),
        "terminal_reason": None,
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "CASE-2026-9810",
        "payment_id": "pay_4nL52k91Z",
        "customer_id": "cust_usr_9931",
        "state": "ESCALATED",
        "priority": "CRITICAL",
        "attempt_count": 3,
        "max_allowed_attempts": 3,
        "created_at": datetime(2026, 8, 25, 13, 58, 20),
        "updated_at": datetime(2026, 8, 25, 14, 9, 44),
        "terminal_reason": "Authentication step-up ceiling reached.",
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "CASE-2026-9809",
        "payment_id": "pay_1mQ84v29C",
        "customer_id": "cust_usr_1204",
        "state": "RECOVERED",
        "priority": "LOW",
        "attempt_count": 1,
        "max_allowed_attempts": 3,
        "created_at": datetime(2026, 8, 25, 13, 41, 0),
        "updated_at": datetime(2026, 8, 25, 13, 43, 12),
        "terminal_reason": None,
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "CASE-2026-9808",
        "payment_id": "pay_8kR29p41D",
        "customer_id": "cust_usr_7721",
        "state": "DETECTED",
        "priority": "HIGH",
        "attempt_count": 0,
        "max_allowed_attempts": 3,
        "created_at": datetime(2026, 8, 25, 13, 35, 10),
        "updated_at": datetime(2026, 8, 25, 13, 35, 10),
        "terminal_reason": None,
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "CASE-2026-9807",
        "payment_id": "pay_3xZ18m72A",
        "customer_id": "cust_usr_3189",
        "state": "FAILED",
        "priority": "HIGH",
        "attempt_count": 3,
        "max_allowed_attempts": 3,
        "created_at": datetime(2026, 8, 25, 13, 20, 0),
        "updated_at": datetime(2026, 8, 25, 13, 32, 45),
        "terminal_reason": "Permanent decline code returned by issuing bank.",
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "case_pay_demo_1g",
        "payment_id": "pay_demo_1g",
        "customer_id": "cust_demo_1g",
        "state": "RECOVERED",
        "priority": "MEDIUM",
        "attempt_count": 1,
        "max_allowed_attempts": 3,
        "created_at": datetime(2026, 8, 22, 14, 8, 37),
        "updated_at": datetime(2026, 8, 22, 14, 10, 0),
        "terminal_reason": None,
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "case_pay_demo_1h",
        "payment_id": "pay_demo_1h",
        "customer_id": "cust_demo_1h",
        "state": "RECOVERED",
        "priority": "MEDIUM",
        "attempt_count": 1,
        "max_allowed_attempts": 3,
        "created_at": datetime(2026, 8, 22, 14, 20, 19),
        "updated_at": datetime(2026, 8, 22, 14, 22, 0),
        "terminal_reason": None,
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "case_pay_sec_verify_001",
        "payment_id": "pay_sec_verify_001",
        "customer_id": "cust_sec_verify_001",
        "state": "RECOVERED",
        "priority": "MEDIUM",
        "attempt_count": 1,
        "max_allowed_attempts": 3,
        "created_at": datetime(2026, 8, 22, 19, 0, 0),
        "updated_at": datetime(2026, 8, 22, 19, 1, 30),
        "terminal_reason": None,
        "data_source": "SANDBOX_SEED",
    },
    {
        "id": "case_pay_replay_001",
        "payment_id": "pay_replay_001",
        "customer_id": "cust_replay_001",
        "state": "RECOVERED",
        "priority": "MEDIUM",
        "attempt_count": 1,
        "max_allowed_attempts": 3,
        "created_at": datetime(2026, 8, 22, 14, 38, 21),
        "updated_at": datetime(2026, 8, 22, 14, 40, 15),
        "terminal_reason": None,
        "data_source": "SANDBOX_SEED",
    },
]

CURATED_ATTEMPTS = [
    {
        "id": "att_9812_01",
        "case_id": "CASE-2026-9812",
        "action_type": "PAYMENT_RETRY",
        "attempt_number": 1,
        "execution_id": "exec_9812_01",
        "idempotency_key": "ik_9812_01",
        "status": "FAILED",
        "outcome_status": "RETRY_SCHEDULED",
        "amount_recovered": Decimal("0.00"),
        "created_at": datetime(2026, 8, 25, 14, 8, 40),
    },
    {
        "id": "att_9812_02",
        "case_id": "CASE-2026-9812",
        "action_type": "PAYMENT_RETRY",
        "attempt_number": 2,
        "execution_id": "exec_9812_02",
        "idempotency_key": "ik_9812_02",
        "status": "SUCCEEDED",
        "outcome_status": "RECOVERED",
        "amount_recovered": Decimal("14850.00"),
        "created_at": datetime(2026, 8, 25, 14, 12, 19),
    },
    {
        "id": "att_9811_01",
        "case_id": "CASE-2026-9811",
        "action_type": "PAYMENT_RETRY",
        "attempt_number": 1,
        "execution_id": "exec_9811_01",
        "idempotency_key": "ik_9811_01",
        "status": "PENDING",
        "outcome_status": "IN_FLIGHT",
        "amount_recovered": Decimal("0.00"),
        "created_at": datetime(2026, 8, 25, 14, 4, 15),
    },
    {
        "id": "att_9810_01",
        "case_id": "CASE-2026-9810",
        "action_type": "PAYMENT_RETRY",
        "attempt_number": 3,
        "execution_id": "exec_9810_03",
        "idempotency_key": "ik_9810_03",
        "status": "FAILED",
        "outcome_status": "ESCALATED",
        "amount_recovered": Decimal("0.00"),
        "created_at": datetime(2026, 8, 25, 14, 9, 44),
    },
    {
        "id": "att_9809_01",
        "case_id": "CASE-2026-9809",
        "action_type": "PAYMENT_RETRY",
        "attempt_number": 1,
        "execution_id": "exec_9809_01",
        "idempotency_key": "ik_9809_01",
        "status": "SUCCEEDED",
        "outcome_status": "RECOVERED",
        "amount_recovered": Decimal("1820.00"),
        "created_at": datetime(2026, 8, 25, 13, 43, 12),
    },
    {
        "id": "att_9807_01",
        "case_id": "CASE-2026-9807",
        "action_type": "PAYMENT_RETRY",
        "attempt_number": 3,
        "execution_id": "exec_9807_03",
        "idempotency_key": "ik_9807_03",
        "status": "FAILED",
        "outcome_status": "TERMINAL_FAILURE",
        "amount_recovered": Decimal("0.00"),
        "created_at": datetime(2026, 8, 25, 13, 32, 45),
    },
    {
        "id": "att_demo_1g_01",
        "case_id": "case_pay_demo_1g",
        "action_type": "PAYMENT_RETRY",
        "attempt_number": 1,
        "execution_id": "exec_demo_1g_01",
        "idempotency_key": "ik_demo_1g_01",
        "status": "SUCCEEDED",
        "outcome_status": "RECOVERED",
        "amount_recovered": Decimal("4999.00"),
        "created_at": datetime(2026, 8, 22, 14, 10, 0),
    },
    {
        "id": "att_demo_1h_01",
        "case_id": "case_pay_demo_1h",
        "action_type": "PAYMENT_RETRY",
        "attempt_number": 1,
        "execution_id": "exec_demo_1h_01",
        "idempotency_key": "ik_demo_1h_01",
        "status": "SUCCEEDED",
        "outcome_status": "RECOVERED",
        "amount_recovered": Decimal("4999.00"),
        "created_at": datetime(2026, 8, 22, 14, 22, 0),
    },
    {
        "id": "att_sec_001",
        "case_id": "case_pay_sec_verify_001",
        "action_type": "PAYMENT_RETRY",
        "attempt_number": 1,
        "execution_id": "exec_sec_001",
        "idempotency_key": "ik_sec_001",
        "status": "SUCCEEDED",
        "outcome_status": "RECOVERED",
        "amount_recovered": Decimal("2500.00"),
        "created_at": datetime(2026, 8, 22, 19, 1, 30),
    },
    {
        "id": "att_replay_001",
        "case_id": "case_pay_replay_001",
        "action_type": "PAYMENT_RETRY",
        "attempt_number": 1,
        "execution_id": "exec_replay_001",
        "idempotency_key": "ik_replay_001",
        "status": "SUCCEEDED",
        "outcome_status": "RECOVERED",
        "amount_recovered": Decimal("1500.00"),
        "created_at": datetime(2026, 8, 22, 14, 40, 15),
    },
]

CURATED_JOBS = [
    {
        "job_id": "job_9812_01",
        "case_id": "CASE-2026-9812",
        "payment_id": "pay_9xM8k21Lm",
        "customer_id": "cust_usr_8912",
        "job_type": "RECOVERY_CYCLE",
        "status": "SUCCEEDED",
        "priority": "HIGH",
        "attempt_number": 2,
        "max_attempts": 3,
        "created_at": datetime(2026, 8, 25, 14, 8, 37),
        "correlation_id": "corr_9812_rec",
    },
    {
        "job_id": "job_9811_01",
        "case_id": "CASE-2026-9811",
        "payment_id": "pay_7vP31q82B",
        "customer_id": "cust_usr_4402",
        "job_type": "RECOVERY_CYCLE",
        "status": "CLAIMED",
        "priority": "MEDIUM",
        "attempt_number": 1,
        "max_attempts": 3,
        "created_at": datetime(2026, 8, 25, 14, 4, 12),
        "correlation_id": "corr_9811_active",
    },
    {
        "job_id": "job_9810_01",
        "case_id": "CASE-2026-9810",
        "payment_id": "pay_4nL52k91Z",
        "customer_id": "cust_usr_9931",
        "job_type": "RETRY",
        "status": "FAILED",
        "priority": "CRITICAL",
        "attempt_number": 3,
        "max_attempts": 3,
        "created_at": datetime(2026, 8, 25, 13, 58, 20),
        "last_error": "Authentication step-up rejected by cardholder bank",
        "correlation_id": "corr_9810_escalate",
    },
    {
        "job_id": "job_9809_01",
        "case_id": "CASE-2026-9809",
        "payment_id": "pay_1mQ84v29C",
        "customer_id": "cust_usr_1204",
        "job_type": "RECOVERY_CYCLE",
        "status": "SUCCEEDED",
        "priority": "LOW",
        "attempt_number": 1,
        "max_attempts": 3,
        "created_at": datetime(2026, 8, 25, 13, 41, 0),
        "correlation_id": "corr_9809_succ",
    },
    {
        "job_id": "job_9808_01",
        "case_id": "CASE-2026-9808",
        "payment_id": "pay_8kR29p41D",
        "customer_id": "cust_usr_7721",
        "job_type": "RETRY",
        "status": "QUEUED",
        "priority": "HIGH",
        "attempt_number": 0,
        "max_attempts": 3,
        "created_at": datetime(2026, 8, 25, 13, 35, 10),
        "correlation_id": "corr_9808_queue",
    },
]

CURATED_AUDIT_EVENTS = [
    {
        "id": "aud_seed_9812",
        "event_type": "RECOVERY_SUCCEEDED",
        "aggregate_id": "CASE-2026-9812",
        "case_id": "CASE-2026-9812",
        "payment_id": "pay_9xM8k21Lm",
        "payload": '{"case_id": "CASE-2026-9812", "amount": 14850.0, "currency": "USD", "status": "RECOVERED"}',
        "timestamp": datetime(2026, 8, 25, 14, 12, 19),
        "correlation_id": "corr_9812_rec",
    },
    {
        "id": "aud_seed_9811",
        "event_type": "RECOVERY_ATTEMPTED",
        "aggregate_id": "CASE-2026-9811",
        "case_id": "CASE-2026-9811",
        "payment_id": "pay_7vP31q82B",
        "payload": '{"case_id": "CASE-2026-9811", "amount": 4290.0, "currency": "USD", "status": "ACTIVE"}',
        "timestamp": datetime(2026, 8, 25, 14, 4, 15),
        "correlation_id": "corr_9811_active",
    },
    {
        "id": "aud_seed_9810",
        "event_type": "CASE_ESCALATED",
        "aggregate_id": "CASE-2026-9810",
        "case_id": "CASE-2026-9810",
        "payment_id": "pay_4nL52k91Z",
        "payload": '{"case_id": "CASE-2026-9810", "amount": 28400.0, "currency": "USD", "status": "ESCALATED"}',
        "timestamp": datetime(2026, 8, 25, 14, 9, 44),
        "correlation_id": "corr_9810_escalate",
    },
]


def is_seeding_enabled() -> bool:
    """Check if sandbox seeding is enabled via environment variable."""
    raw = os.getenv(SEED_SANDBOX_ENV, "false").strip().lower()
    return raw == "true"


def seed_sandbox_data(session: Session) -> bool:
    """Idempotently seed the curated sandbox dataset if database is completely empty.

    Returns:
        bool: True if records were seeded, False if skipped or disabled.
    """
    if not is_seeding_enabled():
        logger.info("[SANDBOX_SEEDER] Seeding is disabled (RECOVERFLOW_SEED_SANDBOX != 'true').")
        return False

    try:
        # Check counts across core domain tables
        cust_count = session.query(CustomerModel).count()
        pay_count = session.query(PaymentModel).count()
        case_count = session.query(RecoveryCaseModel).count()

        if cust_count > 0 or pay_count > 0 or case_count > 0:
            logger.info(
                "[SANDBOX_SEEDER] Database already contains records (customers: %d, payments: %d, cases: %d). Skipping seeding.",
                cust_count,
                pay_count,
                case_count,
            )
            return False

        logger.info("[SANDBOX_SEEDER] Database is empty and seeding is enabled. Seeding started...")

        # 1. Insert Customers
        for c_data in CURATED_CUSTOMERS:
            cust = CustomerModel(**c_data)
            session.add(cust)
        session.flush()

        # 2. Insert Payments
        for p_data in CURATED_PAYMENTS:
            pay = PaymentModel(**p_data)
            session.add(pay)
        session.flush()

        # 3. Insert Recovery Cases
        for case_data in CURATED_CASES:
            rc = RecoveryCaseModel(**case_data)
            session.add(rc)
        session.flush()

        # 4. Insert Attempts
        for att_data in CURATED_ATTEMPTS:
            att = RecoveryAttemptModel(**att_data)
            session.add(att)
        session.flush()

        # 5. Insert Jobs
        for job_data in CURATED_JOBS:
            job = RecoveryJobModel(**job_data)
            session.add(job)
        session.flush()

        # 6. Insert Audit Events
        for audit_data in CURATED_AUDIT_EVENTS:
            aud = AuditEventModel(**audit_data)
            session.add(aud)
        session.flush()

        session.commit()
        total_created = len(CURATED_CUSTOMERS) + len(CURATED_PAYMENTS) + len(CURATED_CASES) + len(CURATED_ATTEMPTS) + len(CURATED_JOBS) + len(CURATED_AUDIT_EVENTS)
        logger.info(
            "[SANDBOX_SEEDER] Seeding completed successfully. Created %d records (%d customers, %d payments, %d cases, %d attempts, %d jobs, %d audit events).",
            total_created,
            len(CURATED_CUSTOMERS),
            len(CURATED_PAYMENTS),
            len(CURATED_CASES),
            len(CURATED_ATTEMPTS),
            len(CURATED_JOBS),
            len(CURATED_AUDIT_EVENTS),
        )
        return True

    except Exception as exc:
        session.rollback()
        logger.error("[SANDBOX_SEEDER] Seeding failed and was rolled back: %s", exc, exc_info=True)
        return False


def seed_sandbox_data_if_enabled(engine_or_session: Any = None) -> bool:
    """Safe entrypoint called from main.py startup thread or CLI."""
    if not is_seeding_enabled():
        logger.info("[SANDBOX_SEEDER] Seeding is disabled (RECOVERFLOW_SEED_SANDBOX != 'true').")
        return False

    if isinstance(engine_or_session, Session):
        return seed_sandbox_data(engine_or_session)

    try:
        with SessionLocal() as session:
            return seed_sandbox_data(session)
    except Exception as exc:
        logger.error("[SANDBOX_SEEDER] Failed to open session for seeding: %s", exc)
        return False
