from http import HTTPStatus


class SpectreError(Exception):
    """Base exception for all Spectre Security application errors."""

    status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR
    code: str = "internal_error"
    message: str = "An unexpected error occurred"

    def __init__(self, message: str | None = None, code: str | None = None):
        self.message = message or self.__class__.message
        self.code = code or self.__class__.code
        super().__init__(self.message)


# ── 400 Bad Request ────────────────────────────────────────────────────────

class ValidationError(SpectreError):
    status_code = HTTPStatus.BAD_REQUEST
    code = "validation_error"
    message = "Request validation failed"


class InvalidAttackSuite(SpectreError):
    status_code = HTTPStatus.BAD_REQUEST
    code = "invalid_attack_suite"
    message = "The specified attack suite does not exist"


class PolicyConflict(SpectreError):
    status_code = HTTPStatus.BAD_REQUEST
    code = "policy_conflict"
    message = "A policy with this configuration already exists"


# ── 401 Unauthorized ───────────────────────────────────────────────────────

class AuthenticationError(SpectreError):
    status_code = HTTPStatus.UNAUTHORIZED
    code = "authentication_error"
    message = "Authentication required"


class InvalidApiKey(SpectreError):
    status_code = HTTPStatus.UNAUTHORIZED
    code = "invalid_api_key"
    message = "The provided API key is invalid or has been revoked"


# ── 403 Forbidden ──────────────────────────────────────────────────────────

class PermissionDenied(SpectreError):
    status_code = HTTPStatus.FORBIDDEN
    code = "permission_denied"
    message = "You do not have permission to perform this action"


# ── 404 Not Found ──────────────────────────────────────────────────────────

class NotFound(SpectreError):
    status_code = HTTPStatus.NOT_FOUND
    code = "not_found"
    message = "The requested resource was not found"


class ScanNotFound(NotFound):
    code = "scan_not_found"
    message = "Scan not found"


class PolicyNotFound(NotFound):
    code = "policy_not_found"
    message = "Policy not found"


class ReportNotFound(NotFound):
    code = "report_not_found"
    message = "Report not found or not yet generated"


# ── 409 Conflict ───────────────────────────────────────────────────────────

class ScanAlreadyRunning(SpectreError):
    status_code = HTTPStatus.CONFLICT
    code = "scan_already_running"
    message = "A scan against this target is already in progress"


# ── 422 Unprocessable ──────────────────────────────────────────────────────

class InspectionTimeout(SpectreError):
    status_code = HTTPStatus.UNPROCESSABLE_ENTITY
    code = "inspection_timeout"
    message = "Shield inspection exceeded the maximum allowed latency"


# ── 502 Bad Gateway ────────────────────────────────────────────────────────

class TargetUnreachable(SpectreError):
    status_code = HTTPStatus.BAD_GATEWAY
    code = "target_unreachable"
    message = "The scan target endpoint could not be reached"


class LLMProviderError(SpectreError):
    status_code = HTTPStatus.BAD_GATEWAY
    code = "llm_provider_error"
    message = "The LLM provider returned an error"
