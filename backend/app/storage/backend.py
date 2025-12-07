"""Storage backend implementations."""

import uuid
from abc import ABC, abstractmethod
from pathlib import Path

import aiofiles
import aiofiles.os


class StorageBackend(ABC):
    """Abstract base class for storage backends."""

    @abstractmethod
    async def save(self, path: str, content: bytes) -> str:
        """
        Save file content to storage.

        Args:
            path: Relative path where file should be saved
            content: File content as bytes

        Returns:
            Full path where file was saved
        """
        pass

    @abstractmethod
    async def get(self, path: str) -> bytes:
        """
        Retrieve file content from storage.

        Args:
            path: Path to the file

        Returns:
            File content as bytes

        Raises:
            FileNotFoundError: If file doesn't exist
        """
        pass

    @abstractmethod
    async def delete(self, path: str) -> None:
        """
        Delete file from storage.

        Args:
            path: Path to the file

        Raises:
            FileNotFoundError: If file doesn't exist
        """
        pass

    @abstractmethod
    async def exists(self, path: str) -> bool:
        """
        Check if file exists in storage.

        Args:
            path: Path to the file

        Returns:
            True if file exists, False otherwise
        """
        pass


class LocalStorageBackend(StorageBackend):
    """Local filesystem storage backend using aiofiles."""

    def __init__(self, base_path: str | Path) -> None:
        """
        Initialize local storage backend.

        Args:
            base_path: Base directory for file storage
        """
        self.base_path = Path(base_path)

    async def save(self, path: str, content: bytes) -> str:
        """Save file to local filesystem."""
        full_path = self.base_path / path

        # Create parent directories if they don't exist
        full_path.parent.mkdir(parents=True, exist_ok=True)

        # Write file content
        async with aiofiles.open(full_path, "wb") as f:
            await f.write(content)

        return str(full_path)

    async def get(self, path: str) -> bytes:
        """Retrieve file from local filesystem."""
        full_path = self.base_path / path

        if not await self.exists(path):
            raise FileNotFoundError(f"File not found: {path}")

        async with aiofiles.open(full_path, "rb") as f:
            content = await f.read()
            return bytes(content)

    async def delete(self, path: str) -> None:
        """Delete file from local filesystem."""
        full_path = self.base_path / path

        if not await self.exists(path):
            raise FileNotFoundError(f"File not found: {path}")

        await aiofiles.os.remove(full_path)

    async def exists(self, path: str) -> bool:
        """Check if file exists in local filesystem."""
        full_path = self.base_path / path
        result = await aiofiles.os.path.exists(full_path)
        return bool(result)


def generate_cv_path(user_id: uuid.UUID, original_filename: str) -> str:
    """
    Generate storage path for CV file.

    Args:
        user_id: User's UUID
        original_filename: Original filename from upload

    Returns:
        Relative path: cvs/{user_id}/{uuid}_{original_filename}
    """
    file_uuid = uuid.uuid4()
    return f"cvs/{user_id}/{file_uuid}_{original_filename}"
