"""Structured logging configuration using structlog.

This module configures structlog for the application with:
- JSON output in production (for log aggregation tools)
- Human-readable colored output in development
- Request ID correlation via contextvars
- Automatic binding of common context (timestamp, level, logger name)
"""

import logging
import sys
from typing import Any

import structlog
from structlog.types import Processor

from app.config import settings


def setup_logging() -> None:
    """Configure structured logging for the application.

    Call this once at application startup before any logging occurs.
    """
    # Determine if we're in production mode
    is_production = settings.environment == "production"

    # Shared processors for both dev and prod
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if is_production:
        # Production: JSON output for log aggregation
        shared_processors.append(structlog.processors.format_exc_info)
        renderer: Processor = structlog.processors.JSONRenderer()
    else:
        # Development: Colored, human-readable output
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    # Configure structlog
    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Configure standard logging to use structlog formatting
    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    # Set up root handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(settings.log_level.upper())

    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("asyncpg").setLevel(logging.WARNING)


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Get a structlog logger instance.

    Args:
        name: Logger name (typically __name__). If None, uses the root logger.

    Returns:
        A bound structlog logger.

    Example:
        ```python
        from app.core.logging import get_logger

        logger = get_logger(__name__)
        logger.info("user_logged_in", user_id="123", ip="192.168.1.1")
        ```
    """
    return structlog.stdlib.get_logger(name)


def bind_contextvars(**kwargs: Any) -> None:
    """Bind context variables that will be included in all subsequent log messages.

    Use this in middleware to add request-scoped context like request_id, user_id.

    Args:
        **kwargs: Key-value pairs to bind to the logging context.

    Example:
        ```python
        from app.core.logging import bind_contextvars

        bind_contextvars(request_id="abc-123", user_id="user-456")
        ```
    """
    structlog.contextvars.bind_contextvars(**kwargs)


def clear_contextvars() -> None:
    """Clear all bound context variables.

    Call this at the end of a request to clean up context.
    """
    structlog.contextvars.clear_contextvars()
