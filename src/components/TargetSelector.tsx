import type { Player, PlayerId } from '../game/types';

interface TargetSelectorProps {
  players: Player[];
  selectedTarget: PlayerId | null;
  onSelect: (targetId: PlayerId) => void;
}

/**
 * Three clickable opponent indicators for choosing which AI to target.
 * Eliminated opponents are not selectable.
 */
export function TargetSelector({ players, selectedTarget, onSelect }: TargetSelectorProps) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Target opponent">
      {players.map(player => (
        <button
          key={player.id}
          role="radio"
          aria-checked={selectedTarget === player.id}
          onClick={() => onSelect(player.id)}
          disabled={player.eliminated}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            selectedTarget === player.id
              ? 'bg-blue-600 text-white ring-2 ring-blue-400'
              : player.eliminated
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {player.name}
          {player.eliminated && ' ✗'}
        </button>
      ))}
    </div>
  );
}
