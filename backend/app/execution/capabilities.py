from enum import Enum
from typing import Set, Dict, Optional, List
from threading import RLock
import logging

from app.domain.actions import ActionType

logger = logging.getLogger("recoverflow.execution.capabilities")


class ProviderCapability(str, Enum):
    SEND_PAYMENT_LINK = "SEND_PAYMENT_LINK"
    RETRY_IMMEDIATE = "RETRY_IMMEDIATE"
    RETRY_AFTER_DELAY = "RETRY_AFTER_DELAY"
    SEND_PAYMENT_REMINDER = "SEND_PAYMENT_REMINDER"
    ESCALATE_TO_MERCHANT = "ESCALATE_TO_MERCHANT"
    STOP_RECOVERY = "STOP_RECOVERY"


# Map domain ActionType to ProviderCapability
ACTION_TO_CAPABILITY_MAP: Dict[ActionType, ProviderCapability] = {
    ActionType.SEND_PAYMENT_LINK: ProviderCapability.SEND_PAYMENT_LINK,
    ActionType.RETRY_IMMEDIATE: ProviderCapability.RETRY_IMMEDIATE,
    ActionType.RETRY_AFTER_DELAY: ProviderCapability.RETRY_AFTER_DELAY,
    ActionType.SEND_PAYMENT_REMINDER: ProviderCapability.SEND_PAYMENT_REMINDER,
    ActionType.ESCALATE_TO_MERCHANT: ProviderCapability.ESCALATE_TO_MERCHANT,
    ActionType.STOP_RECOVERY: ProviderCapability.STOP_RECOVERY,
}


class ProviderCapabilityRegistry:
    """Thread-safe, provider-neutral capability registry."""

    _instance = None
    _lock = RLock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ProviderCapabilityRegistry, cls).__new__(cls)
                cls._instance._registry: Dict[str, Set[ProviderCapability]] = {}
                cls._instance._initialize_default_capabilities()
            return cls._instance

    def _initialize_default_capabilities(self) -> None:
        """Registers default capabilities for built-in providers."""
        # Simulated provider supports all capabilities
        self.register_capabilities(
            "SIMULATED_PROVIDER",
            {
                ProviderCapability.SEND_PAYMENT_LINK,
                ProviderCapability.RETRY_IMMEDIATE,
                ProviderCapability.RETRY_AFTER_DELAY,
                ProviderCapability.SEND_PAYMENT_REMINDER,
                ProviderCapability.ESCALATE_TO_MERCHANT,
                ProviderCapability.STOP_RECOVERY,
            },
        )
        self.register_capabilities(
            "simulated",
            {
                ProviderCapability.SEND_PAYMENT_LINK,
                ProviderCapability.RETRY_IMMEDIATE,
                ProviderCapability.RETRY_AFTER_DELAY,
                ProviderCapability.SEND_PAYMENT_REMINDER,
                ProviderCapability.ESCALATE_TO_MERCHANT,
                ProviderCapability.STOP_RECOVERY,
            },
        )
        # Razorpay supports PAYMENT_LINK, RETRY_IMMEDIATE, RETRY_AFTER_DELAY
        self.register_capabilities(
            "razorpay",
            {
                ProviderCapability.SEND_PAYMENT_LINK,
                ProviderCapability.RETRY_IMMEDIATE,
                ProviderCapability.RETRY_AFTER_DELAY,
            },
        )

    def register_capabilities(self, provider_name: str, capabilities: Set[ProviderCapability]) -> None:
        with self._lock:
            self._registry[provider_name.lower()] = set(capabilities)
            self._registry[provider_name] = set(capabilities)

    def get_capabilities(self, provider_name: str) -> Set[ProviderCapability]:
        with self._lock:
            caps = self._registry.get(provider_name, self._registry.get(provider_name.lower(), set()))
            return set(caps)

    def supports(self, provider_name: str, capability: ProviderCapability) -> bool:
        with self._lock:
            caps = self._registry.get(provider_name, self._registry.get(provider_name.lower(), set()))
            return capability in caps

    def supports_action(self, provider_name: str, action_type: ActionType) -> bool:
        cap = ACTION_TO_CAPABILITY_MAP.get(action_type)
        if not cap:
            return False
        return self.supports(provider_name, cap)

    def reset(self) -> None:
        with self._lock:
            self._registry.clear()
            self._initialize_default_capabilities()


capability_registry = ProviderCapabilityRegistry()
