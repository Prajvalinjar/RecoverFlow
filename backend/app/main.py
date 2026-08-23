import os
import logging
from typing import Dict, List
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.router import api_v1_router
from app.database.connection import engine, Base
from app.security.config import SecurityConfigurationError
from app.security.request_security import RequestSecurityMiddleware

# Setup logger
logger = logging.getLogger("recoverflow")

# Automatically initialize database tables on startup if in dev/test environment
try:
    Base.metadata.create_all(bind=engine)
except Exception as exc:
    logger.warning("Could not auto-create tables: %s", exc)

# Parse ALLOWED_ORIGINS environment variable
raw_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins: List[str] = [
    origin.strip() for origin in raw_origins.split(",") if origin.strip()
]

app: FastAPI = FastAPI(
    title="RecoverFlow API",
    version="0.1.0",
    description="Autonomous Revenue Recovery System API - Production Security Boundary",
)

app.add_middleware(RequestSecurityMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount V1 Router
app.include_router(api_v1_router)


# Global Exception Handlers
def _get_correlation_id(request: Request) -> str:
    return getattr(request.state, "correlation_id", "unknown")


@app.exception_handler(SecurityConfigurationError)
async def security_config_exception_handler(request: Request, exc: SecurityConfigurationError):
    corr_id = _get_correlation_id(request)
    logger.error("Security Configuration Error: %s", str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "SECURITY_CONFIGURATION_ERROR",
            "message": "Production security configuration error.",
            "correlation_id": corr_id,
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    corr_id = _get_correlation_id(request)
    detail = exc.detail
    if isinstance(detail, dict):
        error_code = detail.get("error") or detail.get("error_code") or "HTTP_ERROR"
        msg = detail.get("message") or "An error occurred."
        content = {
            "error": error_code,
            "message": msg,
            "detail": detail,
            "correlation_id": corr_id,
        }
    else:
        error_code = "HTTP_ERROR"
        msg = str(detail)
        content = {
            "error": error_code,
            "message": msg,
            "detail": detail,
            "correlation_id": corr_id,
        }

    headers = dict(exc.headers) if exc.headers else {}
    headers["X-Correlation-ID"] = corr_id

    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    corr_id = _get_correlation_id(request)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Invalid request parameters or payload.",
            "correlation_id": corr_id,
        },
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    corr_id = _get_correlation_id(request)
    logger.error("Database Error on %s: %s", request.url, str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "DATABASE_ERROR",
            "message": "A database operation failed safely.",
            "correlation_id": corr_id,
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    corr_id = _get_correlation_id(request)
    logger.error("Unhandled API exception on %s: %s", request.url, str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An internal server error occurred.",
            "correlation_id": corr_id,
        },
    )


@app.get("/")
def read_root() -> Dict[str, str]:
    """Root API identification endpoint."""
    return {
        "service": "recoverflow-api",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
def health_check() -> Dict[str, str]:
    """Service health check endpoint."""
    return {
        "status": "healthy",
        "service": "recoverflow-api",
        "version": "0.1.0",
    }
