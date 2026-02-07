import { useRef, useEffect } from 'react';
import type { LogEntry, Player } from '../game/types';

interface GameLogProps {
  entries: LogEntry[];
  players: Player[];
}

/**
 * Scrollable reverse-chronological log of game events.
 * Shows letter asks (hits/misses) and word guesses.
 * Auto-scrolls to the latest entry.
 */
export function GameLog({ entries, players }: GameLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const getPlayerName = (id: string): string => {
    if (id === 'human') return 'You';
    return players.find(p => p.id === id)?.name ?? id;
  };

  const formatEntry = (entry: LogEntry): string => {
    const actor = getPlayerName(entry.actorId);
    const target = getPlayerName(entry.targetId);

    switch (entry.result) {
      case 'hit':
        return `${actor} asked ${target} for '${entry.letter}' → Hit! (position${
          entry.revealedPositions && entry.revealedPositions.length > 1 ? 's' : ''
        } ${entry.revealedPositions?.map(p => p + 1).join(', ')})`;
      case 'miss':
        return `${actor} asked ${target} for '${entry.letter}' → Miss`;
      case 'correct_guess':
        return `${actor} guessed ${target}'s word "${entry.guessedWord}" → Correct! ${target} eliminated!`;
      case 'wrong_guess': {
        const penaltyInfo = entry.penaltyPosition !== undefined
          ? ` (revealed letter at position ${entry.penaltyPosition + 1})`
          : '';
        return `${actor} guessed "${entry.guessedWord}" for ${target} → Wrong!${penaltyInfo}`;
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-400 mb-2">Game Log</h3>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 text-sm max-h-64 md:max-h-none"
        aria-live="polite"
        aria-label="Game event log"
      >
        {entries.length === 0 ? (
          <p className="text-gray-600 italic">No moves yet...</p>
        ) : (
          entries.map((entry, i) => (
            <div
              key={i}
              className={`py-1 px-2 rounded ${
                entry.result === 'hit' || entry.result === 'correct_guess'
                  ? 'text-green-400'
                  : entry.result === 'miss'
                  ? 'text-gray-400'
                  : 'text-red-400'
              }`}
            >
              {formatEntry(entry)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
