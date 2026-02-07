import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LetterKeyboard } from '../LetterKeyboard';

describe('LetterKeyboard', () => {
  it('renders all 26 letters', () => {
    render(
      <LetterKeyboard askedLetters={new Map()} onLetterClick={vi.fn()} disabled={false} />
    );
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(screen.getByLabelText(letter)).toBeInTheDocument();
    }
  });

  it('calls onLetterClick when a letter is clicked', () => {
    const onClick = vi.fn();
    render(
      <LetterKeyboard askedLetters={new Map()} onLetterClick={onClick} disabled={false} />
    );
    fireEvent.click(screen.getByLabelText('E'));
    expect(onClick).toHaveBeenCalledWith('E');
  });

  it('does not call onLetterClick for already-asked letters', () => {
    const onClick = vi.fn();
    const asked = new Map([['E', 'hit' as const]]);
    render(
      <LetterKeyboard askedLetters={asked} onLetterClick={onClick} disabled={false} />
    );
    fireEvent.click(screen.getByLabelText('E (hit)'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('disables all buttons when disabled prop is true', () => {
    render(
      <LetterKeyboard askedLetters={new Map()} onLetterClick={vi.fn()} disabled={true} />
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => expect(btn).toBeDisabled());
  });

  it('shows hit styling for hit letters', () => {
    const asked = new Map([['E', 'hit' as const]]);
    render(
      <LetterKeyboard askedLetters={asked} onLetterClick={vi.fn()} disabled={false} />
    );
    const eButton = screen.getByLabelText('E (hit)');
    expect(eButton.className).toContain('bg-green-600');
  });

  it('shows miss styling for missed letters', () => {
    const asked = new Map([['Z', 'miss' as const]]);
    render(
      <LetterKeyboard askedLetters={asked} onLetterClick={vi.fn()} disabled={false} />
    );
    const zButton = screen.getByLabelText('Z (miss)');
    expect(zButton.className).toContain('bg-gray-600');
  });

  it('responds to physical keyboard input', () => {
    const onClick = vi.fn();
    render(
      <LetterKeyboard askedLetters={new Map()} onLetterClick={onClick} disabled={false} />
    );
    fireEvent.keyDown(window, { key: 'a' });
    expect(onClick).toHaveBeenCalledWith('A');
  });

  it('ignores physical keyboard when disabled', () => {
    const onClick = vi.fn();
    render(
      <LetterKeyboard askedLetters={new Map()} onLetterClick={onClick} disabled={true} />
    );
    fireEvent.keyDown(window, { key: 'a' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('ignores physical keyboard for already-asked letters', () => {
    const onClick = vi.fn();
    const asked = new Map([['A', 'miss' as const]]);
    render(
      <LetterKeyboard askedLetters={asked} onLetterClick={onClick} disabled={false} />
    );
    fireEvent.keyDown(window, { key: 'a' });
    expect(onClick).not.toHaveBeenCalled();
  });
});
