from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
    Text,
)
from sqlalchemy.orm import relationship

from app.database.connection import Base


class CustomerModel(Base):
    __tablename__ = "customers"

    id = Column(String(64), primary_key=True, index=True)
    external_customer_id = Column(String(128), index=True, nullable=True)
    segment = Column(String(32), nullable=False, default="REGULAR")
    total_payments = Column(Integer, nullable=False, default=0)
    successful_payments = Column(Integer, nullable=False, default=0)
    failed_payments = Column(Integer, nullable=False, default=0)
    total_spent = Column(Numeric(12, 2), nullable=False, default=0.00)
    average_payment_delay = Column(Float, nullable=False, default=0.0)
    recovery_success_rate = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    payments = relationship("PaymentModel", back_populates="customer", cascade="all, delete-orphan")


class PaymentModel(Base):
    __tablename__ = "payments"

    id = Column(String(64), primary_key=True, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(8), nullable=False, default="INR")
    status = Column(String(32), nullable=False)
    failure_code = Column(String(64), nullable=True)
    provider_payment_id = Column(String(128), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("CustomerModel", back_populates="payments")
    recovery_cases = relationship("RecoveryCaseModel", back_populates="payment", cascade="all, delete-orphan")


class RecoveryCaseModel(Base):
    __tablename__ = "recovery_cases"

    id = Column(String(64), primary_key=True, index=True)
    payment_id = Column(String(64), ForeignKey("payments.id"), nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False, index=True)
    state = Column(String(32), nullable=False, default="DETECTED", index=True)
    priority = Column(String(16), nullable=False, default="MEDIUM")
    attempt_count = Column(Integer, nullable=False, default=0)
    max_allowed_attempts = Column(Integer, nullable=False, default=3)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    terminal_reason = Column(String(256), nullable=True)

    payment = relationship("PaymentModel", back_populates="recovery_cases")
    attempts = relationship("RecoveryAttemptModel", back_populates="case", cascade="all, delete-orphan")


class RecoveryAttemptModel(Base):
    __tablename__ = "recovery_attempts"

    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("recovery_cases.id"), nullable=False, index=True)
    action_type = Column(String(64), nullable=False)
    attempt_number = Column(Integer, nullable=False, default=1)
    execution_id = Column(String(128), nullable=True, index=True)
    idempotency_key = Column(String(128), nullable=True, index=True)
    status = Column(String(32), nullable=False)
    outcome_status = Column(String(32), nullable=False)
    amount_recovered = Column(Numeric(12, 2), nullable=False, default=0.00)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    case = relationship("RecoveryCaseModel", back_populates="attempts")


class PaymentEventModel(Base):
    __tablename__ = "payment_events"

    id = Column(String(64), primary_key=True, index=True)
    provider_event_id = Column(String(128), nullable=False, index=True)
    provider = Column(String(64), nullable=False, default="razorpay", index=True)
    event_type = Column(String(64), nullable=False)
    payment_id = Column(String(64), nullable=False, index=True)
    customer_id = Column(String(64), nullable=False, index=True)
    payload_hash = Column(String(64), nullable=True)
    processing_status = Column(String(32), nullable=False, default="RECEIVED")
    received_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    occurred_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    __table_args__ = (
        UniqueConstraint("provider_event_id", "provider", name="uq_payment_events_provider_event_id_provider"),
    )


class AuditEventModel(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True, index=True)
    event_type = Column(String(64), nullable=False, index=True)
    aggregate_id = Column(String(64), nullable=False, index=True)
    case_id = Column(String(64), nullable=True, index=True)
    payment_id = Column(String(64), nullable=True, index=True)
    payload = Column(Text, nullable=False)  # JSON string metadata
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    correlation_id = Column(String(64), nullable=True, index=True)


class RecoveryExecutionModel(Base):
    __tablename__ = "recovery_executions"

    execution_id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("recovery_cases.id"), nullable=False, index=True)
    decision_id = Column(String(64), nullable=True)
    policy_decision_id = Column(String(64), nullable=False)
    action_type = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False, index=True)
    idempotency_key = Column(String(128), nullable=False, unique=True, index=True)
    provider = Column(String(64), nullable=False, default="SIMULATED_PROVIDER")
    provider_reference = Column(String(128), nullable=True)
    provider_operation = Column(String(64), nullable=True)
    provider_status = Column(String(32), nullable=True)
    amount = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(8), nullable=False, default="INR")
    error_code = Column(String(64), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    dispatched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    correlation_id = Column(String(64), nullable=True, index=True)

    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_recovery_executions_idempotency_key"),
    )


