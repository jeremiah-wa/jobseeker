"""PDF text extraction service using PyMuPDF."""

from io import BytesIO

import fitz  # PyMuPDF
import pymupdf

from app.core.logging import get_logger

logger = get_logger(__name__)


class PDFExtractionError(Exception):
    """Raised when PDF text extraction fails."""

    pass


class PDFExtractorService:
    """Service for extracting text from PDF files using PyMuPDF."""

    @staticmethod
    def extract_text(pdf_content: bytes) -> str:
        """
        Extract text from PDF content.

        Args:
            pdf_content: Raw PDF file bytes.

        Returns:
            Extracted text from all pages.

        Raises:
            PDFExtractionError: If extraction fails.
        """
        try:
            # Open PDF from bytes
            pdf_stream = BytesIO(pdf_content)
            doc = fitz.open(stream=pdf_stream, filetype="pdf")

            # Extract text from all pages
            text_parts: list[str] = []
            for page_num, page in enumerate(doc):
                page_text = page.get_text()
                if page_text.strip():
                    text_parts.append(f"--- Page {page_num + 1} ---\n{page_text}")

            doc.close()

            if not text_parts:
                raise PDFExtractionError("No text could be extracted from PDF")

            return "\n\n".join(text_parts)

        except (pymupdf.FileDataError, pymupdf.EmptyFileError) as e:
            logger.error("pdf_invalid", error=str(e))
            raise PDFExtractionError(f"Invalid PDF file: {e}") from e
        except Exception as e:
            logger.error("pdf_extraction_failed", error=str(e))
            raise PDFExtractionError(f"PDF extraction failed: {e}") from e

    @staticmethod
    def extract_text_clean(pdf_content: bytes) -> str:
        """
        Extract text from PDF and clean it for LLM processing.

        Args:
            pdf_content: Raw PDF file bytes.

        Returns:
            Cleaned extracted text suitable for LLM parsing.
        """
        raw_text = PDFExtractorService.extract_text(pdf_content)

        # Basic cleaning: remove excessive whitespace while preserving structure
        lines = raw_text.split("\n")
        cleaned_lines: list[str] = []
        prev_empty = False

        for line in lines:
            stripped = line.strip()
            if not stripped:
                if not prev_empty:
                    cleaned_lines.append("")
                    prev_empty = True
            else:
                cleaned_lines.append(stripped)
                prev_empty = False

        return "\n".join(cleaned_lines)
