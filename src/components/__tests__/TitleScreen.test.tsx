import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TitleScreen } from '../TitleScreen';

describe('TitleScreen', () => {
  it('renders the title and start button', () => {
    render(<TitleScreen onStart={vi.fn()} />);
    expect(screen.getByText('PROBE')).toBeInTheDocument();
    expect(screen.getByText('Start Game')).toBeInTheDocument();
  });

  it('renders difficulty selector with three options', () => {
    render(<TitleScreen onStart={vi.fn()} />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('defaults to medium difficulty', () => {
    render(<TitleScreen onStart={vi.fn()} />);
    const mediumBtn = screen.getByText('Medium').closest('button');
    expect(mediumBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onStart with selected difficulty', () => {
    const onStart = vi.fn();
    render(<TitleScreen onStart={onStart} />);

    fireEvent.click(screen.getByText('Hard'));
    fireEvent.click(screen.getByText('Start Game'));

    expect(onStart).toHaveBeenCalledWith('hard');
  });

  it('calls onStart with easy difficulty when selected', () => {
    const onStart = vi.fn();
    render(<TitleScreen onStart={onStart} />);

    fireEvent.click(screen.getByText('Easy'));
    fireEvent.click(screen.getByText('Start Game'));

    expect(onStart).toHaveBeenCalledWith('easy');
  });
});
