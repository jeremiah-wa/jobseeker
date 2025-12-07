"""Storage backend dependency."""

from functools import lru_cache

from app.config import settings
from app.storage import LocalStorageBackend, StorageBackend


@lru_cache
def get_storage_backend() -> StorageBackend:
    """
    Get storage backend instance.

    Returns:
        StorageBackend instance (currently LocalStorageBackend)
    """
    return LocalStorageBackend(base_path=settings.upload_dir)
