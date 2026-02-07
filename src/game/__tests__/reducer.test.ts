import { describe, it, expect, beforeAll, vi } from 'vitest';
import { gameReducer, createInitialState } from '../reducer';
import type { GameState, Player } from '../types';
import { loadDictionary } from '../dictionary';

const MOCK_DICTIONARY = [
  { word: 'HELLO', tier: 1 },
  { word: 'WORLD', tier: 1 },
  { word: 'HEDGE', tier: 1 },
  { word: 'HAPPY', tier: 1 },
  { word: 'BRAVE', tier: 2 },
  { word: 'QUEST', tier: 2 },
];

beforeAll(async () => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(MOCK_DICTIONARY),
  }) as any;
  await loadDictionary();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setupPlayingState(overrides?: Partial<GameState>): GameState {
  const base = createInitialState();
  const players: Player[] = [
    {
      id: 'human', name: 'You', word: 'HELLO', revealedMask: [false, true, false, false, false],
      freeLetterIndex: 1, eliminated: false, isAI: false, difficulty: 'medium',
    },
    {
      id: 'ai-1', name: 'AI 1', word: 'WORLD', revealedMask: [false, false, false, true, false],
      freeLetterIndex: 3, eliminated: false, isAI: true, difficulty: 'medium',
      aiState: { letterTracking: {} },
    },
    {
      id: 'ai-2', name: 'AI 2', word: 'BRAVE', revealedMask: [true, false, false, false, false],
      freeLetterIndex: 0, eliminated: false, isAI: true, difficulty: 'medium',
      aiState: { letterTracking: {} },
    },
    {
      id: 'ai-3', name: 'AI 3', word: 'QUEST', revealedMask: [false, false, false, false, true],
      freeLetterIndex: 4, eliminated: false, isAI: true, difficulty: 'medium',
      aiState: { letterTracking: {} },
    },
  ];
  return {
    ...base,
    phase: 'playing',
    players,
    currentPlayerIndex: 0,
    turnNumber: 1,
    ...overrides,
  };
}

/** Like setupPlayingState but with fully-initialized AI letterTracking per opponent. */
function setupPlayingStateWithTracking(): GameState {
  const state = setupPlayingState();
  const players = state.players.map(p => {
    if (!p.isAI) return p;
    const letterTracking: Record<string, { askedLetters: Set<string>; candidateWords: string[]; guessedWords: Set<string> }> = {};
    for (const opp of state.players) {
      if (opp.id !== p.id) {
        letterTracking[opp.id] = { askedLetters: new Set(), candidateWords: [], guessedWords: new Set() };
      }
    }
    return { ...p, aiState: { letterTracking } };
  });
  return { ...state, players };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createInitialState', () => {
  it('returns a valid initial state', () => {
    const state = createInitialState();
    expect(state.phase).toBe('title');
    expect(state.players).toHaveLength(0);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.turnNumber).toBe(0);
    expect(state.log).toHaveLength(0);
    expect(state.winner).toBeNull();
    expect(state.pendingPenalty).toBe(false);
    expect(state.penaltyPlayerId).toBeNull();
  });
});

