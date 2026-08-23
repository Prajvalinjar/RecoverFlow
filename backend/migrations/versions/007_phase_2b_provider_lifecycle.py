"""Phase 2B schema migration: provider registry, provider operations tracking, and provider-aware payment event deduplication.

Revision ID: 007_phase_2b_provider_lifecycle
Revises: 006_phase_2a_razorpay_provider
Create Date: 2026-08-23 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision = '007_phase_2b_provider_lifecycle'
down_revision = '006_phase_2a_razorpay_provider'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # 1. Create provider_registry
    if 'provider_registry' not in tables:
        op.create_table(
            'provider_registry',
            sa.Column('id', sa.String(length=64), primary_key=True, nullable=False),
            sa.Column('provider_name', sa.String(length=64), nullable=False, unique=True),
            sa.Column('environment', sa.String(length=32), nullable=False, server_default='test'),
            sa.Column('lifecycle_status', sa.String(length=32), nullable=False, server_default='AVAILABLE'),
            sa.Column('capabilities', sa.Text(), nullable=True),
            sa.Column('configuration_status', sa.Text(), nullable=True),
            sa.Column('enabled', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('last_health_check', sa.DateTime(), nullable=True),
            sa.Column('correlation_id', sa.String(length=64), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.UniqueConstraint('provider_name', name='uq_provider_registry_provider_name'),
        )
        op.create_index('ix_provider_registry_id', 'provider_registry', ['id'])
        op.create_index('ix_provider_registry_provider_name', 'provider_registry', ['provider_name'])
        op.create_index('ix_provider_registry_lifecycle_status', 'provider_registry', ['lifecycle_status'])

    # 2. Create provider_operations
    if 'provider_operations' not in tables:
        op.create_table(
            'provider_operations',
            sa.Column('id', sa.String(length=64), primary_key=True, nullable=False),
            sa.Column('execution_id', sa.String(length=64), nullable=False),
            sa.Column('provider_name', sa.String(length=64), nullable=False),
            sa.Column('provider_operation', sa.String(length=64), nullable=False),
            sa.Column('provider_request_id', sa.String(length=128), nullable=True),
            sa.Column('provider_reference_id', sa.String(length=128), nullable=True),
            sa.Column('provider_status', sa.String(length=32), nullable=True),
            sa.Column('normalized_status', sa.String(length=32), nullable=False),
            sa.Column('idempotency_key', sa.String(length=128), nullable=False),
            sa.Column('correlation_id', sa.String(length=64), nullable=True),
            sa.Column('failure_code', sa.String(length=64), nullable=True),
            sa.Column('failure_category', sa.String(length=64), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
        )
        op.create_index('ix_provider_operations_id', 'provider_operations', ['id'])
        op.create_index('ix_provider_operations_execution_id', 'provider_operations', ['execution_id'])
        op.create_index('ix_provider_operations_provider_name', 'provider_operations', ['provider_name'])
        op.create_index('ix_provider_operations_normalized_status', 'provider_operations', ['normalized_status'])
        op.create_index('ix_provider_operations_idempotency_key', 'provider_operations', ['idempotency_key'])
        op.create_index('ix_provider_operations_correlation_id', 'provider_operations', ['correlation_id'])

    # 3. Enhance payment_events with provider column & composite constraint
    if 'payment_events' in tables:
        cols = [c['name'] for c in inspector.get_columns('payment_events')]
        with op.batch_alter_table('payment_events') as batch_op:
            if 'provider' not in cols:
                batch_op.add_column(sa.Column('provider', sa.String(length=64), nullable=False, server_default='razorpay'))
                batch_op.create_index('ix_payment_events_provider', ['provider'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    if 'provider_operations' in tables:
        op.drop_table('provider_operations')

    if 'provider_registry' in tables:
        op.drop_table('provider_registry')

    if 'payment_events' in tables:
        cols = [c['name'] for c in inspector.get_columns('payment_events')]
        with op.batch_alter_table('payment_events') as batch_op:
            if 'provider' in cols:
                batch_op.drop_index('ix_payment_events_provider')
                batch_op.drop_column('provider')
