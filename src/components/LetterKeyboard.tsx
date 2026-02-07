import { useEffect, useCallback } from 'react';

interface LetterKeyboardProps {
  /** Map of letter → 'hit' | 'miss' for letters already asked against the current target */
  askedLetters: Map<string, 'hit' | 'miss'>;
  onLetterClick: (letter: string) => void;
  disabled: boolean;
}

/** QWERTY keyboard layout rows. */
const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

/**
 * A–Z QWERTY keyboard for asking letters.
 * Per-target coloring: gray = miss, green = hit, default = not asked.
 * Also accepts physical keyboard input.
 */
export function LetterKeyboard({ askedLetters, onLetterClick, disabled }: LetterKeyboardProps) {
  // Handle physical keyboard input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key) && !askedLetters.has(key)) {
        onLetterClick(key);
      }
    },
    [disabled, askedLetters, onLetterClick]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col items-center gap-1" role="group" aria-label="Letter keyboard">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map(letter => {
            const status = askedLetters.get(letter);
            const isAsked = status !== undefined;

            return (
              <button
                key={letter}
                onClick={() => !isAsked && onLetterClick(letter)}
                disabled={disabled || isAsked}
                className={`w-9 h-11 md:w-10 md:h-12 flex items-center justify-center rounded font-bold text-sm transition-colors ${
                  status === 'hit'
                    ? 'bg-green-600 text-white cursor-default'
                    : status === 'miss'
                    ? 'bg-gray-600 text-gray-400 cursor-default'
                    : disabled
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-500'
                }`}
                aria-label={`${letter}${status === 'hit' ? ' (hit)' : status === 'miss' ? ' (miss)' : ''}`}
              >
                {letter}
                {status === 'hit' && <span className="sr-only"> ✓</span>}
                {status === 'miss' && <span className="sr-only"> ✗</span>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
