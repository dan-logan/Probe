import React, { useState } from 'react';
import type { GameState, PlayerId } from '../game/types';
import { TurnBanner } from './TurnBanner';
import { WordRack } from './WordRack';
import { ActionPanel } from './ActionPanel';
import { GameLog } from './GameLog';
import { PenaltyPicker } from './PenaltyPicker';
import { UsedLettersPanel } from './UsedLettersPanel';

interface GameBoardProps {
  state: GameState;
  onAskLetter: (targetId: PlayerId, letter: string) => void;
  onGuessWord: (targetId: PlayerId, guessedWord: string) => void;
  onChoosePenalty: (letterIndex: number) => void;
}

/**
 * Main game board — displays during the 'playing' phase.
 * Contains opponent racks, player's own rack, action panel,
 * game log, and penalty picker modal.
 */
export function GameBoard({ state, onAskLetter, onGuessWord, onChoosePenalty }: GameBoardProps) {
  const [selectedTarget, setSelectedTarget] = useState<PlayerId | null>(null);

  const humanPlayer = state.players.find(p => p.id === 'human');
  const aiPlayers = state.players.filter(p => p.isAI);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isHumanTurn = currentPlayer?.id === 'human';

  // Auto-select first available target if none selected
  const validTargets = aiPlayers.filter(p => !p.eliminated);
  const effectiveTarget = selectedTarget && validTargets.find(p => p.id === selectedTarget)
    ? selectedTarget
    : validTargets[0]?.id ?? null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Turn Banner */}
      <TurnBanner currentPlayer={currentPlayer} isHumanTurn={isHumanTurn} />

      {/* Opponent Racks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {aiPlayers.map(player => (
          <WordRack
            key={player.id}
            player={player}
            isOpponent
            isSelected={effectiveTarget === player.id}
            onClick={() => !player.eliminated && setSelectedTarget(player.id)}
          />
        ))}
      </div>

      {/* Player's Rack */}
      {humanPlayer && (
        <div className="px-4 pb-2">
          <WordRack player={humanPlayer} isOpponent={false} />
        </div>
      )}

      {/* Main Content: Action Panel + Game Log */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4">
        <div className="flex-1">
          <ActionPanel
            state={state}
            selectedTarget={effectiveTarget}
            onSelectTarget={setSelectedTarget}
            onAskLetter={onAskLetter}
            onGuessWord={onGuessWord}
            disabled={!isHumanTurn || state.pendingPenalty}
          />
        </div>
        <div className="md:w-80">
          <GameLog entries={state.log} players={state.players} />
        </div>
      </div>

      {/* Used Letters Panel */}
      <div className="px-4 pb-4">
        <UsedLettersPanel log={state.log} players={state.players} />
      </div>

      {/* Penalty Picker Modal */}
      {state.pendingPenalty && state.penaltyPlayerId === 'human' && humanPlayer && (
        <PenaltyPicker player={humanPlayer} onChoose={onChoosePenalty} />
      )}
    </div>
  );
}
