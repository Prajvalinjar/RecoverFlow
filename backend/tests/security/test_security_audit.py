import pytest
from app.domain.audit import AuditEvent, AuditEventType, AuditTrail


def test_security_audit_event_types_supported() -> None:
    audit_trail = AuditTrail()

    evt1 = audit_trail.record(
        case_id="system",
        event_type=AuditEventType.AUTHENTICATION_SUCCEEDED,
        actor="SYSTEM",
        details={"category": "WEBHOOK"},
        correlation_id="corr_sec_123",
    )
    assert evt1.event_type == AuditEventType.AUTHENTICATION_SUCCEEDED
    assert evt1.correlation_id == "corr_sec_123"

    evt2 = audit_trail.record(
        case_id="system",
        event_type=AuditEventType.REPLAY_REJECTED,
        actor="SYSTEM",
        details={"reason": "Duplicate signature"},
        correlation_id="corr_sec_124",
    )
    assert evt2.event_type == AuditEventType.REPLAY_REJECTED
