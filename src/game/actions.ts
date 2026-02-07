import type { GameAction, Difficulty, PlayerId } from './types';

/** Start a new game with the given difficulty level. */
export function startGame(difficulty: Difficulty): GameAction {
  return { type: 'START_GAME', difficulty };
}

/** Set a player's secret word and free letter index. */
export function setWord(playerId: PlayerId, word: string, freeLetterIndex: number): GameAction {
  return { type: 'SET_WORD', playerId, word, freeLetterIndex };
}

/** Transition from word selection to playing phase. */
export function beginPlay(): GameAction {
  return { type: 'BEGIN_PLAY' };
}

/** Ask a letter: actor asks target if their word contains the given letter. */
export function askLetter(actorId: PlayerId, targetId: PlayerId, letter: string): GameAction {
  return { type: 'ASK_LETTER', actorId, targetId, letter: letter.toUpperCase() };
}

/** Guess a word: actor attempts to guess the target's full word. */
export function guessWord(actorId: PlayerId, targetId: PlayerId, guessedWord: string): GameAction {
  return { type: 'GUESS_WORD', actorId, targetId, guessedWord: guessedWord.toUpperCase() };
}

/** Choose which unrevealed letter to reveal as penalty after a wrong guess. */
export function choosePenalty(playerId: PlayerId, letterIndex: number): GameAction {
  return { type: 'CHOOSE_PENALTY', playerId, letterIndex };
}

/** Advance to the next player's turn. */
export function nextTurn(): GameAction {
  return { type: 'NEXT_TURN' };
}

/** Reset the entire game back to the title screen. */
export function reset(): GameAction {
  return { type: 'RESET' };
}
