import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuessInput } from '../GuessInput';

describe('GuessInput', () => {
  it('renders an input and a guess button', () => {
    render(<GuessInput value="" onChange={vi.fn()} onSubmit={vi.fn()} disabled={false} />);
    expect(screen.getByLabelText('Word guess input')).toBeInTheDocument();
    expect(screen.getByText('Guess')).toBeInTheDocument();
  });

  it('calls onChange with uppercased value', () => {
    const onChange = vi.fn();
    render(<GuessInput value="" onChange={onChange} onSubmit={vi.fn()} disabled={false} />);
    fireEvent.change(screen.getByLabelText('Word guess input'), { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('HELLO');
  });

  it('strips non-alpha characters', () => {
    const onChange = vi.fn();
    render(<GuessInput value="" onChange={onChange} onSubmit={vi.fn()} disabled={false} />);
    fireEvent.change(screen.getByLabelText('Word guess input'), { target: { value: 'he123llo!' } });
    expect(onChange).toHaveBeenCalledWith('HELLO');
  });

  it('disables the guess button when value is too short', () => {
    render(<GuessInput value="HE" onChange={vi.fn()} onSubmit={vi.fn()} disabled={false} />);
    expect(screen.getByText('Guess')).toBeDisabled();
  });

  it('enables the guess button when value is >= 4 chars', () => {
    render(<GuessInput value="HELL" onChange={vi.fn()} onSubmit={vi.fn()} disabled={false} />);
    expect(screen.getByText('Guess')).not.toBeDisabled();
  });

  it('calls onSubmit when Guess button clicked', () => {
    const onSubmit = vi.fn();
    render(<GuessInput value="HELLO" onChange={vi.fn()} onSubmit={onSubmit} disabled={false} />);
    fireEvent.click(screen.getByText('Guess'));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('calls onSubmit on Enter key when value is long enough', () => {
    const onSubmit = vi.fn();
    render(<GuessInput value="HELLO" onChange={vi.fn()} onSubmit={onSubmit} disabled={false} />);
    fireEvent.keyDown(screen.getByLabelText('Word guess input'), { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('does not call onSubmit on Enter when value is too short', () => {
    const onSubmit = vi.fn();
    render(<GuessInput value="HE" onChange={vi.fn()} onSubmit={onSubmit} disabled={false} />);
    fireEvent.keyDown(screen.getByLabelText('Word guess input'), { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    render(<GuessInput value="" onChange={vi.fn()} onSubmit={vi.fn()} disabled={true} />);
    expect(screen.getByLabelText('Word guess input')).toBeDisabled();
    expect(screen.getByText('Guess')).toBeDisabled();
  });
});
