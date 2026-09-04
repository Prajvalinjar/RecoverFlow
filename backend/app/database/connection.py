import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()


def get_database_url() -> str:
    """Returns DATABASE_URL from environment or fallback default."""
    url = os.getenv("DATABASE_URL", "sqlite:///./recoverflow_dev.db")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def create_db_engine(url: str = None):
    db_url = url or get_database_url()
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    connect_args = {}
    kwargs = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    else:
        kwargs["pool_pre_ping"] = True
        connect_args["connect_timeout"] = 5

    return create_engine(
        db_url,
        connect_args=connect_args,
        **kwargs
    )


engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