describe('gameReducer', () => {
  // ── START_GAME ────────────────────────────────────────────────────────────
  describe('START_GAME', () => {
    it('creates 4 players and transitions to word_selection', () => {
      const state = createInitialState();
      const next = gameReducer(state, { type: 'START_GAME', difficulty: 'medium' });
      expect(next.phase).toBe('word_selection');
      expect(next.players).toHaveLength(4);
      expect(next.difficulty).toBe('medium');
    });

    it('creates human as first player and 3 AIs', () => {
      const state = createInitialState();
      const next = gameReducer(state, { type: 'START_GAME', difficulty: 'easy' });
      expect(next.players[0].id).toBe('human');
      expect(next.players[0].isAI).toBe(false);
      expect(next.players.filter(p => p.isAI)).toHaveLength(3);
    });

    it('initializes AI state for AI players', () => {
      const state = createInitialState();
      const next = gameReducer(state, { type: 'START_GAME', difficulty: 'hard' });
      for (const p of next.players) {
        if (p.isAI) {
          expect(p.aiState).toBeDefined();
          expect(p.aiState!.letterTracking).toEqual({});
        } else {
          expect(p.aiState).toBeUndefined();
        }
      }
    });

    it('resets all game fields', () => {
      const state = createInitialState();
      const next = gameReducer(state, { type: 'START_GAME', difficulty: 'medium' });
      expect(next.turnNumber).toBe(0);
      expect(next.log).toHaveLength(0);
      expect(next.winner).toBeNull();
      expect(next.pendingPenalty).toBe(false);
    });
  });

  // ── SET_WORD ──────────────────────────────────────────────────────────────
  describe('SET_WORD', () => {
    it('sets a player word and revealed mask', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'medium' });
      state = gameReducer(state, {
        type: 'SET_WORD', playerId: 'human', word: 'HELLO', freeLetterIndex: 2,
      });
      const human = state.players.find(p => p.id === 'human')!;
      expect(human.word).toBe('HELLO');
      expect(human.revealedMask).toEqual([false, false, true, false, false]);
      expect(human.freeLetterIndex).toBe(2);
    });

    it('uppercases the word', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'medium' });
      state = gameReducer(state, {
        type: 'SET_WORD', playerId: 'human', word: 'hello', freeLetterIndex: 0,
      });
      expect(state.players.find(p => p.id === 'human')!.word).toBe('HELLO');
    });

    it('only modifies the target player', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'medium' });
      state = gameReducer(state, {
        type: 'SET_WORD', playerId: 'ai-1', word: 'TEST', freeLetterIndex: 0,
      });
      expect(state.players.find(p => p.id === 'ai-1')!.word).toBe('TEST');
      expect(state.players.find(p => p.id === 'human')!.word).toBe('');
    });
  });

  // ── BEGIN_PLAY ────────────────────────────────────────────────────────────
  describe('BEGIN_PLAY', () => {
    it('transitions to playing phase', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'medium' });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'human', word: 'HELLO', freeLetterIndex: 0 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-1', word: 'WORLD', freeLetterIndex: 0 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-2', word: 'BRAVE', freeLetterIndex: 0 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-3', word: 'QUEST', freeLetterIndex: 0 });
      state = gameReducer(state, { type: 'BEGIN_PLAY' });
      expect(state.phase).toBe('playing');
      expect(state.turnNumber).toBe(1);
      expect(state.currentPlayerIndex).toBe(0);
    });

    it('shuffles player order', () => {
      // Run multiple times and check that at least one order is different
      const orders: string[][] = [];
      for (let i = 0; i < 20; i++) {
        let state = createInitialState();
        state = gameReducer(state, { type: 'START_GAME', difficulty: 'medium' });
        state = gameReducer(state, { type: 'SET_WORD', playerId: 'human', word: 'HELLO', freeLetterIndex: 0 });
        state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-1', word: 'WORLD', freeLetterIndex: 0 });
        state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-2', word: 'BRAVE', freeLetterIndex: 0 });
        state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-3', word: 'QUEST', freeLetterIndex: 0 });
        state = gameReducer(state, { type: 'BEGIN_PLAY' });
        orders.push(state.players.map(p => p.id));
      }
      // At least 2 different orderings should appear in 20 runs
      const uniqueOrders = new Set(orders.map(o => o.join(',')));
      expect(uniqueOrders.size).toBeGreaterThan(1);
    });

    it('initializes AI letter tracking for each opponent', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'medium' });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'human', word: 'HELLO', freeLetterIndex: 0 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-1', word: 'WORLD', freeLetterIndex: 0 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-2', word: 'BRAVE', freeLetterIndex: 0 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-3', word: 'QUEST', freeLetterIndex: 0 });
      state = gameReducer(state, { type: 'BEGIN_PLAY' });
      for (const p of state.players) {
        if (p.isAI && p.aiState) {
          const trackingKeys = Object.keys(p.aiState.letterTracking);
          // Should track 3 opponents (everyone except self)
          expect(trackingKeys).toHaveLength(3);
          expect(trackingKeys).not.toContain(p.id);
        }
      }
    });

    it('hard mode: seeds candidate words using revealed letters', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'hard' });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'human', word: 'HELLO', freeLetterIndex: 1 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-1', word: 'WORLD', freeLetterIndex: 3 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-2', word: 'BRAVE', freeLetterIndex: 0 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-3', word: 'QUEST', freeLetterIndex: 4 });
      state = gameReducer(state, { type: 'BEGIN_PLAY' });

      const ai1 = state.players.find(p => p.id === 'ai-1')!;
      const tracking = ai1.aiState!.letterTracking['human'];
      expect(tracking.candidateWords.length).toBeGreaterThan(0);
      expect(tracking.candidateWords).toContain('HELLO');
      expect(tracking.candidateWords.every(w => w.length === 5 && w[1] === 'E')).toBe(true);
    });
  });

  // ── ASK_LETTER ────────────────────────────────────────────────────────────
  describe('ASK_LETTER', () => {
    it('reveals all matching letters on hit', () => {
      const state = setupPlayingState();
      // WORLD has 'O' at position 1
      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'human', targetId: 'ai-1', letter: 'O',
      });
      const ai1 = next.players.find(p => p.id === 'ai-1')!;
      expect(ai1.revealedMask[1]).toBe(true); // O at index 1
    });

    it('does not modify mask on miss', () => {
      const state = setupPlayingState();
      // WORLD does not contain 'Z'
      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'human', targetId: 'ai-1', letter: 'Z',
      });
      const ai1 = next.players.find(p => p.id === 'ai-1')!;
      expect(ai1.revealedMask).toEqual([false, false, false, true, false]);
    });

    it('logs a hit correctly', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'human', targetId: 'ai-1', letter: 'W',
      });
      const entry = next.log[next.log.length - 1];
      expect(entry.action).toBe('ask_letter');
      expect(entry.result).toBe('hit');
      expect(entry.letter).toBe('W');
      expect(entry.revealedPositions).toEqual([0]);
    });

    it('logs a miss correctly', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'human', targetId: 'ai-1', letter: 'Z',
      });
      const entry = next.log[next.log.length - 1];
      expect(entry.result).toBe('miss');
      expect(entry.revealedPositions).toBeUndefined();
    });

    it('keeps current player on hit (extra turn)', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'human', targetId: 'ai-1', letter: 'W',
      });
      expect(next.currentPlayerIndex).toBe(0); // Same player
      expect(next.turnNumber).toBe(1); // Same turn
    });

    it('advances to next player on miss', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'human', targetId: 'ai-1', letter: 'Z',
      });
      expect(next.currentPlayerIndex).toBe(1); // Next player
      expect(next.turnNumber).toBe(2); // New turn
    });

    it('reveals multiple positions for repeated letters', () => {
      const state = setupPlayingState();
      // HELLO has 'L' at positions 2 and 3
      // Ask ai-2 (BRAVE) for 'A' — only 1 position
      // Actually let's set up a direct scenario: target is human (HELLO)
      // ai-1 asks human for 'L'
      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'ai-1', targetId: 'human', letter: 'L',
      });
      const human = next.players.find(p => p.id === 'human')!;
      expect(human.revealedMask[2]).toBe(true);
      expect(human.revealedMask[3]).toBe(true);
      const entry = next.log[next.log.length - 1];
      expect(entry.revealedPositions).toEqual([2, 3]);
    });

    it('uppercases the letter', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'human', targetId: 'ai-1', letter: 'w',
      });
      expect(next.log[next.log.length - 1].letter).toBe('W');
      expect(next.log[next.log.length - 1].result).toBe('hit');
    });

    it('does not reveal already-revealed letters', () => {
      const state = setupPlayingState();
      // WORLD has L at index 3, already revealed (freeLetterIndex)
      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'human', targetId: 'ai-1', letter: 'L',
      });
      const ai1 = next.players.find(p => p.id === 'ai-1')!;
      expect(ai1.revealedMask[3]).toBe(true); // Was already true
      // Since L at index 3 was already revealed, and there are no other L positions,
      // it should be a miss (no NEW letters revealed)
      const entry = next.log[next.log.length - 1];
      expect(entry.result).toBe('miss');
    });

    // ── AI letter memory tracking ──────────────────────────────────────────
    it('records asked letter in AI actor\'s askedLetters', () => {
      const state = setupPlayingStateWithTracking();
      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'ai-1', targetId: 'human', letter: 'E',
      });
      const ai1 = next.players.find(p => p.id === 'ai-1')!;
      expect(ai1.aiState!.letterTracking['human'].askedLetters.has('E')).toBe(true);
    });

    it('accumulates multiple asked letters across turns', () => {
      let state = setupPlayingStateWithTracking();
      state = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'ai-1', targetId: 'human', letter: 'E',
      });
      state = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'ai-1', targetId: 'human', letter: 'Z',
      });
      const ai1 = state.players.find(p => p.id === 'ai-1')!;
      const asked = ai1.aiState!.letterTracking['human'].askedLetters;
      expect(asked.has('E')).toBe(true);
      expect(asked.has('Z')).toBe(true);
      expect(asked.size).toBe(2);
    });

    it('tracks letters per-opponent independently', () => {
      let state = setupPlayingStateWithTracking();
      state = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'ai-1', targetId: 'human', letter: 'E',
      });
      state = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'ai-1', targetId: 'ai-2', letter: 'R',
      });
      const ai1 = state.players.find(p => p.id === 'ai-1')!;
      expect(ai1.aiState!.letterTracking['human'].askedLetters.has('E')).toBe(true);
      expect(ai1.aiState!.letterTracking['human'].askedLetters.has('R')).toBe(false);
      expect(ai1.aiState!.letterTracking['ai-2'].askedLetters.has('R')).toBe(true);
      expect(ai1.aiState!.letterTracking['ai-2'].askedLetters.has('E')).toBe(false);
    });

    it('does not modify non-actor AI players\' tracking', () => {
      const state = setupPlayingStateWithTracking();
      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'ai-1', targetId: 'human', letter: 'E',
      });
      const ai2 = next.players.find(p => p.id === 'ai-2')!;
      expect(ai2.aiState!.letterTracking['human'].askedLetters.size).toBe(0);
    });

    it('hard mode: shares asked letters across all AIs', () => {
      const state = setupPlayingStateWithTracking();
      const hardState: GameState = {
        ...state,
        difficulty: 'hard',
        players: state.players.map(p => (p.isAI ? { ...p, difficulty: 'hard' } : p)),
      };
      const next = gameReducer(hardState, {
        type: 'ASK_LETTER', actorId: 'ai-1', targetId: 'human', letter: 'E',
      });
      const ai2 = next.players.find(p => p.id === 'ai-2')!;
      expect(ai2.aiState!.letterTracking['human'].askedLetters.has('E')).toBe(true);
    });

    it('hard mode: updates candidate words after a hit and shares across AIs', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'hard' });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'human', word: 'HELLO', freeLetterIndex: 1 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-1', word: 'WORLD', freeLetterIndex: 3 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-2', word: 'BRAVE', freeLetterIndex: 0 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-3', word: 'QUEST', freeLetterIndex: 4 });
      state = gameReducer(state, { type: 'BEGIN_PLAY' });

      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'ai-1', targetId: 'human', letter: 'L',
      });

      const ai2 = next.players.find(p => p.id === 'ai-2')!;
      const candidates = ai2.aiState!.letterTracking['human'].candidateWords;
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates.every(w => w[1] === 'E' && w[2] === 'L' && w[3] === 'L')).toBe(true);
    });

    it('does not crash when human is the actor (no aiState)', () => {
      const state = setupPlayingStateWithTracking();
      const next = gameReducer(state, {
        type: 'ASK_LETTER', actorId: 'human', targetId: 'ai-1', letter: 'W',
      });
      const human = next.players.find(p => p.id === 'human')!;
      expect(human.aiState).toBeUndefined();
    });
  });

  // ── GUESS_WORD ────────────────────────────────────────────────────────────
  describe('GUESS_WORD', () => {
    it('eliminates target on correct guess', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, {
        type: 'GUESS_WORD', actorId: 'human', targetId: 'ai-1', guessedWord: 'WORLD',
      });
      const ai1 = next.players.find(p => p.id === 'ai-1')!;
      expect(ai1.eliminated).toBe(true);
      expect(ai1.revealedMask.every(Boolean)).toBe(true);
    });

    it('logs correct guess', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, {
        type: 'GUESS_WORD', actorId: 'human', targetId: 'ai-1', guessedWord: 'WORLD',
      });
      const entry = next.log[next.log.length - 1];
      expect(entry.result).toBe('correct_guess');
      expect(entry.guessedWord).toBe('WORLD');
    });

    it('sets pending penalty on wrong guess', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, {
        type: 'GUESS_WORD', actorId: 'human', targetId: 'ai-1', guessedWord: 'WRONG',
      });
      expect(next.pendingPenalty).toBe(true);
      expect(next.penaltyPlayerId).toBe('human');
    });

    it('logs wrong guess', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, {
        type: 'GUESS_WORD', actorId: 'human', targetId: 'ai-1', guessedWord: 'WRONG',
      });
      const entry = next.log[next.log.length - 1];
      expect(entry.result).toBe('wrong_guess');
      expect(entry.guessedWord).toBe('WRONG');
    });

    it('is case-insensitive', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, {
        type: 'GUESS_WORD', actorId: 'human', targetId: 'ai-1', guessedWord: 'world',
      });
      expect(next.players.find(p => p.id === 'ai-1')!.eliminated).toBe(true);
    });

    it('detects winner when only one player remains', () => {
      // Set up state where 2 AIs are already eliminated
      const state = setupPlayingState();
      const modState = {
        ...state,
        players: state.players.map(p =>
          p.id === 'ai-2' || p.id === 'ai-3'
            ? { ...p, eliminated: true }
            : p
        ),
      };
      const next = gameReducer(modState, {
        type: 'GUESS_WORD', actorId: 'human', targetId: 'ai-1', guessedWord: 'WORLD',
      });
      expect(next.winner).toBe('human');
      expect(next.phase).toBe('finished');
    });

    it('does not set winner when multiple players remain', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, {
        type: 'GUESS_WORD', actorId: 'human', targetId: 'ai-1', guessedWord: 'WORLD',
      });
      expect(next.winner).toBeNull();
      expect(next.phase).toBe('playing');
    });
  });

  // ── CHOOSE_PENALTY ────────────────────────────────────────────────────────
  describe('CHOOSE_PENALTY', () => {
    it('reveals the chosen letter', () => {
      let state = setupPlayingState();
      // First, trigger a wrong guess to create pending penalty
      state = gameReducer(state, {
        type: 'GUESS_WORD', actorId: 'human', targetId: 'ai-1', guessedWord: 'WRONG',
      });
      expect(state.pendingPenalty).toBe(true);

      // Choose to reveal letter at index 0 of human's word ('H' in HELLO)
      const next = gameReducer(state, {
        type: 'CHOOSE_PENALTY', playerId: 'human', letterIndex: 0,
      });
      const human = next.players.find(p => p.id === 'human')!;
      expect(human.revealedMask[0]).toBe(true);
      expect(next.pendingPenalty).toBe(false);
      expect(next.penaltyPlayerId).toBeNull();
    });

    it('advances to next player after penalty', () => {
      let state = setupPlayingState();
      state = gameReducer(state, {
        type: 'GUESS_WORD', actorId: 'human', targetId: 'ai-1', guessedWord: 'WRONG',
      });
      const next = gameReducer(state, {
        type: 'CHOOSE_PENALTY', playerId: 'human', letterIndex: 0,
      });
      expect(next.currentPlayerIndex).toBe(1);
      expect(next.turnNumber).toBe(2);
    });

    it('updates the last log entry with penalty position', () => {
      let state = setupPlayingState();
      state = gameReducer(state, {
        type: 'GUESS_WORD', actorId: 'human', targetId: 'ai-1', guessedWord: 'WRONG',
      });
      const next = gameReducer(state, {
        type: 'CHOOSE_PENALTY', playerId: 'human', letterIndex: 3,
      });
      const lastEntry = next.log[next.log.length - 1];
      expect(lastEntry.penaltyPosition).toBe(3);
    });

    it('hard mode: updates candidate words when a penalty reveals a letter', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME', difficulty: 'hard' });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'human', word: 'HELLO', freeLetterIndex: 1 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-1', word: 'WORLD', freeLetterIndex: 3 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-2', word: 'BRAVE', freeLetterIndex: 0 });
      state = gameReducer(state, { type: 'SET_WORD', playerId: 'ai-3', word: 'QUEST', freeLetterIndex: 4 });
      state = gameReducer(state, { type: 'BEGIN_PLAY' });

      state = gameReducer(state, {
        type: 'GUESS_WORD', actorId: 'human', targetId: 'ai-1', guessedWord: 'WRONG',
      });

      const next = gameReducer(state, {
        type: 'CHOOSE_PENALTY', playerId: 'human', letterIndex: 0,
      });

      const ai1 = next.players.find(p => p.id === 'ai-1')!;
      const candidates = ai1.aiState!.letterTracking['human'].candidateWords;
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates.every(w => w[0] === 'H')).toBe(true);
    });
  });

  // ── NEXT_TURN ─────────────────────────────────────────────────────────────
  describe('NEXT_TURN', () => {
    it('advances to the next active player', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, { type: 'NEXT_TURN' });
      expect(next.currentPlayerIndex).toBe(1);
      expect(next.turnNumber).toBe(2);
    });

    it('skips eliminated players', () => {
      const state = setupPlayingState({
        players: setupPlayingState().players.map(p =>
          p.id === 'ai-1' ? { ...p, eliminated: true } : p
        ),
      });
      const next = gameReducer(state, { type: 'NEXT_TURN' });
      expect(next.currentPlayerIndex).toBe(2); // Skips eliminated ai-1
    });

    it('wraps around to the beginning', () => {
      const state = setupPlayingState({ currentPlayerIndex: 3 });
      const next = gameReducer(state, { type: 'NEXT_TURN' });
      expect(next.currentPlayerIndex).toBe(0);
    });
  });

  // ── RESET ─────────────────────────────────────────────────────────────────
  describe('RESET', () => {
    it('resets back to initial state', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, { type: 'RESET' });
      expect(next.phase).toBe('title');
      expect(next.players).toHaveLength(0);
      expect(next.turnNumber).toBe(0);
    });
  });

  // ── Default ───────────────────────────────────────────────────────────────
  describe('unknown action', () => {
    it('returns current state unchanged', () => {
      const state = setupPlayingState();
      const next = gameReducer(state, { type: 'UNKNOWN' } as any);
      expect(next).toBe(state);
    });
  });
});
