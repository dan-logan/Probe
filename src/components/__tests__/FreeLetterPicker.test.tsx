import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FreeLetterPicker } from '../FreeLetterPicker';

describe('FreeLetterPicker', () => {
  it('renders one button per letter in the word', () => {
    render(<FreeLetterPicker word="HELLO" selectedIndex={null} onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole('radio');
    expect(buttons).toHaveLength(5);
  });

  it('displays each letter', () => {
    render(<FreeLetterPicker word="HELLO" selectedIndex={null} onSelect={vi.fn()} />);
    expect(screen.getByLabelText('Letter 1: H')).toHaveTextContent('H');
    expect(screen.getByLabelText('Letter 2: E')).toHaveTextContent('E');
  });

  it('calls onSelect with the letter index when clicked', () => {
    const onSelect = vi.fn();
    render(<FreeLetterPicker word="HELLO" selectedIndex={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('Letter 3: L'));
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('marks the selected letter as checked', () => {
    render(<FreeLetterPicker word="HELLO" selectedIndex={2} onSelect={vi.fn()} />);
    expect(screen.getByLabelText('Letter 3: L')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Letter 1: H')).toHaveAttribute('aria-checked', 'false');
  });

  it('applies highlight styling to selected letter', () => {
    render(<FreeLetterPicker word="HELLO" selectedIndex={0} onSelect={vi.fn()} />);
    const hButton = screen.getByLabelText('Letter 1: H');
    expect(hButton.className).toContain('border-yellow-400');
  });
});
