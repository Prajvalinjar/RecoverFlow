import hmac
from enum import Enum
from typing import Optional
from abc import ABC, abstractmethod
from fastapi import Header, HTTPException, status

from app.security.config import get_security_config, SecurityConfigurationError


class OperationalRole(str, Enum):
    VIEWER = "VIEWER"
    OPERATOR = "OPERATOR"
    ADMIN = "ADMIN"


class OperationsAuthenticator(ABC):
    @abstractmethod
    def authenticate(self, key: Optional[str], role: Optional[str]) -> OperationalRole:
        pass


class ApiKeyOperationsAuthenticator(OperationsAuthenticator):
    """Production-hardened API Key Operations Authenticator with constant-time comparison."""

    def __init__(self, valid_key: Optional[str] = None) -> None:
        self.config = get_security_config()
        self.valid_key = valid_key or self.config.operations_api_key

    def authenticate(self, key: Optional[str], role: Optional[str]) -> OperationalRole:
        if not key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "AUTHENTICATION_FAILED", "message": "Missing X-Operations-Key header."},
            )

        if not hmac.compare_digest(key, self.valid_key):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "AUTHENTICATION_FAILED", "message": "Invalid X-Operations-Key."},
            )

        role_str = (role or "VIEWER").upper()
        try:
            op_role = OperationalRole(role_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "INVALID_ROLE", "message": f"Operational role '{role}' is invalid."},
            )

        if op_role.value not in self.config.allowed_operations_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "FORBIDDEN", "message": f"Role '{op_role.value}' is not permitted."},
            )

        return op_role


class DevelopmentOperationsAuthenticator(OperationsAuthenticator):
    """Development Operations Authenticator."""

    def __init__(self, valid_key: Optional[str] = None) -> None:
        self.config = get_security_config()
        self.valid_key = valid_key or self.config.operations_api_key

    def authenticate(self, key: Optional[str], role: Optional[str]) -> OperationalRole:
        if self.config.environment == "production":
            raise SecurityConfigurationError("DevelopmentOperationsAuthenticator is blocked in production mode.")

        if not key or not hmac.compare_digest(key, self.valid_key):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "AUTHENTICATION_FAILED", "message": "Invalid or missing X-Operations-Key."},
            )

        role_str = (role or "VIEWER").upper()
        try:
            return OperationalRole(role_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "INVALID_ROLE", "message": f"Role '{role}' is invalid."},
            )


def get_authenticator() -> OperationsAuthenticator:
    config = get_security_config()
    if config.environment == "production":
        return ApiKeyOperationsAuthenticator()
    return ApiKeyOperationsAuthenticator()


def verify_operations_read(
    x_operations_key: Optional[str] = Header(None, alias="X-Operations-Key"),
    x_operations_role: Optional[str] = Header(None, alias="X-Operations-Role"),
) -> OperationalRole:
    """Dependency verifying read access (VIEWER, OPERATOR, or ADMIN)."""
    authenticator = get_authenticator()
    role = authenticator.authenticate(x_operations_key, x_operations_role)
    return role


def verify_operations_write(
    x_operations_key: Optional[str] = Header(None, alias="X-Operations-Key"),
    x_operations_role: Optional[str] = Header(None, alias="X-Operations-Role"),
) -> OperationalRole:
    """Dependency verifying operational mutation access (OPERATOR or ADMIN required)."""
    authenticator = get_authenticator()
    role = authenticator.authenticate(x_operations_key, x_operations_role)
    if role not in (OperationalRole.OPERATOR, OperationalRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "FORBIDDEN", "message": f"Role '{role.value}' cannot perform operational mutations. OPERATOR or ADMIN required."},
        )
    return role


def verify_operations_admin(
    x_operations_key: Optional[str] = Header(None, alias="X-Operations-Key"),
    x_operations_role: Optional[str] = Header(None, alias="X-Operations-Role"),
) -> OperationalRole:
    """Dependency verifying administrative access (ADMIN required)."""
    authenticator = get_authenticator()
    role = authenticator.authenticate(x_operations_key, x_operations_role)
    if role != OperationalRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "FORBIDDEN", "message": f"Role '{role.value}' cannot perform admin actions. ADMIN required."},
        )
    return role
