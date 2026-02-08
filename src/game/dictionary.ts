import type { Difficulty } from './types';

// ─── Dictionary Store ────────────────────────────────────────────────────────

type DictionaryData = {
  words: string[];
  wordSet: Set<string>;
  wordsByLength: Map<number, string[]>;
};

const DICTIONARY_FILES: Record<Difficulty, string> = {
  easy: 'dictionary-easy.txt',
  medium: 'dictionary-medium.txt',
  hard: 'dictionary-hard.txt',
};

let dictionaries: Record<Difficulty, DictionaryData> = {
  easy: { words: [], wordSet: new Set(), wordsByLength: new Map() },
  medium: { words: [], wordSet: new Set(), wordsByLength: new Map() },
  hard: { words: [], wordSet: new Set(), wordsByLength: new Map() },
};

let activeDifficulty: Difficulty = 'medium';
let loaded = false;

// ─── Loading ─────────────────────────────────────────────────────────────────

/**
 * Load the dictionaries from bundled word list files.
 * Should be called once at app startup.
 */
export async function loadDictionary(): Promise<void> {
  if (loaded) return;

  try {
    const [easyWords, mediumWords, hardWords] = await Promise.all([
      loadWordList(DICTIONARY_FILES.easy),
      loadWordList(DICTIONARY_FILES.medium),
      loadWordList(DICTIONARY_FILES.hard),
    ]);

    dictionaries = {
      easy: buildDictionaryData(easyWords),
      medium: buildDictionaryData(mediumWords),
      hard: buildDictionaryData(hardWords),
    };

    loaded = true;
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    throw new Error('Dictionary failed to load. The game cannot start.');
  }
}

// ─── Queries ────────────────────────────────────────────────────────────────

/** Check if a word exists in the dictionary. Case-insensitive. */
export function isValidWord(word: string, difficulty: Difficulty = activeDifficulty): boolean {
  return dictionaries[difficulty]?.wordSet.has(word.toUpperCase()) ?? false;
}

/** Get all words for a difficulty (easy/medium/hard). */
export function getWordsForDifficulty(difficulty: Difficulty = activeDifficulty): string[] {
  return dictionaries[difficulty]?.words ?? [];
}

/** Get all dictionary words of a specific length. */
export function getWordsOfLength(length: number, difficulty: Difficulty = activeDifficulty): string[] {
  return dictionaries[difficulty]?.wordsByLength.get(length) ?? [];
}

/**
 * Filter candidate words based on known information about an opponent's word.
 * Used by hard AI for information-theoretic letter selection.
 *
 * @param wordLength - Length of the target word
 * @param knownLetters - Map of position → letter for revealed positions
 * @param missingLetters - Letters known NOT to be in the word
 * @param presentLetters - Letters known to be IN the word (from hits)
 */
export function filterCandidates(
  wordLength: number,
  knownLetters: Record<number, string>,
  missingLetters: Set<string>,
  presentLetters: Set<string>,
): string[] {
  return getWordsOfLength(wordLength).filter(word => {
    // Check that known letters match
    for (const [pos, letter] of Object.entries(knownLetters)) {
      if (word[Number(pos)] !== letter) return false;
    }

    // Check that missing letters are not present
    for (const letter of missingLetters) {
      if (word.includes(letter)) return false;
    }

    // Check that present letters exist somewhere
    for (const letter of presentLetters) {
      if (!word.includes(letter)) return false;
    }

    return true;
  });
}

/** Check if the dictionary has been loaded. */
export function isDictionaryLoaded(): boolean {
  return loaded;
}

/** Get total word count (for display purposes). */
export function getWordCount(difficulty: Difficulty = activeDifficulty): number {
  return dictionaries[difficulty]?.words.length ?? 0;
}

/** Set which dictionary difficulty the game should use. */
export function setActiveDictionary(difficulty: Difficulty): void {
  activeDifficulty = difficulty;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function loadWordList(filename: string): Promise<string[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}${filename}`);
  const text = await response.text();
  const words: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const word = rawLine.trim().toUpperCase();
    if (!word) continue;
    if (!/^[A-Z]{4,12}$/.test(word)) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    words.push(word);
  }

  return words;
}

function buildDictionaryData(words: string[]): DictionaryData {
  const wordSet = new Set(words);
  const wordsByLength = new Map<number, string[]>();

  for (const word of words) {
    const length = word.length;
    const bucket = wordsByLength.get(length);
    if (bucket) {
      bucket.push(word);
    } else {
      wordsByLength.set(length, [word]);
    }
  }

  return { words, wordSet, wordsByLength };
}
