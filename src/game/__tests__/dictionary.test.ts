import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  loadDictionary,
  isValidWord,
  getWordsByTier,
  getWordsOfLength,
  filterCandidates,
  isDictionaryLoaded,
  getWordCount,
} from '../dictionary';

// Mock the fetch API to return a test dictionary
const MOCK_DICTIONARY = [
  { word: 'ABLE', tier: 1 },
  { word: 'ALSO', tier: 1 },
  { word: 'BACK', tier: 1 },
  { word: 'BALL', tier: 1 },
  { word: 'HELLO', tier: 1 },
  { word: 'WORLD', tier: 1 },
  { word: 'BRAVE', tier: 2 },
  { word: 'QUEST', tier: 2 },
  { word: 'ABSTRACT', tier: 2 },
  { word: 'BEAUTIFUL', tier: 3 },
  { word: 'CHRONICLE', tier: 3 },
  { word: 'ABCDEFGHIJKL', tier: 3 }, // 12 letter word
];

beforeAll(async () => {
  // Mock global fetch
  globalThis.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(MOCK_DICTIONARY),
  }) as any;

  await loadDictionary();
});

describe('loadDictionary', () => {
  it('marks dictionary as loaded', () => {
    expect(isDictionaryLoaded()).toBe(true);
  });

  it('loads the correct word count', () => {
    expect(getWordCount()).toBe(MOCK_DICTIONARY.length);
  });
});

describe('isValidWord', () => {
  it('returns true for valid words (case-insensitive)', () => {
    expect(isValidWord('HELLO')).toBe(true);
    expect(isValidWord('hello')).toBe(true);
    expect(isValidWord('Hello')).toBe(true);
  });

  it('returns false for invalid words', () => {
    expect(isValidWord('ZZZZZ')).toBe(false);
    expect(isValidWord('NOTAWORD')).toBe(false);
    expect(isValidWord('')).toBe(false);
  });
});

describe('getWordsByTier', () => {
  it('returns tier 1 words', () => {
    const tier1 = getWordsByTier(1);
    expect(tier1).toContain('ABLE');
    expect(tier1).toContain('HELLO');
    expect(tier1).not.toContain('BRAVE');
  });

  it('returns tier 2 words', () => {
    const tier2 = getWordsByTier(2);
    expect(tier2).toContain('BRAVE');
    expect(tier2).toContain('ABSTRACT');
    expect(tier2).not.toContain('HELLO');
  });

  it('returns tier 3 words', () => {
    const tier3 = getWordsByTier(3);
    expect(tier3).toContain('BEAUTIFUL');
    expect(tier3).not.toContain('HELLO');
  });

  it('returns empty array for non-existent tier', () => {
    expect(getWordsByTier(4 as any)).toEqual([]);
  });
});

describe('getWordsOfLength', () => {
  it('returns words of a specific length', () => {
    const fiveLetterWords = getWordsOfLength(5);
    expect(fiveLetterWords).toContain('HELLO');
    expect(fiveLetterWords).toContain('WORLD');
    expect(fiveLetterWords).toContain('BRAVE');
    expect(fiveLetterWords).toContain('QUEST');
  });

  it('returns empty array for lengths with no words', () => {
    expect(getWordsOfLength(1)).toHaveLength(0);
    expect(getWordsOfLength(20)).toHaveLength(0);
  });
});

describe('filterCandidates', () => {
  it('filters by word length', () => {
    const candidates = filterCandidates(5, {}, new Set(), new Set());
    expect(candidates.every(w => w.length === 5)).toBe(true);
  });

  it('filters by known letters at positions', () => {
    const candidates = filterCandidates(5, { 0: 'H' }, new Set(), new Set());
    expect(candidates).toContain('HELLO');
    expect(candidates).not.toContain('WORLD');
  });

  it('filters out words with missing letters', () => {
    const candidates = filterCandidates(5, {}, new Set(['H']), new Set());
    expect(candidates).not.toContain('HELLO');
    expect(candidates).toContain('WORLD');
  });

  it('requires present letters', () => {
    const candidates = filterCandidates(5, {}, new Set(), new Set(['W']));
    expect(candidates).toContain('WORLD');
    expect(candidates).not.toContain('HELLO');
  });

  it('combines all filters', () => {
    const candidates = filterCandidates(
      5,
      { 0: 'W' },        // starts with W
      new Set(['H']),     // no H
      new Set(['R']),     // must have R
    );
    expect(candidates).toContain('WORLD');
    expect(candidates).not.toContain('HELLO');
    expect(candidates).not.toContain('BRAVE');
  });
});
