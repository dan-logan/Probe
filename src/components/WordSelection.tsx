import React, { useState, useCallback } from 'react';
import { isValidWord, isDictionaryLoaded } from '../game/dictionary';
import { WordInput } from './WordInput';
import { FreeLetterPicker } from './FreeLetterPicker';

interface WordSelectionScreenProps {
  onConfirm: (word: string, freeLetterIndex: number) => void;
}

/**
 * Word selection screen — player enters their secret word
 * and picks which letter to reveal as the free letter.
 */
export function WordSelectionScreen({ onConfirm }: WordSelectionScreenProps) {
  const [word, setWord] = useState('');
  const [freeLetterIndex, setFreeLetterIndex] = useState<number | null>(null);
  const [validationMsg, setValidationMsg] = useState('');

  const isWordValid = word.length >= 4 && word.length <= 12 && isValidWord(word);
  const canConfirm = isWordValid && freeLetterIndex !== null;

  const handleWordChange = useCallback((newWord: string) => {
    const upper = newWord.toUpperCase().replace(/[^A-Z]/g, '');
    setWord(upper);
    setFreeLetterIndex(null); // reset free letter when word changes

    if (upper.length === 0) {
      setValidationMsg('');
    } else if (upper.length < 4) {
      setValidationMsg('Too short (min 4 letters)');
    } else if (upper.length > 12) {
      setValidationMsg('Too long (max 12 letters)');
    } else if (!isDictionaryLoaded()) {
      setValidationMsg('Dictionary loading...');
    } else if (!isValidWord(upper)) {
      setValidationMsg('Not in dictionary');
    } else {
      setValidationMsg('Valid word!');
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (canConfirm && freeLetterIndex !== null) {
      onConfirm(word, freeLetterIndex);
    }
  }, [canConfirm, word, freeLetterIndex, onConfirm]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-3xl font-bold mb-6">Choose Your Secret Word</h2>

      <WordInput value={word} onChange={handleWordChange} validationMsg={validationMsg} />

      {isWordValid && (
        <div className="mt-6">
          <p className="text-gray-400 mb-2 text-center">Pick one letter to reveal as your free letter:</p>
          <FreeLetterPicker
            word={word}
            selectedIndex={freeLetterIndex}
            onSelect={setFreeLetterIndex}
          />
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        className={`mt-8 px-8 py-3 rounded-lg text-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
          canConfirm
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        Confirm
      </button>
    </div>
  );
}
