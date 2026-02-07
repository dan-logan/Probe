import type { DictionaryEntry } from './types';

// ─── Dictionary Store ────────────────────────────────────────────────────────

let dictionary: DictionaryEntry[] = [];
let wordSet: Set<string> = new Set();
let wordsByTier: Record<number, string[]> = { 1: [], 2: [], 3: [] };
let loaded = false;

// ─── Loading ─────────────────────────────────────────────────────────────────

/**
 * Load the dictionary from the bundled JSON file.
 * Should be called once at app startup.
 */
export async function loadDictionary(): Promise<void> {
  if (loaded) return;

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}dictionary.json`);
    const data: DictionaryEntry[] = await response.json();

    dictionary = data;
    wordSet = new Set(data.map(entry => entry.word.toUpperCase()));
    wordsByTier = { 1: [], 2: [], 3: [] };

    for (const entry of data) {
      const tier = entry.tier;
      if (wordsByTier[tier]) {
        wordsByTier[tier].push(entry.word.toUpperCase());
      }
    }

    loaded = true;
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    throw new Error('Dictionary failed to load. The game cannot start.');
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Check if a word exists in the dictionary. Case-insensitive. */
export function isValidWord(word: string): boolean {
  return wordSet.has(word.toUpperCase());
}

/** Get all words in a given frequency tier. */
export function getWordsByTier(tier: 1 | 2 | 3): string[] {
  return wordsByTier[tier] ?? [];
}

/** Get all dictionary words of a specific length. */
export function getWordsOfLength(length: number): string[] {
  return dictionary
    .filter(entry => entry.word.length === length)
    .map(entry => entry.word.toUpperCase());
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
export function getWordCount(): number {
  return dictionary.length;
}
