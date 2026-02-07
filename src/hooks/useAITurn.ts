import { useEffect, useRef, useCallback } from 'react';
import type { GameState, PlayerId } from '../game/types';
import { decideAITurn, chooseAIPenaltyLetter, getAIThinkDelay } from '../game/ai';

interface UseAITurnOptions {
  state: GameState;
  askLetter: (actorId: PlayerId, targetId: PlayerId, letter: string) => void;
  guessWord: (actorId: PlayerId, targetId: PlayerId, guessedWord: string) => void;
  choosePenalty: (playerId: PlayerId, letterIndex: number) => void;
  /** Whether the help/rules modal is open — pauses AI when true */
  isPaused: boolean;
}

/**
 * Hook that schedules AI moves with a natural-feeling delay.
 *
 * When it's an AI player's turn, this hook waits 800–1200ms then
 * dispatches the AI's chosen action. If the AI gets another turn
 * (hit or correct guess), the cycle repeats with a new delay.
 *
 * AI turns pause when the rules modal is open (isPaused = true).
 */
export function useAITurn({ state, askLetter, guessWord, choosePenalty, isPaused }: UseAITurnOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Only act during the playing phase
    if (state.phase !== 'playing') return;

    // Don't act if paused (modal open)
    if (isPaused) {
      clearPendingTimeout();
      return;
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isAI) return;

    // Handle pending penalty for AI
    if (state.pendingPenalty && state.penaltyPlayerId === currentPlayer.id) {
      timeoutRef.current = setTimeout(() => {
        const penaltyIndex = chooseAIPenaltyLetter(currentPlayer);
        choosePenalty(currentPlayer.id, penaltyIndex);
      }, getAIThinkDelay());
      return () => clearPendingTimeout();
    }

    // Normal AI turn
    if (!state.pendingPenalty) {
      timeoutRef.current = setTimeout(() => {
        try {
          const decision = decideAITurn(state, currentPlayer);

          if (decision.action === 'ask_letter' && decision.letter) {
            askLetter(currentPlayer.id, decision.targetId, decision.letter);
          } else if (decision.action === 'guess_word' && decision.guessedWord) {
            guessWord(currentPlayer.id, decision.targetId, decision.guessedWord);
          }
        } catch (error) {
          console.error('AI decision error:', error);
        }
      }, getAIThinkDelay());

      return () => clearPendingTimeout();
    }
  }, [
    state.phase,
    state.currentPlayerIndex,
    state.pendingPenalty,
    state.penaltyPlayerId,
    state.turnNumber,
    isPaused,
    askLetter,
    guessWord,
    choosePenalty,
    clearPendingTimeout,
    state,
  ]);

  return { clearPendingTimeout };
}
