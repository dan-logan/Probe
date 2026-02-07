import { useState } from 'react';
import type { Difficulty } from '../game/types';
import { DifficultySelector } from './DifficultySelector';

interface TitleScreenProps {
  onStart: (difficulty: Difficulty) => void;
}

/**
 * Title screen — first screen the player sees.
 * Allows selecting AI difficulty and starting a new game.
 */
export function TitleScreen({ onStart }: TitleScreenProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-6xl font-bold mb-2 tracking-wider">PROBE</h1>
      <p className="text-gray-400 mb-8 text-lg">The Classic Word Deduction Game</p>

      <div className="mb-8">
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
      </div>

      <button
        onClick={() => onStart(difficulty)}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Start Game
      </button>
    </div>
  );
}
