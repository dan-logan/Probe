interface LetterSlotProps {
  letter: string;
  revealed: boolean;
  isFree: boolean;
  isOpponent: boolean;
  playerName: string;
  position: number;
  totalLetters: number;
}

/**
 * A single letter slot in a word rack.
 * States: hidden ("?"), revealed (shows letter), free (shows letter, distinct style).
 * Uses CSS 3D flip animation on reveal.
 */
export function LetterSlot({
  letter,
  revealed,
  isFree,
  isOpponent,
  playerName,
  position,
  totalLetters,
}: LetterSlotProps) {
  const displayChar = revealed || !isOpponent ? letter : '?';

  const stateLabel = revealed
    ? `revealed: ${letter}`
    : 'hidden';

  return (
    <div
      className={`w-9 h-11 flex items-center justify-center text-lg font-bold rounded border-2 transition-all ${
        isFree && revealed
          ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
          : revealed
          ? 'border-green-500 bg-green-500/20 text-green-300'
          : isOpponent
          ? 'border-gray-600 bg-gray-700 text-gray-400'
          : 'border-blue-500 bg-blue-500/20 text-blue-300'
      } ${revealed ? 'animate-flip' : ''}`}
      aria-label={`${playerName}, letter ${position} of ${totalLetters}, ${stateLabel}`}
    >
      {displayChar}
    </div>
  );
}
