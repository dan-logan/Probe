import type { Player } from '../game/types';

interface TurnBannerProps {
  currentPlayer: Player | null;
  isHumanTurn: boolean;
}

/**
 * Displays whose turn it is at the top of the game board.
 * Shows "Your turn" or "AI-X is thinking..." with ellipsis animation.
 */
export function TurnBanner({ currentPlayer, isHumanTurn }: TurnBannerProps) {
  if (!currentPlayer) return null;

  return (
    <div
      className="w-full py-3 text-center text-xl font-semibold bg-gray-800 border-b border-gray-700"
      aria-live="polite"
    >
      {isHumanTurn ? (
        <span className="text-blue-400">Your turn</span>
      ) : (
        <span className="text-yellow-400">
          {currentPlayer.name} is thinking
          <span className="animate-ellipsis">...</span>
        </span>
      )}
    </div>
  );
}
