"""Connector manager for registering and aggregating job connectors."""

import asyncio
from typing import TYPE_CHECKING, ClassVar

from app.connectors.base import ConnectorError, JobConnector
from app.core.logging import get_logger
from app.schemas.job import (
    AggregatedSearchResult,
    ConnectorInfo,
    Job,
    JobSearchParams,
    SearchResult,
)

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)


class ConnectorManager:
    """Registry and aggregator for job connectors.

    This class manages all registered job connectors and provides methods
    to search across multiple sources simultaneously.

    Usage:
        # Register a connector
        ConnectorManager.register(AdzunaConnector())

        # Search all connectors
        results = await ConnectorManager.search_all(params)

        # Search specific connectors
        results = await ConnectorManager.search_all(params, sources=["adzuna"])
    """

    _connectors: ClassVar[dict[str, JobConnector]] = {}

    @classmethod
    def register(cls, connector: JobConnector) -> None:
        """Register a connector with the manager.

        Args:
            connector: The connector instance to register.

        Raises:
            ValueError: If a connector with the same name is already registered.
        """
        if connector.name in cls._connectors:
            raise ValueError(f"Connector '{connector.name}' is already registered")

        cls._connectors[connector.name] = connector
        logger.info(
            "connector_registered", name=connector.name, display_name=connector.display_name
        )

    @classmethod
    def unregister(cls, name: str) -> None:
        """Unregister a connector by name.

        Args:
            name: The connector name to unregister.
        """
        if name in cls._connectors:
            del cls._connectors[name]
            logger.info("connector_unregistered", name=name)

    @classmethod
    def get(cls, name: str) -> JobConnector | None:
        """Get a connector by name.

        Args:
            name: The connector name.

        Returns:
            The connector instance, or None if not found.
        """
        return cls._connectors.get(name)

    @classmethod
    def all(cls) -> list[JobConnector]:
        """Get all registered connectors.

        Returns:
            List of all registered connector instances.
        """
        return list(cls._connectors.values())

    @classmethod
    def available(cls) -> list[JobConnector]:
        """Get all available (configured) connectors.

        Returns:
            List of connectors that are configured and ready to use.
        """
        return [c for c in cls._connectors.values() if c.is_available()]

    @classmethod
    def list_connectors(cls) -> list[ConnectorInfo]:
        """Get info about all registered connectors.

        Returns:
            List of connector info objects.
        """
        return [
            ConnectorInfo(
                name=c.name,
                display_name=c.display_name,
                is_available=c.is_available(),
            )
            for c in cls._connectors.values()
        ]

    @classmethod
    async def search(
        cls,
        name: str,
        params: JobSearchParams,
        db: "AsyncSession | None" = None,
    ) -> SearchResult:
        """Search a specific connector.

        Args:
            name: The connector name.
            params: Search parameters.
            db: Optional database session for caching.

        Returns:
            Search results from the connector.

        Raises:
            ValueError: If the connector is not found or not available.
        """
        connector = cls.get(name)
        if not connector:
            raise ValueError(f"Connector '{name}' not found")
        if not connector.is_available():
            raise ValueError(f"Connector '{name}' is not available")

        # Check cache if db session provided
        if db is not None:
            from app.services.cache import JobCacheService

            cache_service = JobCacheService(db)
            cached_result = await cache_service.get_search_result(params, name)
            if cached_result is not None:
                logger.info("cache_hit", connector=name)
                return cached_result

        # Fetch from connector
        result = await connector.search(params)

        # Cache the result if db session provided
        if db is not None:
            try:
                await cache_service.set_search_result(params, name, result)
            except Exception as e:
                logger.warning("cache_write_failed", error=str(e))

        return result

    @classmethod
    async def search_all(
        cls,
        params: JobSearchParams,
        sources: list[str] | None = None,
        db: "AsyncSession | None" = None,
    ) -> AggregatedSearchResult:
        """Search across multiple connectors simultaneously.

        Args:
            params: Search parameters.
            sources: Optional list of connector names to search.
                    If None, searches all available connectors.
            db: Optional database session for caching.

        Returns:
            Aggregated results from all searched connectors.
        """
        # Determine which connectors to search
        if sources:
            connectors = [
                cls._connectors[name]
                for name in sources
                if name in cls._connectors and cls._connectors[name].is_available()
            ]
        else:
            connectors = cls.available()

        if not connectors:
            return AggregatedSearchResult(
                jobs=[],
                total_count=0,
                page=params.page,
                per_page=params.per_page,
                has_more=False,
                sources_searched=[],
                errors={},
            )

        # Search all connectors concurrently (with caching if db provided)
        async def search_with_cache(connector: JobConnector) -> SearchResult:
            """Search a connector with optional caching."""
            if db is not None:
                from app.services.cache import JobCacheService

                cache_service = JobCacheService(db)
                cached = await cache_service.get_search_result(params, connector.name)
                if cached is not None:
                    logger.info("cache_hit", connector=connector.name)
                    return cached

            result = await connector.search(params)

            if db is not None:
                try:
                    await cache_service.set_search_result(params, connector.name, result)
                except Exception as e:
                    logger.warning("cache_write_failed", connector=connector.name, error=str(e))

            return result

        tasks = [search_with_cache(connector) for connector in connectors]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Aggregate results
        all_jobs: list[Job] = []
        total_count = 0
        sources_searched: list[str] = []
        errors: dict[str, str] = {}

        for connector, result in zip(connectors, results, strict=True):
            if isinstance(result, ConnectorError):
                errors[connector.name] = result.message
                logger.warning("connector_failed", connector=connector.name, error=result.message)
            elif isinstance(result, BaseException):
                errors[connector.name] = str(result)
                logger.exception("connector_failed_unexpected", connector=connector.name)
            elif isinstance(result, SearchResult):
                all_jobs.extend(result.jobs)
                total_count += result.total_count
                sources_searched.append(connector.name)

        # Sort jobs by posted date (newest first)
        all_jobs.sort(
            key=lambda j: j.posted_at if j.posted_at else 0,
            reverse=True,
        )

        # Apply pagination to aggregated results
        start = (params.page - 1) * params.per_page
        end = start + params.per_page
        paginated_jobs = all_jobs[start:end]

        return AggregatedSearchResult(
            jobs=paginated_jobs,
            total_count=total_count,
            page=params.page,
            per_page=params.per_page,
            has_more=end < len(all_jobs),
            sources_searched=sources_searched,
            errors=errors,
        )

    @classmethod
    def clear(cls) -> None:
        """Clear all registered connectors. Useful for testing."""
        cls._connectors.clear()
