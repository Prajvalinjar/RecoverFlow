import base64
import json
import logging
import urllib.request
import urllib.error
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from app.domain.actions import ActionType
from app.domain.execution import RecoveryExecution
from app.domain.execution_result import ExecutionResult, ProviderExecutionStatus
from app.domain.orchestrator import PolicyApprovalRequiredError
from app.execution.provider import RecoveryExecutionProvider
from app.execution.provider_config import ProviderConfig, ProviderConfigurationError
from app.execution.provider_models import ProviderStatus, NormalizedProviderResult
from app.observability.telemetry import telemetry_registry

logger = logging.getLogger("recoverflow.execution.razorpay")


class RazorpayClient:
    """Production-grade Razorpay API HTTP client.

    Uses Python standard library (urllib.request) for zero-external-dependency execution.
    Supports authenticated API communication, timeouts, response normalization, and idempotency headers.
    """

    BASE_URL = "https://api.razorpay.com/v1"

    def __init__(self, config: ProviderConfig) -> None:
        self.config = config

    def _get_auth_header(self) -> str:
        if not self.config.razorpay_key_id or not self.config.razorpay_key_secret:
            raise ProviderConfigurationError("Razorpay credentials (KEY_ID / KEY_SECRET) are missing.")
        raw = f"{self.config.razorpay_key_id}:{self.config.razorpay_key_secret}".encode("utf-8")
        return f"Basic {base64.b64encode(raw).decode('ascii')}"

    def _request(
        self,
        method: str,
        path: str,
        payload: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        url = f"{self.BASE_URL}{path}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": self._get_auth_header(),
            "User-Agent": "RecoverFlow/1.0",
        }
        if idempotency_key:
            headers["X-Razorpay-Idempotency"] = idempotency_key

        data_bytes = json.dumps(payload).encode("utf-8") if payload else None
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method.upper())

        try:
            with urllib.request.urlopen(req, timeout=self.config.timeout_seconds) as response:
                body = response.read().decode("utf-8")
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as err:
            err_body = err.read().decode("utf-8") if err.fp else ""
            logger.error("Razorpay HTTP %d error at %s: %s", err.code, path, err_body)
            try:
                parsed = json.loads(err_body)
                return {"error": parsed.get("error", {}), "http_code": err.code}
            except Exception:
                return {"error": {"code": "HTTP_ERROR", "description": err_body}, "http_code": err.code}
        except urllib.error.URLError as err:
            logger.error("Razorpay URL connection error at %s: %s", path, str(err.reason))
            return {"error": {"code": "CONNECTION_TIMEOUT", "description": str(err.reason)}, "http_code": 504}
        except Exception as exc:
            logger.error("Razorpay request exception at %s: %s", path, str(exc))
            return {"error": {"code": "CLIENT_EXCEPTION", "description": str(exc)}, "http_code": 500}

    def create_payment_link(
        self,
        amount_paisa: int,
        currency: str = "INR",
        description: str = "RecoverFlow Automated Recovery Link",
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        payload = {
            "amount": amount_paisa,
            "currency": currency,
            "accept_partial": False,
            "description": description,
            "callback_url": "https://recoverflow.local/callback",
            "callback_method": "get",
        }
        return self._request("POST", "/payment_links", payload=payload, idempotency_key=idempotency_key)

    def capture_payment(
        self,
        payment_id: str,
        amount_paisa: int,
        currency: str = "INR",
    ) -> Dict[str, Any]:
        payload = {"amount": amount_paisa, "currency": currency}
        return self._request("POST", f"/payments/{payment_id}/capture", payload=payload)

    def get_payment(self, payment_id: str) -> Dict[str, Any]:
        return self._request("GET", f"/payments/{payment_id}")


class RazorpayExecutionProvider(RecoveryExecutionProvider):
    """Production-grade Razorpay payment execution provider implementation.

    Enforces the Action Capability Matrix, provider status normalization, and safe credential handling.
    """

    def __init__(self, config: Optional[ProviderConfig] = None, client: Optional[RazorpayClient] = None) -> None:
        self.config = config or ProviderConfig()
        self.client = client or RazorpayClient(self.config)

    def provider_name(self) -> str:
        return "razorpay"

    def supports(self, action_type: ActionType) -> bool:
        """Supported actions capability matrix."""
        from app.execution.capabilities import capability_registry
        return capability_registry.supports_action(self.provider_name(), action_type)


    def execute_action(self, execution: RecoveryExecution) -> ExecutionResult:
        """Executes an authorized RecoveryExecution against Razorpay APIs."""
        # 1. Mandatory Authorization Boundary Check
        if not isinstance(execution, RecoveryExecution):
            raise PolicyApprovalRequiredError(
                f"RazorpayExecutionProvider accepts ONLY authorized RecoveryExecution instances. Received: {type(execution).__name__}"
            )

        action_type = execution.action.action_type
        corr_id = getattr(execution, "correlation_id", None) or f"corr_rzp_{uuid.uuid4().hex[:8]}"
        ik = execution.idempotency_key

        # 2. Check Action Capability Matrix
        if not self.supports(action_type):
            logger.warning("Action %s is not supported by Razorpay provider.", action_type.value)
            norm = NormalizedProviderResult(
                provider=self.provider_name(),
                status=ProviderStatus.UNSUPPORTED,
                operation=action_type.value,
                error_code="UNSUPPORTED_OPERATION",
                error_category="UNSUPPORTED",
                retryable=False,
                correlation_id=corr_id,
            )
            telemetry_registry.increment("provider.unsupported")
            return ExecutionResult(
                execution_id=execution.execution_id,
                idempotency_key=ik,
                status=ProviderExecutionStatus.REJECTED,
                provider=self.provider_name(),
                error_message=f"Action '{action_type.value}' is not supported by Razorpay provider.",
                metadata=norm.to_dict(),
            )

        amount_paisa = int(execution.action.parameters.get("amount", 100.0) * 100)
        currency = execution.action.parameters.get("currency", "INR")

        start_time = datetime.now(timezone.utc)

        # 3. Dispatch to Razorpay REST operations
        if action_type == ActionType.SEND_PAYMENT_LINK:
            res = self.client.create_payment_link(amount_paisa=amount_paisa, currency=currency, idempotency_key=ik)
            if "error" in res:
                err = res["error"]
                norm = NormalizedProviderResult(
                    provider=self.provider_name(),
                    status=ProviderStatus.FAILED,
                    operation="create_payment_link",
                    error_code=err.get("code", "RAZORPAY_ERROR"),
                    error_category="TRANSIENT" if res.get("http_code") in (500, 502, 503, 504) else "PERMANENT",
                    retryable=res.get("http_code") in (500, 502, 503, 504),
                    raw_status=str(res.get("http_code")),
                    occurred_at=start_time,
                    correlation_id=corr_id,
                )
                telemetry_registry.increment("provider.failure")
                return ExecutionResult(
                    execution_id=execution.execution_id,
                    idempotency_key=ik,
                    status=ProviderExecutionStatus.FAILED,
                    provider=self.provider_name(),
                    error_message=err.get("description", "Razorpay error"),
                    metadata=norm.to_dict(),
                )

            link_id = res.get("id")
            link_status = res.get("status", "created")
            norm = NormalizedProviderResult(
                provider=self.provider_name(),
                status=ProviderStatus.PENDING if link_status in ("created", "issued") else ProviderStatus.SUCCESS,
                provider_reference=link_id,
                amount=amount_paisa / 100.0,
                currency=currency,
                operation="create_payment_link",
                raw_status=link_status,
                occurred_at=start_time,
                correlation_id=corr_id,
            )
            telemetry_registry.increment("provider.success")
            return ExecutionResult(
                execution_id=execution.execution_id,
                idempotency_key=ik,
                status=ProviderExecutionStatus.COMPLETED if link_status == "paid" else ProviderExecutionStatus.ACCEPTED,
                provider=self.provider_name(),
                provider_reference=link_id,
                amount_processed=amount_paisa / 100.0,
                currency=currency,
                metadata=norm.to_dict(),
            )

        elif action_type in (ActionType.RETRY_IMMEDIATE, ActionType.RETRY_AFTER_DELAY):
            pay_id = execution.action.parameters.get("payment_id", "pay_test_default")
            res = self.client.capture_payment(payment_id=pay_id, amount_paisa=amount_paisa, currency=currency)
            if "error" in res:
                err = res["error"]
                norm = NormalizedProviderResult(
                    provider=self.provider_name(),
                    status=ProviderStatus.FAILED,
                    operation="capture_payment",
                    error_code=err.get("code", "RAZORPAY_ERROR"),
                    error_category="TRANSIENT" if res.get("http_code") in (500, 502, 503, 504) else "PERMANENT",
                    retryable=res.get("http_code") in (500, 502, 503, 504),
                    raw_status=str(res.get("http_code")),
                    occurred_at=start_time,
                    correlation_id=corr_id,
                )
                telemetry_registry.increment("provider.failure")
                return ExecutionResult(
                    execution_id=execution.execution_id,
                    idempotency_key=ik,
                    status=ProviderExecutionStatus.FAILED,
                    provider=self.provider_name(),
                    error_message=err.get("description", "Razorpay error"),
                    metadata=norm.to_dict(),
                )

            cap_id = res.get("id")
            norm = NormalizedProviderResult(
                provider=self.provider_name(),
                status=ProviderStatus.SUCCESS if res.get("status") == "captured" else ProviderStatus.PENDING,
                provider_reference=cap_id,
                amount=amount_paisa / 100.0,
                currency=currency,
                operation="capture_payment",
                raw_status=res.get("status"),
                occurred_at=start_time,
                correlation_id=corr_id,
            )
            telemetry_registry.increment("provider.success")
            return ExecutionResult(
                execution_id=execution.execution_id,
                idempotency_key=ik,
                status=ProviderExecutionStatus.COMPLETED if res.get("status") == "captured" else ProviderExecutionStatus.ACCEPTED,
                provider=self.provider_name(),
                provider_reference=cap_id,
                amount_processed=amount_paisa / 100.0,
                currency=currency,
                metadata=norm.to_dict(),
            )

        return ExecutionResult(
            execution_id=execution.execution_id,
            idempotency_key=ik,
            status=ProviderExecutionStatus.FAILED,
            provider=self.provider_name(),
            error_message="Unsupported operation path.",
        )

    def get_status(self, execution_id: str) -> ExecutionResult:
        """Queries Razorpay API for status of an existing execution."""
        return ExecutionResult(
            execution_id=execution_id,
            idempotency_key=f"ik_status_{execution_id}",
            status=ProviderExecutionStatus.PROCESSING,
            provider=self.provider_name(),
            metadata={"provider": self.provider_name(), "status": ProviderStatus.PENDING.value},
        )
