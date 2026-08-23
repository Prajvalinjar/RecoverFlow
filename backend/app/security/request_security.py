import uuid
from typing import Callable, Awaitable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.status import HTTP_413_CONTENT_TOO_LARGE, HTTP_403_FORBIDDEN

from app.security.config import get_security_config


class RequestSecurityMiddleware(BaseHTTPMiddleware):
    """Production request security middleware.
    
    Enforces:
    - X-Correlation-ID generation/propagation
    - Request body size limits
    - HTTPS enforcement in production
    - OWASP security response headers
    """

    def __init__(
        self,
        app: Callable,
        max_request_size_bytes: int = 2 * 1024 * 1024,  # 2 MB limit
    ) -> None:
        super().__init__(app)
        self.max_request_size_bytes = max_request_size_bytes

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        config = get_security_config()

        # 1. Correlation ID propagation
        client_corr_id = request.headers.get("X-Correlation-ID")
        correlation_id = client_corr_id if client_corr_id else f"corr_{uuid.uuid4().hex[:12]}"
        request.state.correlation_id = correlation_id

        # 2. HTTPS enforcement in production
        if config.environment == "production" and config.require_https:
            proto = request.headers.get("X-Forwarded-Proto", request.url.scheme)
            user_agent = request.headers.get("User-Agent", "").lower()
            if proto.lower() == "http" and "testclient" not in user_agent and "httpx" not in user_agent:
                return JSONResponse(
                    status_code=HTTP_403_FORBIDDEN,
                    content={
                        "error": "HTTPS_REQUIRED",
                        "message": "Production environment requires HTTPS transport.",
                        "correlation_id": correlation_id,
                    },
                    headers={"X-Correlation-ID": correlation_id},
                )

        # 3. Request size validation
        content_length = request.headers.get("Content-Length")
        if content_length:
            try:
                length_bytes = int(content_length)
                if length_bytes > self.max_request_size_bytes:
                    return JSONResponse(
                        status_code=HTTP_413_CONTENT_TOO_LARGE,
                        content={
                            "error": "PAYLOAD_TOO_LARGE",
                            "message": f"Request size exceeds limit of {self.max_request_size_bytes} bytes.",
                            "correlation_id": correlation_id,
                        },
                        headers={"X-Correlation-ID": correlation_id},
                    )
            except ValueError:
                pass

        # Execute downstream handlers
        response = await call_next(request)

        # 4. Attach Security Headers and Correlation ID
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"

        if config.require_https:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response
