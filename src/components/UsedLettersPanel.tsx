import type { LogEntry, Player, PlayerId } from '../game/types';

interface UsedLettersPanelProps {
  log: LogEntry[];
  players: Player[];
}

/**
 * Per-opponent summary of which letters have been asked and their results.
 * Gives the human player a quick reference of what they've already tried.
 */
export function UsedLettersPanel({ log, players }: UsedLettersPanelProps) {
  const aiPlayers = players.filter(p => p.isAI);

  // Build per-target letter history from human's asks
  const letterHistory = new Map<PlayerId, Map<string, 'hit' | 'miss'>>();
  for (const entry of log) {
    if (entry.actorId === 'human' && entry.action === 'ask_letter' && entry.letter) {
      if (!letterHistory.has(entry.targetId as PlayerId)) {
        letterHistory.set(entry.targetId as PlayerId, new Map());
      }
      letterHistory.get(entry.targetId as PlayerId)!.set(
        entry.letter,
        entry.result === 'hit' ? 'hit' : 'miss'
      );
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <h3 className="text-sm font-semibold text-gray-400 mb-2">Your Asked Letters</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {aiPlayers.map(player => {
          const letters = letterHistory.get(player.id) ?? new Map();
          return (
            <div key={player.id} className="text-xs">
              <span className="text-gray-400">{player.name}: </span>
              {letters.size === 0 ? (
                <span className="text-gray-600">none</span>
              ) : (
                Array.from(letters.entries()).map(([letter, result]) => (
                  <span
                    key={letter}
                    className={`inline-block mr-1 ${
                      result === 'hit' ? 'text-green-400' : 'text-gray-500'
                    }`}
                  >
                    {letter}{result === 'hit' ? '✓' : '✗'}
                  </span>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
