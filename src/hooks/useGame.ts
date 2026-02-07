import { useReducer, useCallback, useMemo, createContext, useContext } from 'react';
import type { GameState, GameAction, Difficulty, PlayerId } from '../game/types';
import { gameReducer, createInitialState } from '../game/reducer';
import * as actions from '../game/actions';

// ─── Context ─────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  // Convenience action dispatchers
  startGame: (difficulty: Difficulty) => void;
  setWord: (playerId: PlayerId, word: string, freeLetterIndex: number) => void;
  beginPlay: () => void;
  askLetter: (actorId: PlayerId, targetId: PlayerId, letter: string) => void;
  guessWord: (actorId: PlayerId, targetId: PlayerId, guessedWord: string) => void;
  choosePenalty: (playerId: PlayerId, letterIndex: number) => void;
  resetGame: () => void;
  // Derived state
  currentPlayer: GameState['players'][number] | null;
  humanPlayer: GameState['players'][number] | null;
  isHumanTurn: boolean;
  activeOpponents: GameState['players'];
}

const GameContext = createContext<GameContextValue | null>(null);

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// ─── Provider Logic ──────────────────────────────────────────────────────────

export function useGameProvider() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  const startGame = useCallback(
    (difficulty: Difficulty) => dispatch(actions.startGame(difficulty)),
    [dispatch]
  );

  const setWord = useCallback(
    (playerId: PlayerId, word: string, freeLetterIndex: number) =>
      dispatch(actions.setWord(playerId, word, freeLetterIndex)),
    [dispatch]
  );

  const beginPlay = useCallback(
    () => dispatch(actions.beginPlay()),
    [dispatch]
  );

  const askLetter = useCallback(
    (actorId: PlayerId, targetId: PlayerId, letter: string) =>
      dispatch(actions.askLetter(actorId, targetId, letter)),
    [dispatch]
  );

  const guessWord = useCallback(
    (actorId: PlayerId, targetId: PlayerId, guessedWord: string) =>
      dispatch(actions.guessWord(actorId, targetId, guessedWord)),
    [dispatch]
  );

  const choosePenalty = useCallback(
    (playerId: PlayerId, letterIndex: number) =>
      dispatch(actions.choosePenalty(playerId, letterIndex)),
    [dispatch]
  );

  const resetGame = useCallback(
    () => dispatch(actions.reset()),
    [dispatch]
  );

  const currentPlayer = state.players[state.currentPlayerIndex] ?? null;
  const humanPlayer = state.players.find(p => p.id === 'human') ?? null;
  const isHumanTurn = currentPlayer?.id === 'human';
  const activeOpponents = useMemo(
    () => state.players.filter(p => p.isAI && !p.eliminated),
    [state.players]
  );

  return {
    state,
    dispatch,
    startGame,
    setWord,
    beginPlay,
    askLetter,
    guessWord,
    choosePenalty,
    resetGame,
    currentPlayer,
    humanPlayer,
    isHumanTurn,
    activeOpponents,
  };
}

export { GameContext };
