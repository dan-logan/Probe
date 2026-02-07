import type { GameState, GameAction, Player, PlayerId, Difficulty, LogEntry } from './types';

// ─── Initial State ───────────────────────────────────────────────────────────

export function createInitialState(): GameState {
  return {
    phase: 'title',
    players: [],
    currentPlayerIndex: 0,
    turnNumber: 0,
    log: [],
    winner: null,
    difficulty: 'medium',
    pendingPenalty: false,
    penaltyPlayerId: null,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createPlayer(id: PlayerId, name: string, isAI: boolean, difficulty: Difficulty): Player {
  return {
    id,
    name,
    word: '',
    revealedMask: [],
    freeLetterIndex: -1,
    eliminated: false,
    isAI,
    difficulty,
    aiState: isAI ? { letterTracking: {} } : undefined,
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Find the next non-eliminated player index (wrapping around). */
function findNextActivePlayer(players: Player[], currentIndex: number): number {
  const count = players.length;
  let next = (currentIndex + 1) % count;
  while (players[next].eliminated && next !== currentIndex) {
    next = (next + 1) % count;
  }
  return next;
}

/** Check if only one player remains (i.e. the game is won). */
function checkForWinner(players: Player[]): PlayerId | null {
  const remaining = players.filter(p => !p.eliminated);
  return remaining.length === 1 ? remaining[0].id : null;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // ── Start a new game: create players, move to word selection ────────────
    case 'START_GAME': {
      const players: Player[] = [
        createPlayer('human', 'You', false, action.difficulty),
        createPlayer('ai-1', 'AI 1', true, action.difficulty),
        createPlayer('ai-2', 'AI 2', true, action.difficulty),
        createPlayer('ai-3', 'AI 3', true, action.difficulty),
      ];
      return {
        ...state,
        phase: 'word_selection',
        players,
        difficulty: action.difficulty,
        currentPlayerIndex: 0,
        turnNumber: 0,
        log: [],
        winner: null,
        pendingPenalty: false,
        penaltyPlayerId: null,
      };
    }

    // ── Set a player's word and free letter ─────────────────────────────────
    case 'SET_WORD': {
      const players = state.players.map(p => {
        if (p.id !== action.playerId) return p;
        const revealedMask = Array(action.word.length).fill(false);
        revealedMask[action.freeLetterIndex] = true; // free letter is revealed
        return {
          ...p,
          word: action.word.toUpperCase(),
          revealedMask,
          freeLetterIndex: action.freeLetterIndex,
        };
      });
      return { ...state, players };
    }

    // ── All words set → randomize turn order and begin playing ──────────────
    case 'BEGIN_PLAY': {
      const shuffledPlayers = shuffleArray(state.players);
      // Initialize AI letter tracking for each AI player
      const players = shuffledPlayers.map(p => {
        if (!p.isAI || !p.aiState) return p;
        const letterTracking: Record<string, { askedLetters: Set<string>; candidateWords: string[] }> = {};
        for (const opponent of shuffledPlayers) {
          if (opponent.id !== p.id) {
            letterTracking[opponent.id] = {
              askedLetters: new Set(),
              candidateWords: [], // TODO: populate from dictionary for hard AI
            };
          }
        }
        return { ...p, aiState: { letterTracking } };
      });
      return {
        ...state,
        phase: 'playing',
        players,
        currentPlayerIndex: 0,
        turnNumber: 1,
      };
    }

    // ── Ask a letter: reveal all instances if hit, or miss ──────────────────
    case 'ASK_LETTER': {
      const targetIndex = state.players.findIndex(p => p.id === action.targetId);
      const target = state.players[targetIndex];
      const upperLetter = action.letter.toUpperCase();

      // Find all positions where this letter appears in the target's word
      const revealedPositions: number[] = [];
      for (let i = 0; i < target.word.length; i++) {
        if (target.word[i] === upperLetter && !target.revealedMask[i]) {
          revealedPositions.push(i);
        }
      }

      const isHit = revealedPositions.length > 0;

      // Update target's revealed mask on hit AND actor's AI memory
      const players = state.players.map((p, idx) => {
        // Update target's revealed mask on hit
        if (idx === targetIndex) {
          if (!isHit) return p;
          const newMask = [...p.revealedMask];
          for (const pos of revealedPositions) {
            newMask[pos] = true;
          }
          return { ...p, revealedMask: newMask };
        }
        // Update actor's AI memory with the asked letter
        if (p.id === action.actorId && p.isAI && p.aiState) {
          const tracking = p.aiState.letterTracking[action.targetId];
          if (tracking) {
            const newAskedLetters = new Set(tracking.askedLetters);
            newAskedLetters.add(upperLetter);
            return {
              ...p,
              aiState: {
                ...p.aiState,
                letterTracking: {
                  ...p.aiState.letterTracking,
                  [action.targetId]: {
                    ...tracking,
                    askedLetters: newAskedLetters,
                  },
                },
              },
            };
          }
        }
        return p;
      });

      const logEntry: LogEntry = {
        turn: state.turnNumber,
        actorId: action.actorId,
        action: 'ask_letter',
        targetId: action.targetId,
        letter: upperLetter,
        result: isHit ? 'hit' : 'miss',
        revealedPositions: isHit ? revealedPositions : undefined,
      };

      // On hit: current player gets another turn. On miss: advance to next.
      const nextPlayerIndex = isHit
        ? state.currentPlayerIndex
        : findNextActivePlayer(players, state.currentPlayerIndex);

      return {
        ...state,
        players,
        log: [...state.log, logEntry],
        currentPlayerIndex: nextPlayerIndex,
        turnNumber: isHit ? state.turnNumber : state.turnNumber + 1,
      };
    }

    // ── Guess a word: eliminate target on correct, penalty on wrong ──────────
    case 'GUESS_WORD': {
      const targetIndex = state.players.findIndex(p => p.id === action.targetId);
      const target = state.players[targetIndex];
      const isCorrect = action.guessedWord.toUpperCase() === target.word;

      if (isCorrect) {
        // Eliminate the target — reveal all their letters
        const players = state.players.map((p, idx) => {
          if (idx !== targetIndex) return p;
          return {
            ...p,
            eliminated: true,
            revealedMask: p.revealedMask.map(() => true),
          };
        });

        const logEntry: LogEntry = {
          turn: state.turnNumber,
          actorId: action.actorId,
          action: 'guess_word',
          targetId: action.targetId,
          guessedWord: action.guessedWord.toUpperCase(),
          result: 'correct_guess',
        };

        const winner = checkForWinner(players);

        return {
          ...state,
          players,
          log: [...state.log, logEntry],
          winner,
          phase: winner ? 'finished' : state.phase,
          // Correct guess → same player gets another turn
        };
      } else {
        // Wrong guess — actor must reveal a penalty letter
        const logEntry: LogEntry = {
          turn: state.turnNumber,
          actorId: action.actorId,
          action: 'guess_word',
          targetId: action.targetId,
          guessedWord: action.guessedWord.toUpperCase(),
          result: 'wrong_guess',
        };

        return {
          ...state,
          log: [...state.log, logEntry],
          pendingPenalty: true,
          penaltyPlayerId: action.actorId,
        };
      }
    }

    // ── Choose which letter to reveal as penalty after a wrong guess ────────
    case 'CHOOSE_PENALTY': {
      const players = state.players.map(p => {
        if (p.id !== action.playerId) return p;
        const newMask = [...p.revealedMask];
        newMask[action.letterIndex] = true;
        return { ...p, revealedMask: newMask };
      });

      // Update the last log entry with the penalty position
      const log = [...state.log];
      const lastEntry = log[log.length - 1];
      if (lastEntry && lastEntry.result === 'wrong_guess') {
        log[log.length - 1] = { ...lastEntry, penaltyPosition: action.letterIndex };
      }

      const nextPlayerIndex = findNextActivePlayer(players, state.currentPlayerIndex);

      return {
        ...state,
        players,
        log,
        pendingPenalty: false,
        penaltyPlayerId: null,
        currentPlayerIndex: nextPlayerIndex,
        turnNumber: state.turnNumber + 1,
      };
    }

    // ── Advance to next turn (used when AI completes a miss turn) ───────────
    case 'NEXT_TURN': {
      const nextPlayerIndex = findNextActivePlayer(state.players, state.currentPlayerIndex);
      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        turnNumber: state.turnNumber + 1,
      };
    }

    // ── Reset to title screen ───────────────────────────────────────────────
    case 'RESET': {
      return createInitialState();
    }

    default:
      return state;
  }
}
