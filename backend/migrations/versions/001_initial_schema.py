"""Initial schema migration for RecoverFlow Phase 1F

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-22 19:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Customers
    op.create_table(
        'customers',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('external_customer_id', sa.String(length=128), nullable=True),
        sa.Column('segment', sa.String(length=32), nullable=False, server_default='REGULAR'),
        sa.Column('total_payments', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('successful_payments', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failed_payments', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_spent', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('average_payment_delay', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('recovery_success_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customers_id'), 'customers', ['id'], unique=False)
    op.create_index(op.f('ix_customers_external_customer_id'), 'customers', ['external_customer_id'], unique=False)

    # Payments
    op.create_table(
        'payments',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('customer_id', sa.String(length=64), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=8), nullable=False, server_default='INR'),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('failure_code', sa.String(length=64), nullable=True),
        sa.Column('provider_payment_id', sa.String(length=128), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payments_id'), 'payments', ['id'], unique=False)
    op.create_index(op.f('ix_payments_customer_id'), 'payments', ['customer_id'], unique=False)

    # Recovery Cases
    op.create_table(
        'recovery_cases',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('payment_id', sa.String(length=64), nullable=False),
        sa.Column('customer_id', sa.String(length=64), nullable=False),
        sa.Column('state', sa.String(length=32), nullable=False, server_default='DETECTED'),
        sa.Column('priority', sa.String(length=16), nullable=False, server_default='MEDIUM'),
        sa.Column('attempt_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_allowed_attempts', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('terminal_reason', sa.String(length=256), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.ForeignKeyConstraint(['payment_id'], ['payments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_recovery_cases_id'), 'recovery_cases', ['id'], unique=False)
    op.create_index(op.f('ix_recovery_cases_payment_id'), 'recovery_cases', ['payment_id'], unique=False)

    # Recovery Attempts
    op.create_table(
        'recovery_attempts',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('case_id', sa.String(length=64), nullable=False),
        sa.Column('action_type', sa.String(length=64), nullable=False),
        sa.Column('attempt_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('execution_id', sa.String(length=128), nullable=True),
        sa.Column('idempotency_key', sa.String(length=128), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('outcome_status', sa.String(length=32), nullable=False),
        sa.Column('amount_recovered', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['case_id'], ['recovery_cases.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Payment Events
    op.create_table(
        'payment_events',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('provider_event_id', sa.String(length=128), nullable=False),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('payment_id', sa.String(length=64), nullable=False),
        sa.Column('customer_id', sa.String(length=64), nullable=False),
        sa.Column('payload_hash', sa.String(length=64), nullable=True),
        sa.Column('processing_status', sa.String(length=32), nullable=False, server_default='RECEIVED'),
        sa.Column('received_at', sa.DateTime(), nullable=False),
        sa.Column('occurred_at', sa.DateTime(), nullable=False),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('provider_event_id', name='uq_payment_events_provider_event_id')
    )
    op.create_index(op.f('ix_payment_events_provider_event_id'), 'payment_events', ['provider_event_id'], unique=True)

    # Audit Events
    op.create_table(
        'audit_events',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('aggregate_id', sa.String(length=64), nullable=False),
        sa.Column('case_id', sa.String(length=64), nullable=True),
        sa.Column('payment_id', sa.String(length=64), nullable=True),
        sa.Column('payload', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('audit_events')
    op.drop_table('payment_events')
    op.drop_table('recovery_attempts')
    op.drop_table('recovery_cases')
    op.drop_table('payments')
    op.drop_table('customers')
