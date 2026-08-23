"""Phase 1J schema migration: update recovery_jobs with queue attributes and indexes

Revision ID: 004_phase_1j_jobs
Revises: 003_phase_1h_operations
Create Date: 2026-08-22 20:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '004_phase_1j_jobs'
down_revision = '003_phase_1h_operations'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new Phase 1J columns to recovery_jobs if they do not exist
    with op.batch_alter_table('recovery_jobs') as batch_op:
        batch_op.add_column(sa.Column('payment_id', sa.String(length=64), nullable=False, server_default=''))
        batch_op.add_column(sa.Column('customer_id', sa.String(length=64), nullable=False, server_default=''))
        batch_op.add_column(sa.Column('job_type', sa.String(length=32), nullable=False, server_default='RECOVERY_CYCLE'))
        batch_op.add_column(sa.Column('priority', sa.String(length=16), nullable=False, server_default='MEDIUM'))
        batch_op.add_column(sa.Column('claimed_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('lease_expires_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('failed_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('last_error_code', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('last_error_category', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('idempotency_key', sa.String(length=128), nullable=True))

        batch_op.create_index('ix_recovery_jobs_payment_id', ['payment_id'])
        batch_op.create_index('ix_recovery_jobs_customer_id', ['customer_id'])
        batch_op.create_index('ix_recovery_jobs_job_type', ['job_type'])
        batch_op.create_index('ix_recovery_jobs_lease_expires_at', ['lease_expires_at'])
        batch_op.create_index('ix_recovery_jobs_idempotency_key', ['idempotency_key'], unique=True)


def downgrade() -> None:
    with op.batch_alter_table('recovery_jobs') as batch_op:
        batch_op.drop_index('ix_recovery_jobs_idempotency_key')
        batch_op.drop_index('ix_recovery_jobs_lease_expires_at')
        batch_op.drop_index('ix_recovery_jobs_job_type')
        batch_op.drop_index('ix_recovery_jobs_customer_id')
        batch_op.drop_index('ix_recovery_jobs_payment_id')

        batch_op.drop_column('idempotency_key')
        batch_op.drop_column('last_error_category')
        batch_op.drop_column('last_error_code')
        batch_op.drop_column('failed_at')
        batch_op.drop_column('lease_expires_at')
        batch_op.drop_column('claimed_at')
        batch_op.drop_column('priority')
        batch_op.drop_column('job_type')
        batch_op.drop_column('customer_id')
        batch_op.drop_column('payment_id')
