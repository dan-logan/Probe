import { describe, it, expect } from 'vitest';
import {
  startGame,
  setWord,
  beginPlay,
  askLetter,
  guessWord,
  choosePenalty,
  nextTurn,
  reset,
} from '../actions';

describe('Action Creators', () => {
  it('startGame creates a START_GAME action', () => {
    const action = startGame('hard');
    expect(action).toEqual({ type: 'START_GAME', difficulty: 'hard' });
  });

  it('setWord creates a SET_WORD action', () => {
    const action = setWord('human', 'HELLO', 2);
    expect(action).toEqual({
      type: 'SET_WORD', playerId: 'human', word: 'HELLO', freeLetterIndex: 2,
    });
  });

  it('beginPlay creates a BEGIN_PLAY action', () => {
    expect(beginPlay()).toEqual({ type: 'BEGIN_PLAY' });
  });

  it('askLetter creates an ASK_LETTER action and uppercases', () => {
    const action = askLetter('human', 'ai-1', 'e');
    expect(action).toEqual({
      type: 'ASK_LETTER', actorId: 'human', targetId: 'ai-1', letter: 'E',
    });
  });

  it('guessWord creates a GUESS_WORD action and uppercases', () => {
    const action = guessWord('ai-2', 'human', 'hello');
    expect(action).toEqual({
      type: 'GUESS_WORD', actorId: 'ai-2', targetId: 'human', guessedWord: 'HELLO',
    });
  });

  it('choosePenalty creates a CHOOSE_PENALTY action', () => {
    const action = choosePenalty('human', 3);
    expect(action).toEqual({ type: 'CHOOSE_PENALTY', playerId: 'human', letterIndex: 3 });
  });

  it('nextTurn creates a NEXT_TURN action', () => {
    expect(nextTurn()).toEqual({ type: 'NEXT_TURN' });
  });

  it('reset creates a RESET action', () => {
    expect(reset()).toEqual({ type: 'RESET' });
  });
});
