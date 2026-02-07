import React from 'react';
import type { Difficulty } from '../game/types';

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

const DIFFICULTIES: { key: Difficulty; label: string; description: string }[] = [
  { key: 'easy', label: 'Easy', description: 'Simple words, random strategy' },
  { key: 'medium', label: 'Medium', description: 'Smarter AI, frequency-based' },
  { key: 'hard', label: 'Hard', description: 'Expert AI, long uncommon words' },
];

/**
 * Three-option difficulty selector displayed on the title screen.
 */
export function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <div className="flex gap-3" role="radiogroup" aria-label="AI difficulty">
      {DIFFICULTIES.map(({ key, label, description }) => (
        <button
          key={key}
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={`px-5 py-3 rounded-lg border-2 transition-colors text-center ${
            value === key
              ? 'border-blue-500 bg-blue-500/20 text-white'
              : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-400'
          }`}
        >
          <div className="font-semibold">{label}</div>
          <div className="text-xs mt-1 opacity-75">{description}</div>
        </button>
      ))}
    </div>
  );
}
