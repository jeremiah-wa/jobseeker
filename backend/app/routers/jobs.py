"""Jobs router for job search API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.manager import ConnectorManager
from app.db.database import get_db
from app.db.models.user import User
from app.dependencies.auth import get_current_user
from app.dependencies.rate_limit import check_job_search_rate_limit
from app.schemas.job import (
    AggregatedSearchResult,
    ConnectorInfo,
    Job,
    JobSearchParams,
    JobType,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/search", response_model=AggregatedSearchResult)
async def search_jobs(
    current_user: Annotated[User, Depends(check_job_search_rate_limit)],
    db: Annotated[AsyncSession, Depends(get_db)],
    q: Annotated[str | None, Query(description="Search query keywords")] = None,
    location: Annotated[str | None, Query(description="Location to search in")] = None,
    radius: Annotated[int | None, Query(ge=1, le=500, description="Search radius in km")] = None,
    salary_min: Annotated[int | None, Query(ge=0, description="Minimum salary")] = None,
    salary_max: Annotated[int | None, Query(ge=0, description="Maximum salary")] = None,
    job_type: Annotated[JobType | None, Query(description="Type of employment")] = None,
    remote: Annotated[bool | None, Query(description="Remote work filter")] = None,
    sources: Annotated[
        str | None,
        Query(description="Comma-separated list of connector names (default: all)"),
    ] = None,
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description="Results per page")] = 20,
) -> AggregatedSearchResult:
    """Search for jobs across multiple connectors.

    Args:
        current_user: The authenticated user making the request.
        db: Database session.
        q: Search query keywords.
        location: Location to search in.
        radius: Search radius in km.
        salary_min: Minimum salary filter.
        salary_max: Maximum salary filter.
        job_type: Type of employment filter.
        remote: Remote work filter.
        sources: Comma-separated list of connector names to search.
        page: Page number for pagination.
        per_page: Number of results per page.

    Returns:
        Aggregated search results from all searched connectors.
    """
    # Parse keywords from query string
    keywords = q.split() if q else []

    # Parse sources list
    source_list = [s.strip() for s in sources.split(",")] if sources else None

    # Validate sources if provided
    if source_list:
        available_connectors = {c.name for c in ConnectorManager.available()}
        invalid_sources = set(source_list) - available_connectors
        if invalid_sources:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid sources: {', '.join(invalid_sources)}",
            )

    # Build search parameters
    params = JobSearchParams(
        keywords=keywords,
        location=location,
        radius_km=radius,
        salary_min=salary_min,
        salary_max=salary_max,
        job_type=job_type,
        remote=remote,
        page=page,
        per_page=per_page,
    )

    # Search across connectors
    results = await ConnectorManager.search_all(params, sources=source_list, db=db)
    return results


@router.get("/connectors", response_model=list[ConnectorInfo])
async def list_connectors(
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[ConnectorInfo]:
    """List all available job connectors.

    Args:
        current_user: The authenticated user making the request.

    Returns:
        List of connector info objects.
    """
    return ConnectorManager.list_connectors()


@router.get("/{source}/{job_id}", response_model=Job)
async def get_job_details(
    source: str,
    job_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
) -> Job:
    """Get detailed information about a specific job.

    Args:
        source: The connector name (e.g., 'adzuna').
        job_id: The job ID from the source.
        current_user: The authenticated user making the request.

    Returns:
        Full job details.

    Raises:
        HTTPException: If the connector or job is not found.
    """
    connector = ConnectorManager.get(source)
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Connector '{source}' not found",
        )

    if not connector.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Connector '{source}' is not available",
        )

    job = await connector.get_job_details(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{job_id}' not found in '{source}'",
        )

    return job
