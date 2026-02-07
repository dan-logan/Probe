import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WordRack } from '../WordRack';
import type { Player } from '../../game/types';

const basePlayer: Player = {
  id: 'ai-1',
  name: 'AI 1',
  word: 'HELLO',
  revealedMask: [false, true, false, false, false],
  freeLetterIndex: 1,
  eliminated: false,
  isAI: true,
  difficulty: 'medium',
};

describe('WordRack', () => {
  it('renders the correct number of letter slots', () => {
    render(<WordRack player={basePlayer} isOpponent />);
    // 5 letters in HELLO
    const slots = screen.getAllByLabelText(/AI 1, letter \d/);
    expect(slots).toHaveLength(5);
  });

  it('shows "?" for hidden letters when opponent', () => {
    render(<WordRack player={basePlayer} isOpponent />);
    // Position 1 (index 0) is hidden — should show "?"
    const slot1 = screen.getByLabelText('AI 1, letter 1 of 5, hidden');
    expect(slot1).toHaveTextContent('?');
  });

  it('shows revealed letters for opponent', () => {
    render(<WordRack player={basePlayer} isOpponent />);
    const slot2 = screen.getByLabelText('AI 1, letter 2 of 5, revealed: E');
    expect(slot2).toHaveTextContent('E');
  });

  it('shows all letters for own rack (non-opponent)', () => {
    const human: Player = {
      ...basePlayer,
      id: 'human',
      name: 'You',
      isAI: false,
    };
    render(<WordRack player={human} isOpponent={false} />);
    // All letters should be visible even if revealedMask is false
    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
    expect(screen.getByText('O')).toBeInTheDocument();
  });

  it('shows player name', () => {
    render(<WordRack player={basePlayer} isOpponent />);
    expect(screen.getByText('AI 1')).toBeInTheDocument();
  });

  it('shows eliminated state', () => {
    const eliminated: Player = { ...basePlayer, eliminated: true };
    render(<WordRack player={eliminated} isOpponent />);
    expect(screen.getByText('Eliminated')).toBeInTheDocument();
  });

  it('applies selected styling when isSelected is true', () => {
    const { container } = render(<WordRack player={basePlayer} isOpponent isSelected />);
    const rack = container.firstElementChild;
    expect(rack?.className).toContain('ring-2');
    expect(rack?.className).toContain('ring-blue-500');
  });

  it('handles click on opponent rack', () => {
    const onClick = vi.fn();
    render(<WordRack player={basePlayer} isOpponent onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
