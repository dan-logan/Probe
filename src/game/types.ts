// ─── Game Phase ──────────────────────────────────────────────────────────────

export type GamePhase = 'title' | 'word_selection' | 'playing' | 'finished';

export type Difficulty = 'easy' | 'medium' | 'hard';

// ─── Player ──────────────────────────────────────────────────────────────────

export type PlayerId = 'human' | 'ai-1' | 'ai-2' | 'ai-3';

export interface Player {
  id: PlayerId;
  name: string;
  word: string;
  revealedMask: boolean[];     // per-letter: true = visible to everyone
  freeLetterIndex: number;     // index of the free letter in the word
  eliminated: boolean;
  isAI: boolean;
  difficulty: Difficulty;
  aiState?: AIState;           // AI internal state (not displayed to player)
}

// ─── AI State ────────────────────────────────────────────────────────────────

export interface AIState {
  /** Per-opponent tracking, keyed by opponent player id */
  letterTracking: Record<string, LetterTrack>;
}

export interface LetterTrack {
  /** Letters already asked against this opponent */
  askedLetters: Set<string>;
  /** Remaining possible words — used by hard AI for candidate filtering */
  candidateWords: string[];
  /** Words already guessed for this opponent (by any player) */
  guessedWords: Set<string>;
}

// ─── Log ─────────────────────────────────────────────────────────────────────

export type ActionType = 'ask_letter' | 'guess_word';
export type ActionResult = 'hit' | 'miss' | 'correct_guess' | 'wrong_guess';

export interface LogEntry {
  turn: number;
  actorId: PlayerId;
  action: ActionType;
  targetId: PlayerId;
  letter?: string;             // set when action = 'ask_letter'
  guessedWord?: string;        // set when action = 'guess_word'
  result: ActionResult;
  revealedPositions?: number[];  // which slots flipped on a hit
  penaltyPosition?: number;      // which slot the guesser revealed on a wrong guess
}

// ─── Game State ──────────────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  turnNumber: number;
  log: LogEntry[];
  winner: PlayerId | null;
  difficulty: Difficulty;
  /** True while waiting for the human to pick a penalty letter after a wrong guess */
  pendingPenalty: boolean;
  /** The player ID who needs to pick a penalty letter */
  penaltyPlayerId: PlayerId | null;
}

// ─── Actions (Reducer) ──────────────────────────────────────────────────────

export type GameAction =
  | { type: 'START_GAME'; difficulty: Difficulty }
  | { type: 'SET_WORD'; playerId: PlayerId; word: string; freeLetterIndex: number }
  | { type: 'BEGIN_PLAY' }
  | { type: 'ASK_LETTER'; actorId: PlayerId; targetId: PlayerId; letter: string }
  | { type: 'GUESS_WORD'; actorId: PlayerId; targetId: PlayerId; guessedWord: string }
  | { type: 'CHOOSE_PENALTY'; playerId: PlayerId; letterIndex: number }
  | { type: 'NEXT_TURN' }
  | { type: 'RESET' };

// ─── Settings & Stats (localStorage) ────────────────────────────────────────

export interface ProbeSettings {
  difficulty: Difficulty;
  soundEnabled: boolean;
}

export interface ProbeStats {
  gamesPlayed: number;
  gamesWon: number;
  winStreak: number;
  bestWinStreak: number;
}

// ─── Dictionary ──────────────────────────────────────────────────────────────

export interface DictionaryEntry {
  word: string;
  /** Frequency tier: 1 = very common, 2 = common, 3 = uncommon */
  tier: 1 | 2 | 3;
}
