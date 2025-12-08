"""Job schemas for job search and connector responses."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class JobType(str, Enum):
    """Job type classification."""

    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    TEMPORARY = "temporary"
    INTERNSHIP = "internship"


class JobSearchParams(BaseModel):
    """Parameters for searching jobs across connectors."""

    keywords: list[str] = Field(default_factory=list, description="Search keywords")
    location: str | None = Field(None, description="Location to search in")
    radius_km: int | None = Field(None, ge=1, le=500, description="Search radius in km")
    salary_min: int | None = Field(None, ge=0, description="Minimum salary")
    salary_max: int | None = Field(None, ge=0, description="Maximum salary")
    job_type: JobType | None = Field(None, description="Type of employment")
    remote: bool | None = Field(None, description="Remote work filter")
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=20, ge=1, le=100, description="Results per page")


class Job(BaseModel):
    """Job listing from a connector."""

    id: str = Field(..., description="Unique job ID from source")
    source: str = Field(..., description="Connector name that provided this job")
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    location: str = Field(..., description="Job location")
    description: str = Field(..., description="Job description")
    url: str = Field(..., description="URL to the job posting")
    salary_min: int | None = Field(None, description="Minimum salary")
    salary_max: int | None = Field(None, description="Maximum salary")
    salary_currency: str | None = Field(None, description="Salary currency code")
    job_type: JobType | None = Field(None, description="Type of employment")
    posted_at: datetime | None = Field(None, description="When the job was posted")
    expires_at: datetime | None = Field(None, description="When the job expires")
    raw_data: dict[str, Any] = Field(default_factory=dict, description="Original data from source")


class SearchResult(BaseModel):
    """Search results from a connector."""

    jobs: list[Job] = Field(default_factory=list, description="List of jobs")
    total_count: int = Field(..., ge=0, description="Total matching jobs")
    page: int = Field(..., ge=1, description="Current page")
    per_page: int = Field(..., ge=1, description="Results per page")
    has_more: bool = Field(..., description="Whether more results are available")


class ConnectorInfo(BaseModel):
    """Information about a job connector."""

    name: str = Field(..., description="Unique connector identifier")
    display_name: str = Field(..., description="Human-readable name")
    is_available: bool = Field(..., description="Whether the connector is configured")


class AggregatedSearchResult(BaseModel):
    """Aggregated search results from multiple connectors."""

    jobs: list[Job] = Field(default_factory=list, description="Combined job listings")
    total_count: int = Field(..., ge=0, description="Total jobs across all sources")
    page: int = Field(..., ge=1, description="Current page")
    per_page: int = Field(..., ge=1, description="Results per page")
    has_more: bool = Field(..., description="Whether more results are available")
    sources_searched: list[str] = Field(
        default_factory=list, description="Connectors that were searched"
    )
    errors: dict[str, str] = Field(default_factory=dict, description="Errors by connector name")
