"""Job cache service for caching search results and job details."""

import hashlib
import json
import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.job_cache import JobCache
from app.schemas.job import JobSearchParams, SearchResult

logger = logging.getLogger(__name__)

# Cache TTL settings (in minutes)
SEARCH_CACHE_TTL_MINUTES = 15
JOB_DETAILS_CACHE_TTL_MINUTES = 60


class CacheType:
    """Cache entry type constants."""

    SEARCH = "search"
    JOB_DETAILS = "job_details"


def generate_cache_key(params: JobSearchParams, source: str) -> str:
    """Generate a unique cache key from search parameters and source.

    Args:
        params: Job search parameters.
        source: Connector name.

    Returns:
        Unique hash string for the cache key.
    """
    param_dict = params.model_dump(exclude_none=True)
    param_str = json.dumps(param_dict, sort_keys=True)
    content = f"{source}:{param_str}"
    return hashlib.md5(content.encode()).hexdigest()


def generate_job_cache_key(job_id: str, source: str) -> str:
    """Generate a cache key for a specific job.

    Args:
        job_id: The job ID from the source.
        source: Connector name.

    Returns:
        Cache key string.
    """
    return f"job:{source}:{job_id}"


class JobCacheService:
    """Service for managing job search cache.

    Provides methods to cache search results and job details using
    PostgreSQL JSONB storage.
    """

    def __init__(self, db: AsyncSession):
        """Initialize the cache service.

        Args:
            db: Async database session.
        """
        self.db = db

    async def get_search_result(
        self,
        params: JobSearchParams,
        source: str,
    ) -> SearchResult | None:
        """Get cached search results if available and not expired.

        Args:
            params: Job search parameters.
            source: Connector name.

        Returns:
            Cached SearchResult if found and valid, None otherwise.
        """
        cache_key = generate_cache_key(params, source)

        stmt = select(JobCache).where(
            JobCache.cache_key == cache_key,
            JobCache.source == source,
            JobCache.cache_type == CacheType.SEARCH,
            JobCache.expires_at > datetime.now(UTC),
        )

        result = await self.db.execute(stmt)
        cache_entry = result.scalar_one_or_none()

        if cache_entry:
            logger.debug(f"Cache hit for search: {source} - {cache_key[:8]}")
            return SearchResult.model_validate(cache_entry.data)

        logger.debug(f"Cache miss for search: {source} - {cache_key[:8]}")
        return None

    async def set_search_result(
        self,
        params: JobSearchParams,
        source: str,
        result: SearchResult,
        ttl_minutes: int = SEARCH_CACHE_TTL_MINUTES,
    ) -> None:
        """Cache search results.

        Uses upsert to handle concurrent requests gracefully.

        Args:
            params: Job search parameters.
            source: Connector name.
            result: Search result to cache.
            ttl_minutes: Cache time-to-live in minutes.
        """
        cache_key = generate_cache_key(params, source)
        expires_at = datetime.now(UTC) + timedelta(minutes=ttl_minutes)

        stmt = insert(JobCache).values(
            cache_key=cache_key,
            source=source,
            cache_type=CacheType.SEARCH,
            data=result.model_dump(mode="json"),
            expires_at=expires_at,
        )

        # On conflict, update the data and expiration
        stmt = stmt.on_conflict_do_update(
            index_elements=[JobCache.cache_key],
            set_={
                "data": stmt.excluded.data,
                "expires_at": stmt.excluded.expires_at,
            },
        )

        await self.db.execute(stmt)
        await self.db.commit()
        logger.debug(f"Cached search result: {source} - {cache_key[:8]}")

    async def get_job_details(
        self,
        job_id: str,
        source: str,
    ) -> dict[str, Any] | None:
        """Get cached job details if available and not expired.

        Args:
            job_id: The job ID from the source.
            source: Connector name.

        Returns:
            Cached job data dict if found and valid, None otherwise.
        """
        cache_key = generate_job_cache_key(job_id, source)

        stmt = select(JobCache).where(
            JobCache.cache_key == cache_key,
            JobCache.source == source,
            JobCache.cache_type == CacheType.JOB_DETAILS,
            JobCache.expires_at > datetime.now(UTC),
        )

        result = await self.db.execute(stmt)
        cache_entry = result.scalar_one_or_none()

        if cache_entry:
            logger.debug(f"Cache hit for job: {source} - {job_id}")
            return cache_entry.data

        logger.debug(f"Cache miss for job: {source} - {job_id}")
        return None

    async def set_job_details(
        self,
        job_id: str,
        source: str,
        job_data: dict[str, Any],
        ttl_minutes: int = JOB_DETAILS_CACHE_TTL_MINUTES,
    ) -> None:
        """Cache job details.

        Args:
            job_id: The job ID from the source.
            source: Connector name.
            job_data: Job data to cache.
            ttl_minutes: Cache time-to-live in minutes.
        """
        cache_key = generate_job_cache_key(job_id, source)
        expires_at = datetime.now(UTC) + timedelta(minutes=ttl_minutes)

        stmt = insert(JobCache).values(
            cache_key=cache_key,
            source=source,
            cache_type=CacheType.JOB_DETAILS,
            data=job_data,
            expires_at=expires_at,
        )

        stmt = stmt.on_conflict_do_update(
            index_elements=[JobCache.cache_key],
            set_={
                "data": stmt.excluded.data,
                "expires_at": stmt.excluded.expires_at,
            },
        )

        await self.db.execute(stmt)
        await self.db.commit()
        logger.debug(f"Cached job details: {source} - {job_id}")

    async def invalidate_source(self, source: str) -> int:
        """Invalidate all cache entries for a specific source.

        Args:
            source: Connector name to invalidate.

        Returns:
            Number of entries deleted.
        """
        stmt = delete(JobCache).where(JobCache.source == source)
        result = await self.db.execute(stmt)
        await self.db.commit()
        count: int = result.rowcount or 0  # type: ignore[attr-defined]
        logger.info(f"Invalidated {count} cache entries for source: {source}")
        return count

    async def cleanup_expired(self) -> int:
        """Remove all expired cache entries.

        Returns:
            Number of entries deleted.
        """
        stmt = delete(JobCache).where(JobCache.expires_at < datetime.now(UTC))
        result = await self.db.execute(stmt)
        await self.db.commit()
        count: int = result.rowcount or 0  # type: ignore[attr-defined]
        if count > 0:
            logger.info(f"Cleaned up {count} expired cache entries")
        return count

    async def get_stats(self) -> dict[str, Any]:
        """Get cache statistics.

        Returns:
            Dictionary with cache statistics.
        """
        from sqlalchemy import func

        # Count total entries
        total_stmt = select(func.count(JobCache.id))
        total_result = await self.db.execute(total_stmt)
        total_count = total_result.scalar() or 0

        # Count by source
        source_stmt = select(
            JobCache.source,
            func.count(JobCache.id).label("count"),
        ).group_by(JobCache.source)
        source_result = await self.db.execute(source_stmt)
        by_source = {row.source: row.count for row in source_result}

        # Count by type
        type_stmt = select(
            JobCache.cache_type,
            func.count(JobCache.id).label("count"),
        ).group_by(JobCache.cache_type)
        type_result = await self.db.execute(type_stmt)
        by_type = {row.cache_type: row.count for row in type_result}

        # Count expired
        expired_stmt = select(func.count(JobCache.id)).where(
            JobCache.expires_at < datetime.now(UTC)
        )
        expired_result = await self.db.execute(expired_stmt)
        expired_count = expired_result.scalar() or 0

        return {
            "total_entries": total_count,
            "expired_entries": expired_count,
            "active_entries": total_count - expired_count,
            "by_source": by_source,
            "by_type": by_type,
        }
