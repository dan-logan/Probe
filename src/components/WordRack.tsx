import React from 'react';
import type { Player } from '../game/types';
import { LetterSlot } from './LetterSlot';

interface WordRackProps {
  player: Player;
  isOpponent: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * A row of LetterSlot components representing a player's word.
 * For opponents: shows "?" for hidden letters, revealed letters for hits/free.
 * Eliminated players are grayed out with all letters visible.
 */
export function WordRack({ player, isOpponent, isSelected = false, onClick }: WordRackProps) {
  const { name, word, revealedMask, freeLetterIndex, eliminated } = player;

  return (
    <div
      className={`rounded-lg p-3 transition-all ${
        eliminated
          ? 'opacity-30 animate-slide-down-fade'
          : isSelected
          ? 'bg-gray-700 ring-2 ring-blue-500'
          : 'bg-gray-800'
      } ${isOpponent && !eliminated ? 'cursor-pointer hover:bg-gray-750' : ''}`}
      onClick={onClick}
      role={isOpponent ? 'button' : undefined}
      aria-label={isOpponent ? `Select ${name} as target` : `Your word rack`}
    >
      {/* Player Label */}
      <div className={`text-sm font-medium mb-2 ${eliminated ? 'line-through text-gray-500' : 'text-gray-300'}`}>
        {name}
        {eliminated && <span className="ml-2 text-red-400 text-xs">Eliminated</span>}
      </div>

      {/* Letter Slots */}
      <div className="flex gap-1 justify-center">
        {word.split('').map((letter, index) => (
          <LetterSlot
            key={index}
            letter={letter}
            revealed={revealedMask[index]}
            isFree={index === freeLetterIndex}
            isOpponent={isOpponent}
            playerName={name}
            position={index + 1}
            totalLetters={word.length}
          />
        ))}
      </div>
    </div>
  );
}
