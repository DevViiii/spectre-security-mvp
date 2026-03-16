from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

import yaml

ATTACKS_DIR = Path(__file__).parent


@dataclass(frozen=True)
class ClassifierConfig:
    type: Literal["regex", "keyword", "llm_judge"]
    value: str = ""
    threshold: float = 0.0


@dataclass(frozen=True)
class AttackDefinition:
    id: str
    category: str
    severity: Literal["critical", "high", "medium", "low"]
    name: str
    description: str
    payload: str
    classifiers: list[ClassifierConfig] = field(default_factory=list)
    suites: list[str] = field(default_factory=lambda: ["full"])


def load_attacks(suite: str = "full") -> list[AttackDefinition]:
    """
    Walks all category subdirectories, loads every YAML attack definition,
    and returns those matching the requested suite.
    """
    attacks: list[AttackDefinition] = []
    category_dirs = [d for d in ATTACKS_DIR.iterdir() if d.is_dir() and not d.name.startswith("_")]

    for category_dir in sorted(category_dirs):
        for yaml_file in sorted(category_dir.glob("*.yaml")):
            try:
                with yaml_file.open() as f:
                    raw = yaml.safe_load(f)
                attack = _parse_attack(raw, category_dir.name)
                if suite == "full" or suite in attack.suites:
                    attacks.append(attack)
            except Exception as exc:
                # Log but don't fail startup on a malformed attack file
                import structlog
                structlog.get_logger(__name__).warning(
                    "failed_to_load_attack",
                    file=str(yaml_file),
                    error=str(exc),
                )

    return attacks


def _parse_attack(raw: dict, category: str) -> AttackDefinition:
    classifiers = [
        ClassifierConfig(
            type=c["type"],
            value=c.get("value", ""),
            threshold=c.get("threshold", 0.0),
        )
        for c in raw.get("classifiers", [])
    ]
    return AttackDefinition(
        id=raw["id"],
        category=category,
        severity=raw["severity"],
        name=raw["name"],
        description=raw.get("description", ""),
        payload=raw["payload"],
        classifiers=classifiers,
        suites=raw.get("suites", ["full"]),
    )
