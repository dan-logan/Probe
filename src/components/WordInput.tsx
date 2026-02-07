interface WordInputProps {
  value: string;
  onChange: (word: string) => void;
  validationMsg: string;
}

/**
 * Text input for the player's secret word.
 * Uppercases input and shows live validation feedback.
 */
export function WordInput({ value, onChange, validationMsg }: WordInputProps) {
  const isValid = validationMsg === 'Valid word!';
  const isError = validationMsg.length > 0 && !isValid && validationMsg !== 'Dictionary loading...';

  return (
    <div className="w-full max-w-md">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={12}
        placeholder="Enter a word (4–12 letters)"
        autoFocus
        className="w-full px-4 py-3 text-2xl text-center tracking-widest bg-gray-800 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none uppercase"
        aria-label="Secret word input"
        aria-describedby="word-validation"
      />
      <div className="flex justify-between mt-2 text-sm">
        <span
          id="word-validation"
          className={
            isValid ? 'text-green-400' : isError ? 'text-red-400' : 'text-gray-500'
          }
          aria-live="polite"
        >
          {validationMsg}
        </span>
        <span className="text-gray-500">{value.length}/12</span>
      </div>
    </div>
  );
}
