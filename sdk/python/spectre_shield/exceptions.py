class ShieldError(Exception):
    """Base exception for all Shield SDK errors."""


class ShieldConnectionError(ShieldError):
    """Could not reach the Shield inspection endpoint."""


class ShieldBlockedError(ShieldError):
    """
    Raised when action=block and raise_on_block=True.
    Contains the full InspectionResult for logging.
    """
    def __init__(self, result):
        self.result = result
        super().__init__(
            f"Shield blocked the request. Violations: "
            + ", ".join(v.policy_name for v in result.violations)
        )


class ShieldTimeoutError(ShieldError):
    """Inspection endpoint did not respond within the configured timeout."""
