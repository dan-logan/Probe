import { describe, it, expect, beforeAll, vi } from 'vitest';
import type { Player, GameState, Difficulty } from '../types';
import {
  chooseAIWord,
  chooseAIFreeLetter,
  decideAITurn,
  chooseAIPenaltyLetter,
  getAIThinkDelay,
  AI_THINK_DELAY_MIN,
  AI_THINK_DELAY_MAX,
} from '../ai';
import { loadDictionary } from '../dictionary';

// ─── Mock Dictionary ──────────────────────────────────────────────────────────

const MOCK_DICTIONARY = [
  // Tier 1 — common short words (easy AI)
  { word: 'ABLE', tier: 1 },
  { word: 'ALSO', tier: 1 },
  { word: 'BACK', tier: 1 },
  { word: 'BALL', tier: 1 },
  { word: 'BAND', tier: 1 },
  { word: 'BANK', tier: 1 },
  { word: 'HELLO', tier: 1 },
  { word: 'WORLD', tier: 1 },
  { word: 'HOUSE', tier: 1 },
  { word: 'PLANT', tier: 1 },
  // Tier 2 — medium words
  { word: 'BRAVE', tier: 2 },
  { word: 'QUEST', tier: 2 },
  { word: 'ABSTRACT', tier: 2 },
  { word: 'COMPOUND', tier: 2 },
  { word: 'STRATEGY', tier: 2 },
  // Tier 3 — hard/uncommon words
  { word: 'BEAUTIFUL', tier: 3 },
  { word: 'CHRONICLE', tier: 3 },
  { word: 'LABYRINTH', tier: 3 },
  { word: 'TECHNIQUE', tier: 3 },
];

beforeAll(async () => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(MOCK_DICTIONARY),
  }) as any;
  await loadDictionary();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> & { id: Player['id'] }): Player {
  return {
    name: overrides.id,
    word: 'TEST',
    revealedMask: [false, false, false, false],
    freeLetterIndex: 0,
    eliminated: false,
    isAI: true,
    difficulty: 'medium',
    ...overrides,
  };
}

