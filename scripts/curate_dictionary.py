#!/usr/bin/env python3
"""Curate/build the game dictionary.

If a source wordlist exists at public/wordlist-20210729.txt, build the
shipping dictionary from it. Otherwise, curate the existing dictionary.json.

Filters:
- length 4-12
- ASCII letters only
- excludes proper names (from /usr/share/dict/propernames if present)
- excludes words in public/dictionary-denylist.txt (if present)

Tiers (when building from a wordlist):
- tier 1: length 4-6
- tier 2: length 7-8
- tier 3: length 9-12
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "dictionary.json"
WORDLIST = ROOT / "public" / "wordlist-20210729.txt"
DENYLIST = ROOT / "public" / "dictionary-denylist.txt"
PROPERNAMES_PATH = Path("/usr/share/dict/propernames")

ALPHA = re.compile(r"^[a-z]+$")
STRIP_QUOTES = re.compile(r"^\"|\"$")


def load_propernames() -> set[str]:
    if not PROPERNAMES_PATH.exists():
        return set()
    names = set()
    for line in PROPERNAMES_PATH.read_text(encoding="utf-8", errors="ignore").splitlines():
        name = line.strip().lower()
        if name:
            names.add(name)
    return names


def load_denylist() -> set[str]:
    if not DENYLIST.exists():
        return set()
    words = set()
    for line in DENYLIST.read_text(encoding="utf-8").splitlines():
        word = line.strip().lower()
        if word and not word.startswith("#"):
            words.add(word)
    return words


def tier_for_length(length: int) -> int:
    if length <= 6:
        return 1
    if length <= 8:
        return 2
    return 3


def normalize_word(raw: str) -> str:
    word = raw.strip()
    if not word:
        return ""
    # Wordnik list wraps each word in quotes. Strip a single leading/trailing quote.
    word = STRIP_QUOTES.sub("", word)
    return word.strip().lower()


def build_from_wordlist() -> list[dict[str, object]]:
    propernames = load_propernames()
    denylist = load_denylist()

    curated = []
    seen = set()

    for line in WORDLIST.read_text(encoding="utf-8", errors="ignore").splitlines():
        word = normalize_word(line)
        if not word:
            continue
        if word in seen:
            continue
        if len(word) < 4 or len(word) > 12:
            continue
        if not ALPHA.match(word):
            continue
        if word in propernames:
            continue
        if word in denylist:
            continue
        curated.append({"word": word, "tier": tier_for_length(len(word))})
        seen.add(word)

    return curated


def curate_existing() -> list[dict[str, object]]:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    propernames = load_propernames()
    denylist = load_denylist()

    curated = []
    seen = set()

    for entry in data:
        word = normalize_word(str(entry.get("word", "")))
        tier = int(entry.get("tier", 1))
        if not word:
            continue
        if word in seen:
            continue
        if len(word) < 4 or len(word) > 12:
            continue
        if not ALPHA.match(word):
            continue
        if word in propernames:
            continue
        if word in denylist:
            continue

        curated.append({"word": word, "tier": tier})
        seen.add(word)

    return curated


def main() -> None:
    if WORDLIST.exists():
        curated = build_from_wordlist()
        source_count = sum(1 for _ in WORDLIST.read_text(encoding="utf-8", errors="ignore").splitlines() if _.strip())
        source_label = str(WORDLIST)
    else:
        curated = curate_existing()
        source_count = len(json.loads(SOURCE.read_text(encoding="utf-8")))
        source_label = str(SOURCE)

    SOURCE.write_text(json.dumps(curated, ensure_ascii=True), encoding="utf-8")
    print(f"Curated {len(curated)} words (from {source_count} in {source_label}).")


if __name__ == "__main__":
    main()
