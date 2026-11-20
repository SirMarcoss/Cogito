from enum import Enum


class TipologiaEnte(str, Enum):
    """Tipologia dell'ente culturale o luogo territoriale."""

    MUSEO = "museo"
    ARCHIVIO = "archivio"
    SITO_TERRITORIO = "sito_territorio"


class CategoriaOpera(str, Enum):
    """Categoria del bene culturale esposto o mappato sul territorio."""

    OPERA = "opera"
    REPERTO = "reperto"
    DOCUMENTO = "documento"
    MONUMENTO = "monumento"


class LivelloCompetenza(str, Enum):
    """Profilo di complessità narrativa selezionato dal visitatore."""

    BAMBINO = "bambino"
    RAGAZZO = "ragazzo"
    ADULTO = "adulto"
    ESPERTO = "esperto"


def enum_values(enum_cls: type[Enum]) -> list[str]:
    """Restituisce i valori stringa lowercase dell'enum per la persistenza su DB."""
    return [member.value for member in enum_cls]
