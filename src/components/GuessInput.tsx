interface GuessInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

/**
 * Text input for word guessing mode.
 * Uppercases input and submits on Enter or button click.
 */
export function GuessInput({ value, onChange, onSubmit, disabled }: GuessInputProps) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
        onKeyDown={e => {
          if (e.key === 'Enter' && value.length >= 4) onSubmit();
        }}
        maxLength={12}
        placeholder="Type your guess..."
        disabled={disabled}
        className="flex-1 px-4 py-3 text-lg tracking-widest bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none uppercase"
        aria-label="Word guess input"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || value.length < 4}
        className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
          !disabled && value.length >= 4
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        Guess
      </button>
    </div>
  );
}
