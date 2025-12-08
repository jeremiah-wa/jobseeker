"""Pydantic schemas."""

from app.schemas.auth import Token, TokenRefresh, UserLogin, UserRegister, UserResponse
from app.schemas.cv import (
    CVCreate,
    CVListResponse,
    CVParseResponse,
    CVResponse,
    CVUpdate,
    CVUploadResponse,
    Education,
    Experience,
    ParsedCV,
    ParsingStatusSchema,
)
from app.schemas.job import (
    AggregatedSearchResult,
    ConnectorInfo,
    Job,
    JobSearchParams,
    JobType,
    SearchResult,
)

__all__ = [
    # Auth
    "Token",
    "TokenRefresh",
    "UserLogin",
    "UserRegister",
    "UserResponse",
    # CV
    "CVCreate",
    "CVListResponse",
    "CVParseResponse",
    "CVResponse",
    "CVUpdate",
    "CVUploadResponse",
    "Education",
    "Experience",
    "ParsedCV",
    "ParsingStatusSchema",
    # Job
    "AggregatedSearchResult",
    "ConnectorInfo",
    "Job",
    "JobSearchParams",
    "JobType",
    "SearchResult",
]
