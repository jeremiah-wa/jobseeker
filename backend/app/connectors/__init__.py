"""Job connectors package for aggregating job listings from multiple sources."""

from app.connectors.base import JobConnector
from app.connectors.manager import ConnectorManager

__all__ = ["JobConnector", "ConnectorManager"]
