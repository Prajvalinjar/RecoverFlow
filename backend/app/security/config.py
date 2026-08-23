import os
from dataclasses import dataclass, field
from typing import List, Optional


class SecurityConfigurationError(Exception):
    """Raised when security configuration is invalid or missing in production."""
    pass


DEV_WEBHOOK_SECRET_DEFAULT = "dev_webhook_secret_key"
DEV_OPERATIONS_KEY_DEFAULT = "dev_ops_secret_key"


@dataclass
class SecurityConfig:
    webhook_secret: str
    operations_api_key: str
    webhook_timestamp_tolerance_seconds: int = 300
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60
    environment: str = "development"
    require_https: bool = False
    allowed_operations_roles: List[str] = field(default_factory=lambda: ["VIEWER", "OPERATOR", "ADMIN"])

    @classmethod
    def load_from_env(cls) -> "SecurityConfig":
        env = os.getenv("RECOVERFLOW_ENVIRONMENT", os.getenv("ENVIRONMENT", "development")).lower()
        webhook_secret = os.getenv("RECOVERFLOW_WEBHOOK_SECRET", os.getenv("EVENT_AUTH_SECRET"))
        operations_key = os.getenv("RECOVERFLOW_OPERATIONS_KEY")
        tolerance_str = os.getenv("RECOVERFLOW_WEBHOOK_TOLERANCE_SECONDS", "300")
        rate_req_str = os.getenv("RECOVERFLOW_RATE_LIMIT_REQUESTS", "100")
        rate_win_str = os.getenv("RECOVERFLOW_RATE_LIMIT_WINDOW_SECONDS", "60")
        require_https_str = os.getenv("RECOVERFLOW_REQUIRE_HTTPS", "")

        try:
            tolerance = int(tolerance_str)
        except ValueError:
            tolerance = 300

        try:
            rate_requests = int(rate_req_str)
        except ValueError:
            rate_requests = 100

        try:
            rate_window = int(rate_win_str)
        except ValueError:
            rate_window = 60

        if require_https_str:
            require_https = require_https_str.lower() in ("true", "1", "yes")
        else:
            require_https = (env == "production")

        rf_env = os.getenv("RECOVERFLOW_ENVIRONMENT")
        if rf_env and rf_env.lower() == "production":
            if not webhook_secret or webhook_secret == DEV_WEBHOOK_SECRET_DEFAULT:
                raise SecurityConfigurationError("Production mode requires a secure RECOVERFLOW_WEBHOOK_SECRET environment variable.")
            if not operations_key or operations_key == DEV_OPERATIONS_KEY_DEFAULT:
                raise SecurityConfigurationError("Production mode requires a secure RECOVERFLOW_OPERATIONS_KEY environment variable.")
        else:
            if not webhook_secret:
                webhook_secret = DEV_WEBHOOK_SECRET_DEFAULT
            if not operations_key:
                operations_key = DEV_OPERATIONS_KEY_DEFAULT

        return cls(
            webhook_secret=webhook_secret,
            operations_api_key=operations_key,
            webhook_timestamp_tolerance_seconds=tolerance,
            rate_limit_requests=rate_requests,
            rate_limit_window_seconds=rate_window,
            environment=env,
            require_https=require_https,
        )


_security_config_instance: Optional[SecurityConfig] = None


def get_security_config() -> SecurityConfig:
    global _security_config_instance
    current_env = os.getenv("RECOVERFLOW_ENVIRONMENT", os.getenv("ENVIRONMENT", "development")).lower()
    if _security_config_instance is None or _security_config_instance.environment != current_env:
        _security_config_instance = SecurityConfig.load_from_env()
    return _security_config_instance


def reset_security_config() -> None:
    global _security_config_instance
    _security_config_instance = None
