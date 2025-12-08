"""Base class for job connectors."""

from abc import ABC, abstractmethod

from app.schemas.job import Job, JobSearchParams, SearchResult


class JobConnector(ABC):
    """Abstract base class that all job connectors must implement.

    A job connector integrates with an external job board or API to search
    for job listings. Each connector handles authentication, request formatting,
    and response parsing for its specific source.

    Example:
        class AdzunaConnector(JobConnector):
            @property
            def name(self) -> str:
                return "adzuna"

            @property
            def display_name(self) -> str:
                return "Adzuna"

            async def search(self, params: JobSearchParams) -> SearchResult:
                # Implementation here
                pass
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique identifier for this connector.

        This should be a lowercase string with no spaces, used internally
        to identify the connector (e.g., 'adzuna', 'indeed', 'linkedin').
        """

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable name for this connector.

        This is shown to users in the UI (e.g., 'Adzuna', 'Indeed', 'LinkedIn').
        """

    @abstractmethod
    async def search(self, params: JobSearchParams) -> SearchResult:
        """Search for jobs matching the given parameters.

        Args:
            params: Search parameters including keywords, location, salary, etc.

        Returns:
            SearchResult containing matching jobs and pagination info.

        Raises:
            ConnectorError: If the search fails due to API issues.
        """

    async def get_job_details(self, job_id: str) -> Job | None:
        """Fetch full details for a specific job.

        This is optional - connectors can override this to provide
        additional details beyond what's returned in search results.

        Args:
            job_id: The job ID from this connector's source.

        Returns:
            Full job details, or None if not found.
        """
        return None

    def is_available(self) -> bool:
        """Check if this connector is configured and available.

        Returns:
            True if the connector has valid credentials and can be used.
        """
        return True


class ConnectorError(Exception):
    """Base exception for connector errors."""

    def __init__(self, connector_name: str, message: str) -> None:
        self.connector_name = connector_name
        self.message = message
        super().__init__(f"[{connector_name}] {message}")


class ConnectorAuthError(ConnectorError):
    """Raised when connector authentication fails."""


class ConnectorRateLimitError(ConnectorError):
    """Raised when connector hits rate limits."""

    def __init__(self, connector_name: str, message: str, retry_after: int | None = None) -> None:
        super().__init__(connector_name, message)
        self.retry_after = retry_after


class ConnectorAPIError(ConnectorError):
    """Raised when connector API returns an error."""

    def __init__(self, connector_name: str, message: str, status_code: int | None = None) -> None:
        super().__init__(connector_name, message)
        self.status_code = status_code
