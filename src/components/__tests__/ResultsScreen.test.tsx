import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultsScreen } from '../ResultsScreen';
import type { GameState, Player } from '../../game/types';

function makeFinishedState(winnerId: 'human' | 'ai-1'): GameState {
  const players: Player[] = [
    { id: 'human', name: 'You', word: 'HELLO', revealedMask: [true, true, true, true, true], freeLetterIndex: 0, eliminated: winnerId !== 'human', isAI: false, difficulty: 'medium' },
    { id: 'ai-1', name: 'AI 1', word: 'WORLD', revealedMask: [true, true, true, true, true], freeLetterIndex: 0, eliminated: winnerId !== 'ai-1', isAI: true, difficulty: 'medium' },
    { id: 'ai-2', name: 'AI 2', word: 'BRAVE', revealedMask: [true, true, true, true, true], freeLetterIndex: 0, eliminated: true, isAI: true, difficulty: 'medium' },
    { id: 'ai-3', name: 'AI 3', word: 'QUEST', revealedMask: [true, true, true, true, true], freeLetterIndex: 0, eliminated: true, isAI: true, difficulty: 'medium' },
  ];
  return {
    phase: 'finished',
    players,
    currentPlayerIndex: 0,
    turnNumber: 15,
    log: [
      { turn: 1, actorId: 'human', action: 'ask_letter', targetId: 'ai-1', letter: 'E', result: 'miss' },
      { turn: 2, actorId: 'ai-1', action: 'ask_letter', targetId: 'human', letter: 'H', result: 'hit', revealedPositions: [0] },
    ],
    winner: winnerId,
    difficulty: 'medium',
    pendingPenalty: false,
    penaltyPlayerId: null,
  };
}

describe('ResultsScreen', () => {
  it('displays "You Won!" when human wins', () => {
    render(<ResultsScreen state={makeFinishedState('human')} onPlayAgain={vi.fn()} />);
    expect(screen.getByText('You Won!')).toBeInTheDocument();
  });

  it('displays AI winner name when AI wins', () => {
    render(<ResultsScreen state={makeFinishedState('ai-1')} onPlayAgain={vi.fn()} />);
    expect(screen.getByText('AI 1 Won!')).toBeInTheDocument();
  });

  it('reveals all players words', () => {
    render(<ResultsScreen state={makeFinishedState('human')} onPlayAgain={vi.fn()} />);
    expect(screen.getByText('HELLO')).toBeInTheDocument();
    expect(screen.getByText('WORLD')).toBeInTheDocument();
    expect(screen.getByText('BRAVE')).toBeInTheDocument();
    expect(screen.getByText('QUEST')).toBeInTheDocument();
  });

  it('shows stats', () => {
    render(<ResultsScreen state={makeFinishedState('human')} onPlayAgain={vi.fn()} />);
    expect(screen.getByText('15')).toBeInTheDocument(); // turns
    expect(screen.getByText('Turns')).toBeInTheDocument();
  });

  it('has a working Play Again button', () => {
    const onPlayAgain = vi.fn();
    render(<ResultsScreen state={makeFinishedState('human')} onPlayAgain={onPlayAgain} />);
    fireEvent.click(screen.getByText('Play Again'));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });
});
