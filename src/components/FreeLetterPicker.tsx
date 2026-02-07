interface FreeLetterPickerProps {
  word: string;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

/**
 * Renders the player's word as clickable letter tiles.
 * Player clicks one to designate it as the free letter.
 */
export function FreeLetterPicker({ word, selectedIndex, onSelect }: FreeLetterPickerProps) {
  return (
    <div className="flex gap-2 justify-center" role="radiogroup" aria-label="Free letter selection">
      {word.split('').map((letter, index) => (
        <button
          key={index}
          role="radio"
          aria-checked={selectedIndex === index}
          aria-label={`Letter ${index + 1}: ${letter}`}
          onClick={() => onSelect(index)}
          className={`w-12 h-12 flex items-center justify-center text-xl font-bold rounded-lg border-2 transition-colors ${
            selectedIndex === index
              ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
              : 'border-gray-600 bg-gray-800 text-white hover:border-gray-400'
          }`}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}