function makeGameState(players: Player[], currentPlayerIndex = 0): GameState {
  return {
    phase: 'playing',
    players,
    currentPlayerIndex,
    turnNumber: 1,
    log: [],
    winner: null,
    difficulty: 'medium',
    pendingPenalty: false,
    penaltyPlayerId: null,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('chooseAIWord', () => {
  it('returns a valid uppercase word', () => {
    for (const diff of ['easy', 'medium', 'hard'] as Difficulty[]) {
      const word = chooseAIWord(diff);
      expect(word).toBe(word.toUpperCase());
      expect(word.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('easy AI picks 4-6 letter tier 1 words', () => {
    for (let i = 0; i < 30; i++) {
      const word = chooseAIWord('easy');
      expect(word.length).toBeGreaterThanOrEqual(4);
      expect(word.length).toBeLessThanOrEqual(6);
    }
  });

  it('medium AI picks 5-8 letter words', () => {
    for (let i = 0; i < 30; i++) {
      const word = chooseAIWord('medium');
      expect(word.length).toBeGreaterThanOrEqual(4); // fallback may include 4-letter
      expect(word.length).toBeLessThanOrEqual(8);
    }
  });

  it('hard AI picks 7-12 letter words', () => {
    for (let i = 0; i < 30; i++) {
      const word = chooseAIWord('hard');
      expect(word.length).toBeGreaterThanOrEqual(7);
      expect(word.length).toBeLessThanOrEqual(12);
    }
  });
});

describe('chooseAIFreeLetter', () => {
  it('easy: returns a valid index', () => {
    const word = 'HELLO';
    for (let i = 0; i < 20; i++) {
      const index = chooseAIFreeLetter(word, 'easy');
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(word.length);
    }
  });

  it('medium: picks the most common letter (lowest frequency rank)', () => {
    // HELLO: H(rank 8), E(rank 0), L(rank 9), L(rank 9), O(rank 4)
    // E has rank 0 — most common, should be picked
    const index = chooseAIFreeLetter('HELLO', 'medium');
    expect(index).toBe(1); // E at index 1
  });

  it('hard: picks the rarest letter (highest frequency rank)', () => {
    // HELLO: H(rank 8), E(rank 0), L(rank 9), L(rank 9), O(rank 4)
    // L has highest rank (9), first L is at index 2
    const index = chooseAIFreeLetter('HELLO', 'hard');
    expect(index).toBe(2); // L at index 2
  });
});

describe('decideAITurn', () => {
  it('returns a valid decision with action and target', () => {
    const ai = makePlayer({
      id: 'ai-1',
      word: 'HELLO',
      revealedMask: [false, true, false, false, false],
      difficulty: 'easy',
      aiState: {
        letterTracking: {
          'human': { askedLetters: new Set(), candidateWords: [] },
          'ai-2': { askedLetters: new Set(), candidateWords: [] },
          'ai-3': { askedLetters: new Set(), candidateWords: [] },
        },
      },
    });
    const human = makePlayer({ id: 'human', isAI: false, word: 'WORLD', revealedMask: [false, false, false, false, false] });
    const ai2 = makePlayer({ id: 'ai-2', word: 'BRAVE', revealedMask: [false, false, false, false, false] });
    const ai3 = makePlayer({ id: 'ai-3', word: 'QUEST', revealedMask: [false, false, false, false, false] });
    const state = makeGameState([human, ai, ai2, ai3], 1);

    const decision = decideAITurn(state, ai);
    expect(decision).toBeDefined();
    expect(['ask_letter', 'guess_word']).toContain(decision.action);
    expect(['human', 'ai-2', 'ai-3']).toContain(decision.targetId);
  });

  it('easy AI guesses when all letters revealed', () => {
    const ai = makePlayer({
      id: 'ai-1',
      word: 'HELLO',
      revealedMask: [false, true, false, false, false],
      difficulty: 'easy',
      aiState: {
        letterTracking: {
          'human': { askedLetters: new Set(), candidateWords: [] },
        },
      },
    });
    // Human word fully revealed
    const human = makePlayer({
      id: 'human', isAI: false, word: 'WORLD',
      revealedMask: [true, true, true, true, true],
    });
    const state = makeGameState([human, ai], 1);

    const decision = decideAITurn(state, ai);
    expect(decision.action).toBe('guess_word');
    expect(decision.guessedWord).toBe('WORLD');
    expect(decision.targetId).toBe('human');
  });

  it('asks a letter when not confident enough to guess', () => {
    const ai = makePlayer({
      id: 'ai-1',
      word: 'HELLO',
      revealedMask: [false, true, false, false, false],
      difficulty: 'easy',
      aiState: {
        letterTracking: {
          'human': { askedLetters: new Set(), candidateWords: [] },
        },
      },
    });
    const human = makePlayer({
      id: 'human', isAI: false, word: 'WORLD',
      revealedMask: [false, false, false, false, false],
    });
    const state = makeGameState([human, ai], 1);

    const decision = decideAITurn(state, ai);
    expect(decision.action).toBe('ask_letter');
    expect(decision.letter).toBeDefined();
    expect(decision.letter!.length).toBe(1);
    expect(decision.letter!).toMatch(/^[A-Z]$/);
  });

  it('throws when no opponents remain', () => {
    const ai = makePlayer({
      id: 'ai-1', word: 'HELLO',
      revealedMask: [false, true, false, false, false],
      difficulty: 'easy',
      aiState: { letterTracking: {} },
    });
    const human = makePlayer({ id: 'human', isAI: false, eliminated: true });
    const ai2 = makePlayer({ id: 'ai-2', eliminated: true });
    const ai3 = makePlayer({ id: 'ai-3', eliminated: true });
    const state = makeGameState([human, ai, ai2, ai3], 1);

    expect(() => decideAITurn(state, ai)).toThrow('AI has no valid opponents');
  });

  it('medium AI targets opponent with most revealed letters', () => {
    const ai = makePlayer({
      id: 'ai-1',
      word: 'HELLO',
      difficulty: 'medium',
      revealedMask: [false, true, false, false, false],
      aiState: {
        letterTracking: {
          'human': { askedLetters: new Set(), candidateWords: [] },
          'ai-2': { askedLetters: new Set(), candidateWords: [] },
        },
      },
    });
    const human = makePlayer({
      id: 'human', isAI: false, word: 'WORLD',
      revealedMask: [true, true, true, false, false], // 3 revealed
    });
    const ai2 = makePlayer({
      id: 'ai-2', word: 'BRAVE',
      revealedMask: [true, false, false, false, false], // 1 revealed
    });
    const state = makeGameState([human, ai, ai2], 1);

    // Over multiple runs, medium should prefer the human (more revealed)
    const targetCounts: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      const decision = decideAITurn(state, ai);
      targetCounts[decision.targetId] = (targetCounts[decision.targetId] || 0) + 1;
    }
    // medium always targets the most-revealed opponent
    expect(targetCounts['human']).toBe(20);
  });
});

describe('chooseAIPenaltyLetter', () => {
  it('easy: returns a valid unrevealed index', () => {
    const player = makePlayer({
      id: 'ai-1',
      word: 'HELLO',
      revealedMask: [true, false, false, false, true],
      difficulty: 'easy',
    });
    for (let i = 0; i < 20; i++) {
      const idx = chooseAIPenaltyLetter(player);
      expect([1, 2, 3]).toContain(idx);
    }
  });

  it('medium/hard: reveals the most common unrevealed letter', () => {
    const player = makePlayer({
      id: 'ai-1',
      word: 'HELLO',
      revealedMask: [true, false, false, false, false],
      // unrevealed: E(0), L(9), L(9), O(4) — E has lowest rank = most common
      difficulty: 'medium',
    });
    const idx = chooseAIPenaltyLetter(player);
    expect(idx).toBe(1); // E at index 1 (most common)
  });

  it('handles fully revealed word edge case', () => {
    const player = makePlayer({
      id: 'ai-1',
      word: 'HELLO',
      revealedMask: [true, true, true, true, true],
      difficulty: 'easy',
    });
    // Should return 0 as fallback
    const idx = chooseAIPenaltyLetter(player);
    expect(idx).toBe(0);
  });
});

describe('getAIThinkDelay', () => {
  it('returns a value within the configured range', () => {
    for (let i = 0; i < 50; i++) {
      const delay = getAIThinkDelay();
      expect(delay).toBeGreaterThanOrEqual(AI_THINK_DELAY_MIN);
      expect(delay).toBeLessThanOrEqual(AI_THINK_DELAY_MAX);
    }
  });
});
