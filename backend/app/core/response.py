from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.exceptions import SpectreError


class Meta(BaseModel):
    request_id: str | None = None
    page: int | None = None
    page_size: int | None = None
    total: int | None = None
    cursor: str | None = None


class ApiResponse(BaseModel):
    data: Any = None
    error: dict | None = None
    meta: Meta = Meta()


def ok(
    data: Any,
    *,
    request_id: str | None = None,
    status_code: int = 200,
    meta: dict | None = None,
) -> JSONResponse:
    payload = ApiResponse(
        data=data,
        error=None,
        meta=Meta(request_id=request_id, **(meta or {})),
    )
    return JSONResponse(content=payload.model_dump(exclude_none=True), status_code=status_code)


def created(data: Any, *, request_id: str | None = None) -> JSONResponse:
    return ok(data, request_id=request_id, status_code=201)


def no_content() -> JSONResponse:
    return JSONResponse(content=None, status_code=204)


def error(
    code: str,
    message: str,
    *,
    status_code: int = 400,
    request_id: str | None = None,
) -> JSONResponse:
    payload = ApiResponse(
        data=None,
        error={"code": code, "message": message},
        meta=Meta(request_id=request_id),
    )
    return JSONResponse(
        content=payload.model_dump(exclude_none=True),
        status_code=status_code,
    )


async def envelope_error_handler(request: Request, exc: SpectreError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    return error(
        code=exc.code,
        message=exc.message,
        status_code=exc.status_code,
        request_id=request_id,
    )
