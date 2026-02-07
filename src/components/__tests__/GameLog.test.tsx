import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameLog } from '../GameLog';
import type { LogEntry, Player } from '../../game/types';

const players: Player[] = [
  { id: 'human', name: 'You', word: 'HELLO', revealedMask: [], freeLetterIndex: 0, eliminated: false, isAI: false, difficulty: 'medium' },
  { id: 'ai-1', name: 'AI 1', word: 'WORLD', revealedMask: [], freeLetterIndex: 0, eliminated: false, isAI: true, difficulty: 'medium' },
];

describe('GameLog', () => {
  it('shows empty message when no entries', () => {
    render(<GameLog entries={[]} players={players} />);
    expect(screen.getByText('No moves yet...')).toBeInTheDocument();
  });

  it('displays hit entries correctly', () => {
    const entries: LogEntry[] = [{
      turn: 1,
      actorId: 'human',
      action: 'ask_letter',
      targetId: 'ai-1',
      letter: 'W',
      result: 'hit',
      revealedPositions: [0],
    }];
    render(<GameLog entries={entries} players={players} />);
    expect(screen.getByText(/You asked AI 1 for 'W' → Hit!/)).toBeInTheDocument();
  });

  it('displays miss entries correctly', () => {
    const entries: LogEntry[] = [{
      turn: 1,
      actorId: 'ai-1',
      action: 'ask_letter',
      targetId: 'human',
      letter: 'Z',
      result: 'miss',
    }];
    render(<GameLog entries={entries} players={players} />);
    expect(screen.getByText(/AI 1 asked You for 'Z' → Miss/)).toBeInTheDocument();
  });

  it('displays correct guess entries', () => {
    const entries: LogEntry[] = [{
      turn: 1,
      actorId: 'human',
      action: 'guess_word',
      targetId: 'ai-1',
      guessedWord: 'WORLD',
      result: 'correct_guess',
    }];
    render(<GameLog entries={entries} players={players} />);
    expect(screen.getByText(/You guessed AI 1's word "WORLD" → Correct!/)).toBeInTheDocument();
  });

  it('displays wrong guess entries', () => {
    const entries: LogEntry[] = [{
      turn: 1,
      actorId: 'human',
      action: 'guess_word',
      targetId: 'ai-1',
      guessedWord: 'WRONG',
      result: 'wrong_guess',
    }];
    render(<GameLog entries={entries} players={players} />);
    expect(screen.getByText(/You guessed "WRONG" for AI 1 → Wrong!/)).toBeInTheDocument();
  });

  it('displays multiple entries', () => {
    const entries: LogEntry[] = [
      { turn: 1, actorId: 'human', action: 'ask_letter', targetId: 'ai-1', letter: 'E', result: 'miss' },
      { turn: 2, actorId: 'ai-1', action: 'ask_letter', targetId: 'human', letter: 'A', result: 'miss' },
    ];
    render(<GameLog entries={entries} players={players} />);
    const items = screen.getAllByText(/asked/);
    expect(items).toHaveLength(2);
  });

  it('renders the Game Log header', () => {
    render(<GameLog entries={[]} players={players} />);
    expect(screen.getByText('Game Log')).toBeInTheDocument();
  });
});
