import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  loadDictionary,
  isValidWord,
  getWordsForDifficulty,
  getWordsOfLength,
  filterCandidates,
  isDictionaryLoaded,
  getWordCount,
  setActiveDictionary,
} from '../dictionary';

const EASY_WORDS = ['ABLE', 'ALSO', 'BACK', 'BALL', 'HELLO', 'WORLD'];
const MEDIUM_WORDS = [...EASY_WORDS, 'BRAVE', 'QUEST', 'ABSTRACT'];
const HARD_WORDS = [...MEDIUM_WORDS, 'BEAUTIFUL', 'CHRONICLE', 'ABCDEFGHIJKL'];

const EASY_TEXT = EASY_WORDS.join('\n');
const MEDIUM_TEXT = MEDIUM_WORDS.join('\n');
const HARD_TEXT = HARD_WORDS.join('\n');

beforeAll(async () => {
  globalThis.fetch = vi.fn((url: string) => {
    if (url.endsWith('dictionary-easy.txt')) {
      return Promise.resolve({ text: () => Promise.resolve(EASY_TEXT) });
    }
    if (url.endsWith('dictionary-medium.txt')) {
      return Promise.resolve({ text: () => Promise.resolve(MEDIUM_TEXT) });
    }
    if (url.endsWith('dictionary-hard.txt')) {
      return Promise.resolve({ text: () => Promise.resolve(HARD_TEXT) });
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  }) as any;

  await loadDictionary();
});

describe('loadDictionary', () => {
  it('marks dictionary as loaded', () => {
    expect(isDictionaryLoaded()).toBe(true);
  });

  it('loads the correct word count per difficulty', () => {
    expect(getWordCount('easy')).toBe(EASY_WORDS.length);
    expect(getWordCount('medium')).toBe(MEDIUM_WORDS.length);
    expect(getWordCount('hard')).toBe(HARD_WORDS.length);
  });
});

describe('isValidWord', () => {
  it('returns true for valid words (case-insensitive) in active difficulty', () => {
    setActiveDictionary('easy');
    expect(isValidWord('HELLO')).toBe(true);
    expect(isValidWord('hello')).toBe(true);
  });

  it('respects difficulty lists', () => {
    setActiveDictionary('easy');
    expect(isValidWord('BRAVE')).toBe(false);
    setActiveDictionary('medium');
    expect(isValidWord('BRAVE')).toBe(true);
    setActiveDictionary('hard');
    expect(isValidWord('CHRONICLE')).toBe(true);
  });

  it('returns false for invalid words', () => {
    setActiveDictionary('hard');
    expect(isValidWord('ZZZZZ')).toBe(false);
    expect(isValidWord('NOTAWORD')).toBe(false);
    expect(isValidWord('')).toBe(false);
  });
});

describe('getWordsForDifficulty', () => {
  it('returns words for easy', () => {
    const easy = getWordsForDifficulty('easy');
    expect(easy).toContain('ABLE');
    expect(easy).toContain('HELLO');
    expect(easy).not.toContain('BRAVE');
  });

  it('returns words for medium', () => {
    const medium = getWordsForDifficulty('medium');
    expect(medium).toContain('BRAVE');
    expect(medium).toContain('ABSTRACT');
    expect(medium).not.toContain('CHRONICLE');
  });

  it('returns words for hard', () => {
    const hard = getWordsForDifficulty('hard');
    expect(hard).toContain('BEAUTIFUL');
    expect(hard).toContain('CHRONICLE');
  });
});

describe('getWordsOfLength', () => {
  it('returns words of a specific length', () => {
    const fiveLetterWords = getWordsOfLength(5, 'hard');
    expect(fiveLetterWords).toContain('HELLO');
    expect(fiveLetterWords).toContain('WORLD');
    expect(fiveLetterWords).toContain('BRAVE');
    expect(fiveLetterWords).toContain('QUEST');
  });

  it('returns empty array for lengths with no words', () => {
    expect(getWordsOfLength(1, 'hard')).toHaveLength(0);
    expect(getWordsOfLength(20, 'hard')).toHaveLength(0);
  });
});

describe('filterCandidates', () => {
  it('filters by word length', () => {
    setActiveDictionary('hard');
    const candidates = filterCandidates(5, {}, new Set(), new Set());
    expect(candidates.every(w => w.length === 5)).toBe(true);
  });

  it('filters by known letters at positions', () => {
    setActiveDictionary('hard');
    const candidates = filterCandidates(5, { 0: 'H' }, new Set(), new Set());
    expect(candidates).toContain('HELLO');
    expect(candidates).not.toContain('WORLD');
  });

  it('filters out words with missing letters', () => {
    setActiveDictionary('hard');
    const candidates = filterCandidates(5, {}, new Set(['H']), new Set());
    expect(candidates).not.toContain('HELLO');
    expect(candidates).toContain('WORLD');
  });

  it('requires present letters', () => {
    setActiveDictionary('hard');
    const candidates = filterCandidates(5, {}, new Set(), new Set(['W']));
    expect(candidates).toContain('WORLD');
    expect(candidates).not.toContain('HELLO');
  });

  it('combines all filters', () => {
    setActiveDictionary('hard');
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
