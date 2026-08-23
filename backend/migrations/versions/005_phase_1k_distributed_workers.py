"""Phase 1K schema migration: workers table, event_processing_records table, and job worker columns

Revision ID: 005_phase_1k_distributed_workers
Revises: 004_phase_1j_jobs
Create Date: 2026-08-22 20:28:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision = '005_phase_1k_distributed_workers'
down_revision = '004_phase_1j_jobs'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # 1. Create workers table if not exists
    if 'workers' not in tables:
        op.create_table(
            'workers',
            sa.Column('worker_id', sa.String(length=64), nullable=False),
            sa.Column('hostname', sa.String(length=128), nullable=False, server_default='unknown'),
            sa.Column('process_id', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('status', sa.String(length=32), nullable=False, server_default='STARTING'),
            sa.Column('started_at', sa.DateTime(), nullable=False),
            sa.Column('last_heartbeat_at', sa.DateTime(), nullable=False),
            sa.Column('capabilities', sa.Text(), nullable=True),
            sa.Column('version', sa.String(length=32), nullable=False, server_default='1.0.0'),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('worker_id')
        )
        op.create_index('ix_workers_worker_id', 'workers', ['worker_id'])
        op.create_index('ix_workers_status', 'workers', ['status'])
        op.create_index('ix_workers_last_heartbeat_at', 'workers', ['last_heartbeat_at'])

    # 2. Create event_processing_records table if not exists
    if 'event_processing_records' not in tables:
        op.create_table(
            'event_processing_records',
            sa.Column('id', sa.String(length=64), nullable=False),
            sa.Column('event_id', sa.String(length=64), nullable=False),
            sa.Column('event_type', sa.String(length=64), nullable=False),
            sa.Column('consumer_name', sa.String(length=64), nullable=False),
            sa.Column('status', sa.String(length=32), nullable=False, server_default='PROCESSED'),
            sa.Column('correlation_id', sa.String(length=64), nullable=True),
            sa.Column('processed_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('event_id', 'consumer_name', name='uq_event_consumer_idempotency')
        )
        op.create_index('ix_event_processing_records_id', 'event_processing_records', ['id'])
        op.create_index('ix_event_processing_records_event_id', 'event_processing_records', ['event_id'])
        op.create_index('ix_event_processing_records_event_type', 'event_processing_records', ['event_type'])
        op.create_index('ix_event_processing_records_consumer_name', 'event_processing_records', ['consumer_name'])

    # 3. Add worker_id and worker_claim_token columns to recovery_jobs if not exists
    job_cols = [c['name'] for c in inspector.get_columns('recovery_jobs')]
    with op.batch_alter_table('recovery_jobs') as batch_op:
        if 'worker_id' not in job_cols:
            batch_op.add_column(sa.Column('worker_id', sa.String(length=64), nullable=True))
            batch_op.create_index('ix_recovery_jobs_worker_id', ['worker_id'])
        if 'worker_claim_token' not in job_cols:
            batch_op.add_column(sa.Column('worker_claim_token', sa.String(length=64), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    if 'recovery_jobs' in tables:
        job_cols = [c['name'] for c in inspector.get_columns('recovery_jobs')]
        with op.batch_alter_table('recovery_jobs') as batch_op:
            if 'worker_id' in job_cols:
                batch_op.drop_index('ix_recovery_jobs_worker_id')
                batch_op.drop_column('worker_id')
            if 'worker_claim_token' in job_cols:
                batch_op.drop_column('worker_claim_token')

    if 'event_processing_records' in tables:
        op.drop_table('event_processing_records')

    if 'workers' in tables:
        op.drop_table('workers')
