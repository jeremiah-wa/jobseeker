"""Storage backend abstraction for file management."""

from app.storage.backend import LocalStorageBackend, StorageBackend, generate_cv_path

__all__ = ["StorageBackend", "LocalStorageBackend", "generate_cv_path"]
