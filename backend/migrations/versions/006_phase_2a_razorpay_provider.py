"""Phase 2A schema migration: add provider_operation and provider_status to recovery_executions

Revision ID: 006_phase_2a_razorpay_provider
Revises: 005_phase_1k_distributed_workers
Create Date: 2026-08-22 20:44:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision = '006_phase_2a_razorpay_provider'
down_revision = '005_phase_1k_distributed_workers'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)

    if 'recovery_executions' in inspector.get_table_names():
        cols = [c['name'] for c in inspector.get_columns('recovery_executions')]
        with op.batch_alter_table('recovery_executions') as batch_op:
            if 'provider_operation' not in cols:
                batch_op.add_column(sa.Column('provider_operation', sa.String(length=64), nullable=True))
            if 'provider_status' not in cols:
                batch_op.add_column(sa.Column('provider_status', sa.String(length=32), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)

    if 'recovery_executions' in inspector.get_table_names():
        cols = [c['name'] for c in inspector.get_columns('recovery_executions')]
        with op.batch_alter_table('recovery_executions') as batch_op:
            if 'provider_operation' in cols:
                batch_op.drop_column('provider_operation')
            if 'provider_status' in cols:
                batch_op.drop_column('provider_status')
