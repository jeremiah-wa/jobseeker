"""Adzuna job connector implementation."""

import logging
from datetime import datetime
from typing import Any

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings
from app.connectors.base import (
    ConnectorAPIError,
    ConnectorAuthError,
    ConnectorRateLimitError,
    JobConnector,
)
from app.schemas.job import Job, JobSearchParams, JobType, SearchResult

logger = logging.getLogger(__name__)

# Adzuna contract_type to JobType mapping
CONTRACT_TYPE_MAP: dict[str | None, JobType | None] = {
    "permanent": JobType.FULL_TIME,
    "full_time": JobType.FULL_TIME,
    "part_time": JobType.PART_TIME,
    "contract": JobType.CONTRACT,
    "temporary": JobType.TEMPORARY,
    None: None,
}


class AdzunaConnector(JobConnector):
    """Job connector for Adzuna API.

    Adzuna provides job listings from multiple countries with a simple REST API.
    Authentication is via app_id and app_key query parameters.

    API Docs: https://developer.adzuna.com/overview
    """

    BASE_URL = "https://api.adzuna.com/v1/api/jobs"

    def __init__(
        self,
        app_id: str | None = None,
        app_key: str | None = None,
        country: str | None = None,
    ) -> None:
        """Initialize the Adzuna connector.

        Args:
            app_id: Adzuna application ID. Defaults to settings.
            app_key: Adzuna application key. Defaults to settings.
            country: Default country code (e.g., 'au', 'gb', 'us'). Defaults to settings.
        """
        self._app_id = app_id if app_id is not None else settings.adzuna_app_id
        self._app_key = app_key if app_key is not None else settings.adzuna_app_key
        self._country = country if country is not None else settings.adzuna_default_country

    @property
    def name(self) -> str:
        """Unique identifier for this connector."""
        return "adzuna"

    @property
    def display_name(self) -> str:
        """Human-readable name for this connector."""
        return "Adzuna"

    def is_available(self) -> bool:
        """Check if the connector has valid credentials configured."""
        return bool(self._app_id and self._app_key)

    @retry(
        retry=retry_if_exception_type(ConnectorAPIError),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        reraise=True,
    )
    async def search(self, params: JobSearchParams) -> SearchResult:
        """Search for jobs matching the given parameters.

        Args:
            params: Search parameters including keywords, location, salary, etc.

        Returns:
            SearchResult containing matching jobs and pagination info.

        Raises:
            ConnectorAuthError: If API credentials are invalid.
            ConnectorRateLimitError: If rate limit is exceeded.
            ConnectorAPIError: If the API returns an error.
        """
        if not self.is_available():
            raise ConnectorAuthError(self.name, "API credentials not configured")

        # Build request URL and parameters
        url = f"{self.BASE_URL}/{self._country}/search/{params.page}"
        query_params = self._build_query_params(params)

        logger.debug(f"Adzuna search: {url} with params: {query_params}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(url, params=query_params)
            except httpx.RequestError as e:
                raise ConnectorAPIError(self.name, f"Request failed: {e}") from e

            self._handle_response_errors(response)
            data = response.json()

        return self._parse_response(data, params)

    def _build_query_params(self, params: JobSearchParams) -> dict[str, Any]:
        """Build query parameters for the Adzuna API.

        Args:
            params: Search parameters.

        Returns:
            Dictionary of query parameters.
        """
        query: dict[str, Any] = {
            "app_id": self._app_id,
            "app_key": self._app_key,
            "results_per_page": params.per_page,
        }

        # Keywords search
        if params.keywords:
            query["what"] = " ".join(params.keywords)

        # Location search
        if params.location:
            query["where"] = params.location

        # Distance/radius (Adzuna uses km)
        if params.radius_km:
            query["distance"] = params.radius_km

        # Salary filters
        if params.salary_min:
            query["salary_min"] = params.salary_min
        if params.salary_max:
            query["salary_max"] = params.salary_max

        # Job type mapping
        if params.job_type:
            contract_type = self._job_type_to_contract(params.job_type)
            if contract_type:
                query["contract_type"] = contract_type

        return query

    def _job_type_to_contract(self, job_type: JobType) -> str | None:
        """Map JobType enum to Adzuna contract_type parameter."""
        mapping = {
            JobType.FULL_TIME: "permanent",
            JobType.PART_TIME: "part_time",
            JobType.CONTRACT: "contract",
            JobType.TEMPORARY: "temporary",
        }
        return mapping.get(job_type)

    def _handle_response_errors(self, response: httpx.Response) -> None:
        """Handle HTTP response errors.

        Args:
            response: The HTTP response.

        Raises:
            ConnectorAuthError: For 401/403 responses.
            ConnectorRateLimitError: For 429 responses.
            ConnectorAPIError: For other error responses.
        """
        if response.status_code == 200:
            return

        if response.status_code in (401, 403):
            raise ConnectorAuthError(
                self.name,
                f"Authentication failed: {response.text}",
            )

        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After")
            retry_seconds = int(retry_after) if retry_after else None
            raise ConnectorRateLimitError(
                self.name,
                "Rate limit exceeded",
                retry_after=retry_seconds,
            )

        raise ConnectorAPIError(
            self.name,
            f"API error: {response.status_code} - {response.text}",
            status_code=response.status_code,
        )

    def _parse_response(self, data: dict[str, Any], params: JobSearchParams) -> SearchResult:
        """Parse Adzuna API response into SearchResult.

        Args:
            data: Raw JSON response from Adzuna.
            params: Original search parameters.

        Returns:
            Parsed SearchResult.
        """
        total_count = data.get("count", 0)
        results = data.get("results", [])

        jobs = [self._parse_job(item) for item in results]

        # Calculate if there are more results
        total_pages = (total_count + params.per_page - 1) // params.per_page
        has_more = params.page < total_pages

        return SearchResult(
            jobs=jobs,
            total_count=total_count,
            page=params.page,
            per_page=params.per_page,
            has_more=has_more,
        )

    def _parse_job(self, item: dict[str, Any]) -> Job:
        """Parse a single job listing from Adzuna response.

        Response mapping:
            - id -> id (as string)
            - title -> title
            - company.display_name -> company
            - location.display_name -> location
            - description -> description
            - redirect_url -> url
            - salary_min -> salary_min
            - salary_max -> salary_max
            - created -> posted_at
            - contract_type -> job_type

        Args:
            item: Single job result from Adzuna.

        Returns:
            Parsed Job object.
        """
        # Parse posted_at date
        posted_at = None
        if created := item.get("created"):
            try:
                # Adzuna returns ISO format: "2024-01-15T10:30:00Z"
                posted_at = datetime.fromisoformat(created.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                logger.warning(f"Failed to parse date: {created}")

        # Map contract_type to JobType
        contract_type = item.get("contract_type")
        job_type = CONTRACT_TYPE_MAP.get(contract_type)

        # Extract nested fields safely
        company = item.get("company", {}).get("display_name", "Unknown")
        location = item.get("location", {}).get("display_name", "Unknown")

        return Job(
            id=str(item.get("id", "")),
            source=self.name,
            title=item.get("title", ""),
            company=company,
            location=location,
            description=item.get("description", ""),
            url=item.get("redirect_url", ""),
            salary_min=item.get("salary_min"),
            salary_max=item.get("salary_max"),
            salary_currency="AUD" if self._country == "au" else None,
            job_type=job_type,
            posted_at=posted_at,
            raw_data=item,
        )
