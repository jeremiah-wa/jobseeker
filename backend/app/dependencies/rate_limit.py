"""Rate limiting dependencies."""

import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.db.models.user import User, UserTier
from app.dependencies.auth import get_current_user

# Rate limits per minute by user tier
RATE_LIMITS: dict[UserTier, int] = {
    UserTier.FREE: 30,
    UserTier.PREMIUM: 100,
}


@dataclass
class RateLimitEntry:
    """Tracks rate limit state for a user."""

    requests: list[float] = field(default_factory=list)


class RateLimiter:
    """Simple in-memory rate limiter.

    Tracks requests per user and enforces rate limits based on user tier.
    Uses a sliding window algorithm.
    """

    def __init__(self, window_seconds: int = 60) -> None:
        """Initialize the rate limiter.

        Args:
            window_seconds: Time window for rate limiting.
        """
        self._entries: dict[str, RateLimitEntry] = defaultdict(RateLimitEntry)
        self._window_seconds = window_seconds

    def check_rate_limit(self, user_id: str, tier: UserTier) -> tuple[bool, int, int]:
        """Check if a request is within rate limits.

        Args:
            user_id: The user's ID.
            tier: The user's subscription tier.

        Returns:
            Tuple of (is_allowed, remaining_requests, retry_after_seconds).
        """
        now = time.time()
        entry = self._entries[user_id]
        limit = RATE_LIMITS.get(tier, RATE_LIMITS[UserTier.FREE])

        # Remove expired requests from the window
        cutoff = now - self._window_seconds
        entry.requests = [t for t in entry.requests if t > cutoff]

        # Check if within limit
        remaining = limit - len(entry.requests)
        if remaining <= 0:
            # Calculate retry-after based on oldest request in window
            oldest = min(entry.requests) if entry.requests else now
            retry_after = int(oldest + self._window_seconds - now) + 1
            return False, 0, retry_after

        # Record this request
        entry.requests.append(now)
        return True, remaining - 1, 0

    def get_headers(self, user_id: str, tier: UserTier) -> dict[str, str]:
        """Get rate limit headers for response.

        Args:
            user_id: The user's ID.
            tier: The user's subscription tier.

        Returns:
            Dict of rate limit headers.
        """
        entry = self._entries[user_id]
        limit = RATE_LIMITS.get(tier, RATE_LIMITS[UserTier.FREE])

        # Clean expired entries
        now = time.time()
        cutoff = now - self._window_seconds
        entry.requests = [t for t in entry.requests if t > cutoff]

        remaining = max(0, limit - len(entry.requests))
        reset = int(now + self._window_seconds)

        return {
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(reset),
        }


# Global rate limiter instance
_rate_limiter = RateLimiter()


def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    return _rate_limiter


async def check_job_search_rate_limit(
    current_user: Annotated[User, Depends(get_current_user)],
    rate_limiter: Annotated[RateLimiter, Depends(get_rate_limiter)],
) -> User:
    """Check rate limit for job search endpoint.

    Args:
        current_user: The authenticated user.
        rate_limiter: The rate limiter instance.

    Returns:
        The current user if within rate limits.

    Raises:
        HTTPException: If rate limit is exceeded.
    """
    user_id = str(current_user.id)
    is_allowed, remaining, retry_after = rate_limiter.check_rate_limit(user_id, current_user.tier)

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    return current_user
