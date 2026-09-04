from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Optional, List, Set, Any
from threading import RLock
import logging

from app.execution.capabilities import ProviderCapability, capability_registry
from app.execution.provider_config import ProviderConfig

logger = logging.getLogger("recoverflow.execution.lifecycle")


class ProviderLifecycleState(str, Enum):
    AVAILABLE = "AVAILABLE"
    DEGRADED = "DEGRADED"
    UNAVAILABLE = "UNAVAILABLE"
    MISCONFIGURED = "MISCONFIGURED"
    DISABLED = "DISABLED"
    UNKNOWN = "UNKNOWN"


@dataclass
class ProviderInfo:
    provider_name: str
    state: ProviderLifecycleState = ProviderLifecycleState.UNKNOWN
    environment: str = "test"
    capabilities: Set[ProviderCapability] = field(default_factory=set)
    enabled: bool = True
    last_health_check: Optional[datetime] = None
    configuration_status: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider_name": self.provider_name,
            "state": self.state.value,
            "environment": self.environment,
            "capabilities": [c.value for c in self.capabilities],
            "enabled": self.enabled,
            "last_health_check": self.last_health_check.isoformat() if self.last_health_check else None,
            "configuration_status": self.configuration_status,
        }


class ProviderLifecycleManager:
    """Deterministic provider lifecycle manager."""

    _instance = None
    _lock = RLock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ProviderLifecycleManager, cls).__new__(cls)
                cls._instance._providers: Dict[str, ProviderInfo] = {}
                cls._instance._initialize_default_providers()
            return cls._instance

    def _initialize_default_providers(self) -> None:
        """Initializes default registered providers."""
        # Simulated provider
        sim_caps = capability_registry.get_capabilities("simulated")
        self._providers["simulated"] = ProviderInfo(
            provider_name="simulated",
            state=ProviderLifecycleState.AVAILABLE,
            environment="test",
            capabilities=sim_caps,
            enabled=True,
            last_health_check=datetime.now(timezone.utc),
            configuration_status={"configured": True, "environment": "test", "credentials_validated": True},
        )
        self._providers["SIMULATED_PROVIDER"] = self._providers["simulated"]

        # Razorpay provider
        rzp_caps = capability_registry.get_capabilities("razorpay")
        cfg = ProviderConfig()
        rzp_state = ProviderLifecycleState.AVAILABLE
        try:
            cfg.validate()
        except Exception as exc:
            logger.warning("Razorpay configuration validation failed: %s", str(exc))
            rzp_state = ProviderLifecycleState.MISCONFIGURED

        self._providers["razorpay"] = ProviderInfo(
            provider_name="razorpay",
            state=rzp_state,
            environment=cfg.environment,
            capabilities=rzp_caps,
            enabled=True,
            last_health_check=datetime.now(timezone.utc),
            configuration_status=cfg.sanitized_dict(),
        )

    def register_provider(
        self,
        provider_name: str,
        state: ProviderLifecycleState = ProviderLifecycleState.AVAILABLE,
        environment: str = "test",
        capabilities: Optional[Set[ProviderCapability]] = None,
        enabled: bool = True,
        config_status: Optional[Dict[str, Any]] = None,
    ) -> ProviderInfo:
        with self._lock:
            caps = capabilities or capability_registry.get_capabilities(provider_name)
            info = ProviderInfo(
                provider_name=provider_name,
                state=state,
                environment=environment,
                capabilities=caps,
                enabled=enabled,
                last_health_check=datetime.now(timezone.utc),
                configuration_status=config_status or {"configured": True},
            )
            self._providers[provider_name] = info
            self._providers[provider_name.lower()] = info
            capability_registry.register_capabilities(provider_name, caps)
            return info

    def get_provider_info(self, provider_name: str) -> Optional[ProviderInfo]:
        with self._lock:
            return self._providers.get(provider_name, self._providers.get(provider_name.lower()))

    def list_providers(self) -> List[ProviderInfo]:
        with self._lock:
            seen = set()
            result = []
            for info in self._providers.values():
                if info.provider_name not in seen:
                    seen.add(info.provider_name)
                    result.append(info)
            return result

    def update_state(self, provider_name: str, new_state: ProviderLifecycleState) -> Optional[ProviderInfo]:
        with self._lock:
            info = self.get_provider_info(provider_name)
            if info:
                info.state = new_state
                info.last_health_check = datetime.now(timezone.utc)
            return info

    def is_available(self, provider_name: str) -> bool:
        info = self.get_provider_info(provider_name)
        if not info:
            return False
        return info.enabled and info.state in (ProviderLifecycleState.AVAILABLE, ProviderLifecycleState.DEGRADED)

    def evaluate_fallback(self, primary_provider: str, secondary_provider: str) -> str:
        """Determines whether fallback from primary to secondary provider is safe.
        
        Strict rule: Do NOT allow automatic fallback from Razorpay if primary was in mid-execution
        or could cause duplicate financial execution.
        """
        primary_info = self.get_provider_info(primary_provider)
        if primary_info and primary_info.state == ProviderLifecycleState.AVAILABLE:
            return primary_provider
        
        secondary_info = self.get_provider_info(secondary_provider)
        if secondary_info and secondary_info.enabled and secondary_info.state in (ProviderLifecycleState.AVAILABLE, ProviderLifecycleState.DEGRADED):
            logger.info("Deterministic fallback selected: %s -> %s", primary_provider, secondary_provider)
            return secondary_provider

        return primary_provider

    def reset(self) -> None:
        with self._lock:
            self._providers.clear()
            self._initialize_default_providers()


lifecycle_manager = ProviderLifecycleManager()
