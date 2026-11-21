from typing import Optional, TypeVar

from google import genai
from pydantic import BaseModel

from .config import settings

T = TypeVar("T", bound=BaseModel)


class GenAIClient:
    """Wrapper sincrono leggero per chiamate Structured Output via SDK google-genai."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else settings.gemini_api_key
        self.model = model if model is not None else settings.gemini_model
        self.timeout_seconds = (
            timeout_seconds
            if timeout_seconds is not None
            else settings.gemini_timeout_seconds
        )
        self._client: Optional[genai.Client] = None

    def _get_client(self) -> genai.Client:
        """Inizializza il client Gemini solo al primo utilizzo reale."""
        if not self.api_key:
            raise RuntimeError("Servizio AI non configurato.")
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def generate_structured(
        self,
        *,
        prompt: str, # dati presi dal db (scheda opera...)
        system_instruction: str,
        response_schema: type[T], #scema pydantic che voglio ricevere in risposta
    ) -> T:
        """Esegue una chiamata Gemini con output JSON validato su schema Pydantic."""
        client = self._get_client()
        try:
            interaction = client.interactions.create(
                model=self.model,
                input=prompt,
                system_instruction=system_instruction,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": response_schema.model_json_schema(),
                },
                store=False,
                timeout=self.timeout_seconds,
            )
            raw_text = interaction.output_text
            if not raw_text or not raw_text.strip():
                raise RuntimeError("Risposta AI vuota.")
            return response_schema.model_validate_json(raw_text)
        except RuntimeError:
            raise
        except Exception as exc:
            raise RuntimeError("Servizio AI temporaneamente non disponibile.") from exc


_default_genai_client = GenAIClient()


def get_genai_client() -> GenAIClient:
    """Dependency FastAPI che restituisce il client Gemini condiviso."""
    return _default_genai_client
