import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TargetSelector } from '../TargetSelector';
import type { Player } from '../../game/types';

const players: Player[] = [
  { id: 'ai-1', name: 'AI 1', word: 'WORLD', revealedMask: [], freeLetterIndex: 0, eliminated: false, isAI: true, difficulty: 'medium' },
  { id: 'ai-2', name: 'AI 2', word: 'BRAVE', revealedMask: [], freeLetterIndex: 0, eliminated: false, isAI: true, difficulty: 'medium' },
  { id: 'ai-3', name: 'AI 3', word: 'QUEST', revealedMask: [], freeLetterIndex: 0, eliminated: true, isAI: true, difficulty: 'medium' },
];

describe('TargetSelector', () => {
  it('renders buttons for all players', () => {
    render(<TargetSelector players={players} selectedTarget="ai-1" onSelect={vi.fn()} />);
    expect(screen.getByText('AI 1')).toBeInTheDocument();
    expect(screen.getByText('AI 2')).toBeInTheDocument();
  });

  it('marks selected target as checked', () => {
    render(<TargetSelector players={players} selectedTarget="ai-1" onSelect={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /AI 1/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /AI 2/ })).toHaveAttribute('aria-checked', 'false');
  });

  it('disables eliminated players', () => {
    render(<TargetSelector players={players} selectedTarget="ai-1" onSelect={vi.fn()} />);
    const ai3Btn = screen.getByRole('radio', { name: /AI 3/ });
    expect(ai3Btn).toBeDisabled();
  });

  it('calls onSelect when a player is clicked', () => {
    const onSelect = vi.fn();
    render(<TargetSelector players={players} selectedTarget="ai-1" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('radio', { name: /AI 2/ }));
    expect(onSelect).toHaveBeenCalledWith('ai-2');
  });
});
