import { useState, useCallback } from 'react';
import type { GameState, PlayerId } from '../game/types';
import { LetterKeyboard } from './LetterKeyboard';
import { TargetSelector } from './TargetSelector';
import { GuessInput } from './GuessInput';

interface ActionPanelProps {
  state: GameState;
  selectedTarget: PlayerId | null;
  onSelectTarget: (targetId: PlayerId) => void;
  onAskLetter: (targetId: PlayerId, letter: string) => void;
  onGuessWord: (targetId: PlayerId, guessedWord: string) => void;
  disabled: boolean;
}

type ActionMode = 'ask_letter' | 'guess_word';

/**
 * The main action area for the human player's turn.
 * Contains a mode toggle (Ask Letter / Guess Word), target selector,
 * letter keyboard (for asking), and guess input (for word guessing).
 */
export function ActionPanel({
  state,
  selectedTarget,
  onSelectTarget,
  onAskLetter,
  onGuessWord,
  disabled,
}: ActionPanelProps) {
  const [mode, setMode] = useState<ActionMode>('ask_letter');
  const [guessValue, setGuessValue] = useState('');

  const aiPlayers = state.players.filter(p => p.isAI && !p.eliminated);

  // Gather letters already asked against the selected target
  const askedLetters = new Map<string, 'hit' | 'miss'>();
  if (selectedTarget) {
    for (const entry of state.log) {
      if (
        entry.actorId === 'human' &&
        entry.targetId === selectedTarget &&
        entry.action === 'ask_letter' &&
        entry.letter
      ) {
        askedLetters.set(entry.letter, entry.result === 'hit' ? 'hit' : 'miss');
      }
    }
  }

  const handleLetterClick = useCallback(
    (letter: string) => {
      if (!disabled && selectedTarget) {
        onAskLetter(selectedTarget, letter);
      }
    },
    [disabled, selectedTarget, onAskLetter]
  );

  const handleGuessSubmit = useCallback(() => {
    if (!disabled && selectedTarget && guessValue.length >= 4) {
      onGuessWord(selectedTarget, guessValue);
      setGuessValue('');
    }
  }, [disabled, selectedTarget, guessValue, onGuessWord]);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      {/* Target Selector */}
      <TargetSelector
        players={aiPlayers}
        selectedTarget={selectedTarget}
        onSelect={onSelectTarget}
      />

      {/* Mode Toggle */}
      <div className="flex gap-2 mt-4 mb-4" role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'ask_letter'}
          onClick={() => setMode('ask_letter')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
            mode === 'ask_letter'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          Ask Letter
        </button>
        <button
          role="tab"
          aria-selected={mode === 'guess_word'}
          onClick={() => setMode('guess_word')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
            mode === 'guess_word'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          Guess Word
        </button>
      </div>

      {/* Action Content */}
      {mode === 'ask_letter' ? (
        <LetterKeyboard
          askedLetters={askedLetters}
          onLetterClick={handleLetterClick}
          disabled={disabled}
        />
      ) : (
        <GuessInput
          value={guessValue}
          onChange={setGuessValue}
          onSubmit={handleGuessSubmit}
          disabled={disabled}
        />
      )}
    </div>
  );
}
