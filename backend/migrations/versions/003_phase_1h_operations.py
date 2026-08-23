"""Phase 1H schema migration: provider_health, recovery_operations_state, reconciliation_records

Revision ID: 003_phase_1h_operations
Revises: 002_phase_1g_schema
Create Date: 2026-08-22 19:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '003_phase_1h_operations'
down_revision = '002_phase_1g_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Provider Health
    op.create_table(
        'provider_health',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('provider_name', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='HEALTHY'),
        sa.Column('consecutive_failures', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('consecutive_successes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_success_at', sa.DateTime(), nullable=True),
        sa.Column('last_failure_at', sa.DateTime(), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('provider_name', name='uq_provider_health_provider_name')
    )
    op.create_index(op.f('ix_provider_health_id'), 'provider_health', ['id'], unique=False)
    op.create_index(op.f('ix_provider_health_provider_name'), 'provider_health', ['provider_name'], unique=True)

    # Recovery Operations State
    op.create_table(
        'recovery_operations_state',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='RUNNING'),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('changed_at', sa.DateTime(), nullable=False),
        sa.Column('changed_by', sa.String(length=64), nullable=False, server_default='OPERATOR'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_recovery_operations_state_id'), 'recovery_operations_state', ['id'], unique=False)

    # Reconciliation Records
    op.create_table(
        'reconciliation_records',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('execution_id', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='PENDING'),
        sa.Column('attempt_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('last_attempt_at', sa.DateTime(), nullable=False),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('correlation_id', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['execution_id'], ['recovery_executions.execution_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reconciliation_records_id'), 'reconciliation_records', ['id'], unique=False)
    op.create_index(op.f('ix_reconciliation_records_execution_id'), 'reconciliation_records', ['execution_id'], unique=False)


def downgrade() -> None:
    op.drop_table('reconciliation_records')
    op.drop_table('recovery_operations_state')
    op.drop_table('provider_health')
