"""
spaCy NER wrapper.
Loaded once at startup — model initialisation is expensive (~200ms).
All subsequent calls are fast synchronous lookups.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import ClassVar

import structlog

logger = structlog.get_logger(__name__)

# Entity types to flag by default
DEFAULT_ENTITY_TYPES = {"PERSON", "ORG", "GPE", "LOC"}


@dataclass(frozen=True)
class NERMatch:
    text: str
    label: str       # spaCy entity label (PERSON, ORG, etc.)
    start: int
    end: int


class NERDetector:
    """
    Singleton wrapper around a spaCy model.
    Call NERDetector.get() to retrieve or initialise the shared instance.
    """

    _instance: ClassVar["NERDetector | None"] = None

    def __init__(self, model_name: str = "en_core_web_sm"):
        self._nlp = None
        self._model_name = model_name
        self._available = False
        self._load_model()

    def _load_model(self) -> None:
        try:
            import spacy
            self._nlp = spacy.load(self._model_name, disable=["tok2vec", "tagger", "parser", "lemmatizer"])
            self._available = True
            logger.info("ner_model_loaded", model=self._model_name)
        except (ImportError, OSError) as exc:
            # spaCy or the model not installed — NER detection will be skipped
            logger.warning("ner_model_unavailable", error=str(exc))
            self._available = False

    @classmethod
    def get(cls) -> "NERDetector":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def available(self) -> bool:
        return self._available

    def detect(
        self,
        text: str,
        entity_types: set[str] | None = None,
    ) -> list[NERMatch]:
        """
        Returns a list of NER matches in the given text.
        Filters by entity_types if provided, else uses DEFAULT_ENTITY_TYPES.
        Returns empty list if model is unavailable.
        """
        if not self._available or not self._nlp:
            return []

        target_types = entity_types or DEFAULT_ENTITY_TYPES
        doc = self._nlp(text[:5000])  # Cap at 5000 chars for latency budget

        return [
            NERMatch(
                text=ent.text,
                label=ent.label_,
                start=ent.start_char,
                end=ent.end_char,
            )
            for ent in doc.ents
            if ent.label_ in target_types
        ]
