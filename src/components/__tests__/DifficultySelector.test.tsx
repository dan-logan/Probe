import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DifficultySelector } from '../DifficultySelector';

describe('DifficultySelector', () => {
  it('renders all three difficulty options', () => {
    render(<DifficultySelector value="medium" onChange={vi.fn()} />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('marks the selected difficulty as checked', () => {
    render(<DifficultySelector value="hard" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /Hard/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Easy/ })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the difficulty key when clicked', () => {
    const onChange = vi.fn();
    render(<DifficultySelector value="medium" onChange={onChange} />);
    fireEvent.click(screen.getByText('Easy'));
    expect(onChange).toHaveBeenCalledWith('easy');
  });

  it('shows descriptions for each difficulty', () => {
    render(<DifficultySelector value="medium" onChange={vi.fn()} />);
    expect(screen.getByText('Simple words, random strategy')).toBeInTheDocument();
    expect(screen.getByText('Smarter AI, frequency-based')).toBeInTheDocument();
    expect(screen.getByText('Expert AI, long uncommon words')).toBeInTheDocument();
  });
});
