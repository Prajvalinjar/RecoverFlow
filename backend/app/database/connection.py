import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def get_database_url() -> str:
    """Returns DATABASE_URL from environment or fallback default."""
    return os.getenv("DATABASE_URL", "sqlite:///./recoverflow_dev.db")


def create_db_engine(url: str = None):
    db_url = url or get_database_url()
    connect_args = {}
    kwargs = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    else:
        kwargs["pool_pre_ping"] = True

    return create_engine(
        db_url,
        connect_args=connect_args,
        **kwargs
    )



engine = create_db_engine()
