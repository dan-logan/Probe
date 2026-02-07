import React, { useEffect, useRef } from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen overlay with scrollable game rules.
 * Close via X button, Escape key, or clicking outside.
 * Focus trapped inside modal while open.
 */
export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Focus the modal on open
    modalRef.current?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Game rules"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 focus:outline-none"
      >
        {/* Close Button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">How to Play</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
            aria-label="Close rules"
          >
            ✕
          </button>
        </div>

        {/* Rules Content */}
        <div className="space-y-6 text-gray-300">
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Objective</h3>
            <p>Be the last player with an unguessed word. Deduce your opponents' secret words while protecting your own.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Setup</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Each player chooses a secret word (4–12 letters)</li>
              <li>Each player reveals one "free letter" of their choice</li>
              <li>Turn order is randomized</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Turn Actions</h3>
            <p className="mb-2">On your turn, do one of:</p>
            <div className="space-y-3 ml-2">
              <div>
                <strong className="text-blue-400">Ask a Letter:</strong> Pick a letter (A–Z) and ask one opponent. If the letter is in their word, all instances are revealed and you get another turn. Otherwise, your turn ends.
              </div>
              <div>
                <strong className="text-purple-400">Guess a Word:</strong> Try to guess an opponent's full word. If correct, they're eliminated and you get another turn. If wrong, you must reveal one of your own unrevealed letters as a penalty.
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Penalties</h3>
            <p>When you guess a word incorrectly, you choose which of your own unrevealed letters to expose. Choose wisely — reveal the letter that gives away the least about your word!</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Winning</h3>
            <p>The last player whose word hasn't been guessed wins. Note: having all your letters revealed through asks doesn't eliminate you — someone must formally guess your word.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Tips</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Start with common letters (E, T, A, O) to gather info quickly</li>
              <li>Track which letters you've asked each opponent</li>
              <li>Choose uncommon words to make yourself harder to guess</li>
              <li>Pick a common letter as your free letter to give away less</li>
              <li>Only guess a word when you're confident — penalties are costly!</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
