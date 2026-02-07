import type { Player } from '../game/types';

interface PenaltyPickerProps {
  player: Player;
  onChoose: (letterIndex: number) => void;
}

/**
 * Modal overlay that appears after the human player makes an incorrect word guess.
 * Displays the player's word with unrevealed letters highlighted as selectable.
 * Cannot be dismissed without picking a letter to reveal.
 */
export function PenaltyPicker({ player, onChoose }: PenaltyPickerProps) {
  const { word, revealedMask } = player;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Penalty: choose a letter to reveal"
    >
      <div className="bg-gray-800 rounded-xl p-6 max-w-lg mx-4">
        <h3 className="text-xl font-bold text-red-400 mb-2 text-center">Wrong Guess!</h3>
        <p className="text-gray-400 mb-4 text-center">
          You must reveal one of your letters as a penalty. Choose wisely!
        </p>

        <div className="flex gap-2 justify-center">
          {word.split('').map((letter, index) => {
            const isRevealed = revealedMask[index];
            return (
              <button
                key={index}
                onClick={() => !isRevealed && onChoose(index)}
                disabled={isRevealed}
                className={`w-12 h-14 flex items-center justify-center text-xl font-bold rounded-lg border-2 transition-colors ${
                  isRevealed
                    ? 'border-gray-600 bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'border-red-500 bg-red-500/20 text-red-300 hover:bg-red-500/40 animate-pulse-slot cursor-pointer'
                }`}
                aria-label={
                  isRevealed
                    ? `Letter ${index + 1}: ${letter} (already revealed)`
                    : `Reveal letter ${index + 1}: ${letter}`
                }
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
