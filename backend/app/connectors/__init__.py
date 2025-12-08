"""Job connectors package for aggregating job listings from multiple sources."""

from app.connectors.adzuna import AdzunaConnector
from app.connectors.base import JobConnector
from app.connectors.manager import ConnectorManager

__all__ = ["AdzunaConnector", "ConnectorManager", "JobConnector"]
