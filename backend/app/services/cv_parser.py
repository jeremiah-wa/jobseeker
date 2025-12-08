"""CV parsing service using LangChain with configurable LLM providers."""

import logging
from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate
from pydantic import ValidationError

from app.config import settings
from app.schemas.cv import ParsedCV

logger = logging.getLogger(__name__)


class CVParsingError(Exception):
    """Raised when CV parsing fails."""

    pass


def get_llm() -> BaseChatModel:
    """
    Get the configured LLM based on settings.

    Supported providers:
    - ollama: Local LLM via Ollama (no API costs, good for dev)
    - groq: Free/cheap cloud API (recommended for cloud dev)
    - anthropic: Premium cloud API (production quality)

    Returns:
        Configured LLM instance.

    Raises:
        CVParsingError: If provider is invalid or not configured.
    """
    provider = settings.llm_provider.lower()

    if provider == "ollama":
        from langchain_ollama import ChatOllama

        logger.info(
            f"Using Ollama provider at {settings.ollama_base_url} with model: {settings.llm_model}"
        )
        return ChatOllama(
            model=settings.llm_model,
            base_url=settings.ollama_base_url,
            temperature=settings.llm_temperature,
            num_predict=settings.llm_max_tokens,
        )

    elif provider == "groq":
        if not settings.groq_api_key:
            raise CVParsingError("Groq API key not configured")

        from langchain_groq import ChatGroq

        logger.info(f"Using Groq provider with model: {settings.llm_model}")
        return ChatGroq(  # type: ignore[call-arg]
            model=settings.llm_model,
            api_key=settings.groq_api_key,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
        )

    elif provider == "anthropic":
        if not settings.anthropic_api_key:
            raise CVParsingError("Anthropic API key not configured")

        from langchain_anthropic import ChatAnthropic

        logger.info(f"Using Anthropic provider with model: {settings.llm_model}")
        return ChatAnthropic(  # type: ignore[call-arg]
            model=settings.llm_model,
            api_key=settings.anthropic_api_key,
            max_tokens=settings.llm_max_tokens,
            temperature=settings.llm_temperature,
        )

    else:
        raise CVParsingError(
            f"Invalid LLM provider: {provider}. Use 'ollama', 'groq', or 'anthropic'."
        )


CV_PARSING_PROMPT = """You are an expert CV/resume parser. Your task is to extract structured information from the provided CV text.

Extract the following information:
- Full name of the candidate
- Email address
- Phone number
- Location/address
- Professional summary or objective
- Skills (as a list)
- Work experience (job title, company, location, dates, description, key highlights)
- Education (degree, institution, location, graduation date, GPA if mentioned)
- Certifications (as a list)
- Languages (as a list)

Important guidelines:
1. Extract information exactly as written in the CV when possible
2. For dates, use the format found in the CV (e.g., "Jan 2020", "2020-01", "January 2020")
3. If information is not present, use null/empty values
4. For "Present" or "Current" jobs, use "Present" as the end_date
5. Keep descriptions concise but informative
6. List skills individually, not in comma-separated groups
7. Be thorough - extract ALL experiences and education entries

CV Text:
{cv_text}

Parse this CV and return structured data."""


class CVParserService:
    """Service for parsing CVs using LLM."""

    def __init__(self) -> None:
        """Initialize the CV parser service with configured LLM provider."""
        self.llm = get_llm()

        self.prompt = ChatPromptTemplate.from_messages(
            [
                ("system", "You are an expert CV/resume parser. Always respond with valid JSON."),
                ("human", CV_PARSING_PROMPT),
            ]
        )

        # Create structured output chain
        self.chain = self.prompt | self.llm.with_structured_output(ParsedCV)

    async def parse_cv(self, cv_text: str) -> ParsedCV:
        """
        Parse CV text and extract structured data.

        Args:
            cv_text: Raw text extracted from CV PDF.

        Returns:
            ParsedCV object with structured data.

        Raises:
            CVParsingError: If parsing fails.
        """
        if not cv_text.strip():
            raise CVParsingError("CV text is empty")

        try:
            logger.info("Starting CV parsing with LLM...")

            # Truncate very long CVs to avoid token limits
            max_chars = 50000  # Roughly 12k tokens
            if len(cv_text) > max_chars:
                logger.warning(f"CV text truncated from {len(cv_text)} to {max_chars} chars")
                cv_text = cv_text[:max_chars]

            # Run the LLM chain
            result = await self.chain.ainvoke({"cv_text": cv_text})

            if result is None:
                raise CVParsingError("LLM returned empty result")

            # The chain's with_structured_output returns ParsedCV
            if isinstance(result, ParsedCV):
                logger.info("CV parsing completed successfully")
                return result
            else:
                # Handle case where result is a dict (shouldn't happen with structured output)
                return ParsedCV.model_validate(result)

        except ValidationError as e:
            logger.error(f"CV parsing validation error: {e}")
            raise CVParsingError(f"Failed to validate parsed data: {e}") from e
        except Exception as e:
            logger.error(f"CV parsing failed: {e}")
            raise CVParsingError(f"CV parsing failed: {e}") from e

    def parse_cv_sync(self, cv_text: str) -> ParsedCV:
        """
        Synchronous version of parse_cv for use in background tasks.

        Args:
            cv_text: Raw text extracted from CV PDF.

        Returns:
            ParsedCV object with structured data.
        """
        import asyncio

        return asyncio.run(self.parse_cv(cv_text))

    @staticmethod
    def parsed_cv_to_dict(parsed_cv: ParsedCV) -> dict[str, Any]:
        """
        Convert ParsedCV to dict for JSONB storage.

        Args:
            parsed_cv: Parsed CV data.

        Returns:
            Dictionary representation.
        """
        data: dict[str, Any] = parsed_cv.model_dump(mode="json")
        return data

    @staticmethod
    def dict_to_parsed_cv(data: dict[str, Any]) -> ParsedCV:
        """
        Convert dict from JSONB to ParsedCV.

        Args:
            data: Dictionary from database.

        Returns:
            ParsedCV object.
        """
        return ParsedCV.model_validate(data)
