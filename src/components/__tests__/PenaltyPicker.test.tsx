import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PenaltyPicker } from '../PenaltyPicker';
import type { Player } from '../../game/types';

const player: Player = {
  id: 'human',
  name: 'You',
  word: 'HELLO',
  revealedMask: [false, true, false, false, false],
  freeLetterIndex: 1,
  eliminated: false,
  isAI: false,
  difficulty: 'medium',
};

describe('PenaltyPicker', () => {
  it('renders a modal dialog', () => {
    render(<PenaltyPicker player={player} onChoose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Wrong Guess!')).toBeInTheDocument();
  });

  it('shows all letters from the player word', () => {
    render(<PenaltyPicker player={player} onChoose={vi.fn()} />);
    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
    // Two L's and an O
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('disables already-revealed letters', () => {
    render(<PenaltyPicker player={player} onChoose={vi.fn()} />);
    // E at index 1 is revealed
    const eButton = screen.getByLabelText('Letter 2: E (already revealed)');
    expect(eButton).toBeDisabled();
  });

  it('enables unrevealed letters for selection', () => {
    render(<PenaltyPicker player={player} onChoose={vi.fn()} />);
    const hButton = screen.getByLabelText('Reveal letter 1: H');
    expect(hButton).not.toBeDisabled();
  });

  it('calls onChoose with the correct index when clicked', () => {
    const onChoose = vi.fn();
    render(<PenaltyPicker player={player} onChoose={onChoose} />);
    fireEvent.click(screen.getByLabelText('Reveal letter 1: H'));
    expect(onChoose).toHaveBeenCalledWith(0);
  });

  it('does not call onChoose for revealed letters', () => {
    const onChoose = vi.fn();
    render(<PenaltyPicker player={player} onChoose={onChoose} />);
    fireEvent.click(screen.getByLabelText('Letter 2: E (already revealed)'));
    expect(onChoose).not.toHaveBeenCalled();
  });
});
