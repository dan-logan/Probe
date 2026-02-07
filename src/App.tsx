import { useState, useCallback, useEffect } from 'react';
import type { Difficulty, PlayerId } from './game/types';
import { loadDictionary } from './game/dictionary';
import { chooseAIWord, chooseAIFreeLetter } from './game/ai';
import { useGameProvider, GameContext } from './hooks/useGame';
import { useAITurn } from './hooks/useAITurn';
import { TitleScreen } from './components/TitleScreen';
import { WordSelectionScreen } from './components/WordSelection';
import { GameBoard } from './components/GameBoard';
import { ResultsScreen } from './components/ResultsScreen';
import { HelpButton } from './components/HelpButton';
import { RulesModal } from './components/RulesModal';

/**
 * Root application component.
 * Manages screen flow: Title → Word Selection → Game Board → Results
 */
export default function App() {
  const game = useGameProvider();
  const { state, startGame, setWord, beginPlay, askLetter, guessWord, choosePenalty, resetGame } = game;

  const [rulesOpen, setRulesOpen] = useState(false);
  const [dictionaryLoaded, setDictionaryLoaded] = useState(false);

  // Load dictionary on mount
  useEffect(() => {
    loadDictionary().then(() => setDictionaryLoaded(true));
  }, []);

  // Schedule AI turns with pause support (paused when rules modal open)
  useAITurn({
    state,
    askLetter,
    guessWord,
    choosePenalty,
    isPaused: rulesOpen,
  });

  // ── Title Screen: start game ──────────────────────────────────────────────
  const handleStart = useCallback(
    (difficulty: Difficulty) => {
      startGame(difficulty);
    },
    [startGame]
  );

  // ── Word Selection: human confirms word, then AI picks words, then play begins
  const handleWordConfirm = useCallback(
    (word: string, freeLetterIndex: number) => {
      // Set human word
      setWord('human', word, freeLetterIndex);

      // AI players pick their words and free letters
      const aiIds: PlayerId[] = ['ai-1', 'ai-2', 'ai-3'];
      for (const aiId of aiIds) {
        const aiWord = chooseAIWord(state.difficulty);
        const aiFreeIndex = chooseAIFreeLetter(aiWord, state.difficulty);
        setWord(aiId, aiWord, aiFreeIndex);
      }

      // Small delay to let state settle, then begin play
      setTimeout(() => beginPlay(), 50);
    },
    [setWord, beginPlay, state.difficulty]
  );

  // ── Game Board: human actions ─────────────────────────────────────────────
  const handleAskLetter = useCallback(
    (targetId: PlayerId, letter: string) => {
      askLetter('human', targetId, letter);
    },
    [askLetter]
  );

  const handleGuessWord = useCallback(
    (targetId: PlayerId, guessedWord: string) => {
      guessWord('human', targetId, guessedWord);
    },
    [guessWord]
  );

  const handleChoosePenalty = useCallback(
    (letterIndex: number) => {
      choosePenalty('human', letterIndex);
    },
    [choosePenalty]
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!dictionaryLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-xl">Loading dictionary...</p>
      </div>
    );
  }

  // ── Render current screen ─────────────────────────────────────────────────
  return (
    <GameContext.Provider value={game}>
      <div className="min-h-screen bg-gray-900">
        {state.phase === 'title' && (
          <TitleScreen onStart={handleStart} />
        )}

        {state.phase === 'word_selection' && (
          <WordSelectionScreen onConfirm={handleWordConfirm} />
        )}

        {state.phase === 'playing' && (
          <GameBoard
            state={state}
            onAskLetter={handleAskLetter}
            onGuessWord={handleGuessWord}
            onChoosePenalty={handleChoosePenalty}
          />
        )}

        {state.phase === 'finished' && (
          <ResultsScreen state={state} onPlayAgain={resetGame} />
        )}

        {/* Help button visible on all screens */}
        <HelpButton onClick={() => setRulesOpen(true)} />
        <RulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />
      </div>
    </GameContext.Provider>
  );
}
