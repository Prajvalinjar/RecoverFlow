from typing import Optional

from app.execution.provider import RecoveryExecutionProvider
from app.execution.simulated_provider import SimulatedExecutionProvider
from app.execution.provider_config import ProviderConfig, ProviderConfigurationError


def get_active_provider(config: Optional[ProviderConfig] = None) -> RecoveryExecutionProvider:
    """Factory function resolving the active RecoveryExecutionProvider implementation based on configuration.

    Guarantees default fallback to SimulatedExecutionProvider for local test safety.
    """
    cfg = config or ProviderConfig()
    cfg.validate()

    if cfg.provider_type == "simulated":
        return SimulatedExecutionProvider()
    elif cfg.provider_type == "razorpay":
        from app.execution.razorpay import RazorpayExecutionProvider
        return RazorpayExecutionProvider(config=cfg)
    else:
        raise ProviderConfigurationError(f"Unsupported provider_type '{cfg.provider_type}'.")
