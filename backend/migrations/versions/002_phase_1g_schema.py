"""Phase 1G schema migration: recovery_executions and recovery_jobs

Revision ID: 002_phase_1g_schema
Revises: 001_initial_schema
Create Date: 2026-08-22 19:33:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '002_phase_1g_schema'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Audit Events correlation_id
    op.add_column('audit_events', sa.Column('correlation_id', sa.String(length=64), nullable=True))
    op.create_index(op.f('ix_audit_events_correlation_id'), 'audit_events', ['correlation_id'], unique=False)

    # Recovery Executions
    op.create_table(
        'recovery_executions',
        sa.Column('execution_id', sa.String(length=64), nullable=False),
        sa.Column('case_id', sa.String(length=64), nullable=False),
        sa.Column('decision_id', sa.String(length=64), nullable=True),
        sa.Column('policy_decision_id', sa.String(length=64), nullable=False),
        sa.Column('action_type', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('idempotency_key', sa.String(length=128), nullable=False),
        sa.Column('provider', sa.String(length=64), nullable=False, server_default='SIMULATED_PROVIDER'),
        sa.Column('provider_reference', sa.String(length=128), nullable=True),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('currency', sa.String(length=8), nullable=False, server_default='INR'),
        sa.Column('error_code', sa.String(length=64), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('dispatched_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('correlation_id', sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['recovery_cases.id'], ),
        sa.PrimaryKeyConstraint('execution_id'),
        sa.UniqueConstraint('idempotency_key', name='uq_recovery_executions_idempotency_key')
    )
    op.create_index(op.f('ix_recovery_executions_execution_id'), 'recovery_executions', ['execution_id'], unique=False)
    op.create_index(op.f('ix_recovery_executions_case_id'), 'recovery_executions', ['case_id'], unique=False)
    op.create_index(op.f('ix_recovery_executions_status'), 'recovery_executions', ['status'], unique=False)
    op.create_index(op.f('ix_recovery_executions_idempotency_key'), 'recovery_executions', ['idempotency_key'], unique=True)

    # Recovery Jobs
    op.create_table(
        'recovery_jobs',
        sa.Column('job_id', sa.String(length=64), nullable=False),
        sa.Column('case_id', sa.String(length=64), nullable=False),
        sa.Column('trigger_id', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='QUEUED'),
        sa.Column('attempt_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('available_at', sa.DateTime(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('correlation_id', sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['recovery_cases.id'], ),
        sa.PrimaryKeyConstraint('job_id')
    )
    op.create_index(op.f('ix_recovery_jobs_job_id'), 'recovery_jobs', ['job_id'], unique=False)
    op.create_index(op.f('ix_recovery_jobs_case_id'), 'recovery_jobs', ['case_id'], unique=False)
    op.create_index(op.f('ix_recovery_jobs_status'), 'recovery_jobs', ['status'], unique=False)
    op.create_index(op.f('ix_recovery_jobs_available_at'), 'recovery_jobs', ['available_at'], unique=False)


def downgrade() -> None:
    op.drop_table('recovery_jobs')
    op.drop_table('recovery_executions')
    op.drop_index(op.f('ix_audit_events_correlation_id'), table_name='audit_events')
    op.drop_column('audit_events', 'correlation_id')