class RecoveryJobModel(Base):
    __tablename__ = "recovery_jobs"

    job_id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("recovery_cases.id"), nullable=False, index=True)
    payment_id = Column(String(64), nullable=False, default="", index=True)
    customer_id = Column(String(64), nullable=False, default="", index=True)
    job_type = Column(String(32), nullable=False, default="RECOVERY_CYCLE", index=True)
    trigger_id = Column(String(64), nullable=True)
    status = Column(String(32), nullable=False, default="QUEUED", index=True)
    priority = Column(String(16), nullable=False, default="MEDIUM")
    attempt_number = Column(Integer, nullable=False, default=1)
    max_attempts = Column(Integer, nullable=False, default=3)
    available_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    claimed_at = Column(DateTime, nullable=True)
    lease_expires_at = Column(DateTime, nullable=True, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    last_error_code = Column(String(64), nullable=True)
    last_error_category = Column(String(64), nullable=True)
    idempotency_key = Column(String(128), nullable=True, unique=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    correlation_id = Column(String(64), nullable=True, index=True)
    worker_id = Column(String(64), nullable=True, index=True)
    worker_claim_token = Column(String(64), nullable=True)

    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_recovery_jobs_idempotency_key"),
    )


class ProviderHealthModel(Base):
    __tablename__ = "provider_health"

    id = Column(String(64), primary_key=True, index=True)
    provider_name = Column(String(64), nullable=False, unique=True, index=True)
    status = Column(String(32), nullable=False, default="HEALTHY", index=True)
    consecutive_failures = Column(Integer, nullable=False, default=0)
    consecutive_successes = Column(Integer, nullable=False, default=0)
    last_success_at = Column(DateTime, nullable=True)
    last_failure_at = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("provider_name", name="uq_provider_health_provider_name"),
    )


class RecoveryOperationsStateModel(Base):
    __tablename__ = "recovery_operations_state"

    id = Column(String(64), primary_key=True, index=True)
    status = Column(String(32), nullable=False, default="RUNNING", index=True)
    reason = Column(Text, nullable=True)
    changed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    changed_by = Column(String(64), nullable=False, default="OPERATOR")


class ReconciliationRecordModel(Base):
    __tablename__ = "reconciliation_records"

    id = Column(String(64), primary_key=True, index=True)
    execution_id = Column(String(64), ForeignKey("recovery_executions.execution_id"), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="PENDING", index=True)
    attempt_count = Column(Integer, nullable=False, default=1)
    last_attempt_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    failure_reason = Column(Text, nullable=True)
    correlation_id = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class WorkerModel(Base):
    __tablename__ = "workers"

    worker_id = Column(String(64), primary_key=True, index=True)
    hostname = Column(String(128), nullable=False, default="unknown")
    process_id = Column(Integer, nullable=False, default=0)
    status = Column(String(32), nullable=False, default="STARTING", index=True)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_heartbeat_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    capabilities = Column(Text, nullable=True)
    version = Column(String(32), nullable=False, default="1.0.0")
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class EventProcessingRecordModel(Base):
    __tablename__ = "event_processing_records"

    id = Column(String(64), primary_key=True, index=True)
    event_id = Column(String(64), nullable=False, index=True)
    event_type = Column(String(64), nullable=False, index=True)
    consumer_name = Column(String(64), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="PROCESSED", index=True)
    correlation_id = Column(String(64), nullable=True, index=True)
    processed_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    __table_args__ = (
        UniqueConstraint("event_id", "consumer_name", name="uq_event_consumer_idempotency"),
    )


class ProviderRegistryModel(Base):
    __tablename__ = "provider_registry"

    id = Column(String(64), primary_key=True, index=True)
    provider_name = Column(String(64), nullable=False, unique=True, index=True)
    environment = Column(String(32), nullable=False, default="test")
    lifecycle_status = Column(String(32), nullable=False, default="AVAILABLE", index=True)
    capabilities = Column(Text, nullable=True)
    configuration_status = Column(Text, nullable=True)
    enabled = Column(Integer, nullable=False, default=1)
    last_health_check = Column(DateTime, nullable=True)
    correlation_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("provider_name", name="uq_provider_registry_provider_name"),
    )


class ProviderOperationModel(Base):
    __tablename__ = "provider_operations"

    id = Column(String(64), primary_key=True, index=True)
    execution_id = Column(String(64), nullable=False, index=True)
    provider_name = Column(String(64), nullable=False, index=True)
    provider_operation = Column(String(64), nullable=False)
    provider_request_id = Column(String(128), nullable=True, index=True)
    provider_reference_id = Column(String(128), nullable=True, index=True)
    provider_status = Column(String(32), nullable=True)
    normalized_status = Column(String(32), nullable=False, index=True)
    idempotency_key = Column(String(128), nullable=False, index=True)
    correlation_id = Column(String(64), nullable=True, index=True)
    failure_code = Column(String(64), nullable=True)
    failure_category = Column(String(64), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)



