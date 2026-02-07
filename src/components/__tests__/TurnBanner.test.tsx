import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TurnBanner } from '../TurnBanner';
import type { Player } from '../../game/types';

const humanPlayer: Player = {
  id: 'human', name: 'You', word: 'HELLO', revealedMask: [],
  freeLetterIndex: 0, eliminated: false, isAI: false, difficulty: 'medium',
};

const aiPlayer: Player = {
  id: 'ai-1', name: 'AI 1', word: 'WORLD', revealedMask: [],
  freeLetterIndex: 0, eliminated: false, isAI: true, difficulty: 'medium',
};

describe('TurnBanner', () => {
  it('shows "Your turn" when it is the human\'s turn', () => {
    render(<TurnBanner currentPlayer={humanPlayer} isHumanTurn={true} />);
    expect(screen.getByText('Your turn')).toBeInTheDocument();
  });

  it('shows AI thinking message when it is an AI turn', () => {
    render(<TurnBanner currentPlayer={aiPlayer} isHumanTurn={false} />);
    expect(screen.getByText(/AI 1 is thinking/)).toBeInTheDocument();
  });

  it('renders nothing when currentPlayer is null', () => {
    const { container } = render(<TurnBanner currentPlayer={null} isHumanTurn={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('has aria-live for accessibility', () => {
    const { container } = render(<TurnBanner currentPlayer={humanPlayer} isHumanTurn={true} />);
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});
