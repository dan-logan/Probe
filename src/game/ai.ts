import type { Player, PlayerId, GameState, Difficulty } from './types';
import { getWordsByTier, getWordsOfLength } from './dictionary';

// ─── Constants ───────────────────────────────────────────────────────────────

/** English letter frequency order for medium AI letter selection. */
const FREQUENCY_ORDER = 'ETAOINSHRDLCUMWFGYPBVKJXQZ'.split('');

/** Vowels — easy AI has a bias toward these. */
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/** Delay range (ms) for AI "thinking" animation. */
export const AI_THINK_DELAY_MIN = 800;
export const AI_THINK_DELAY_MAX = 1200;

// ─── AI Word Selection ───────────────────────────────────────────────────────

/**
 * Choose a secret word for the AI player based on difficulty.
 * - Easy: common 4–6 letter words (tier 1)
 * - Medium: 5–8 letter words (tier 1 or 2)
 * - Hard: 7–12 letter uncommon words (tier 2 or 3)
 */
export function chooseAIWord(difficulty: Difficulty): string {
  let candidates: string[];

  switch (difficulty) {
    case 'easy':
      candidates = getWordsByTier(1).filter(w => w.length >= 4 && w.length <= 6);
      break;
    case 'medium':
      candidates = [
        ...getWordsByTier(1).filter(w => w.length >= 5 && w.length <= 8),
        ...getWordsByTier(2).filter(w => w.length >= 5 && w.length <= 8),
      ];
      break;
    case 'hard':
      candidates = [
        ...getWordsByTier(2).filter(w => w.length >= 7 && w.length <= 12),
        ...getWordsByTier(3).filter(w => w.length >= 7 && w.length <= 12),
      ];
      break;
  }

  if (candidates.length === 0) {
    // Fallback: pick any valid word
    candidates = getWordsByTier(1);
  }

  return candidates[Math.floor(Math.random() * candidates.length)].toUpperCase();
}

// ─── AI Free Letter Selection ────────────────────────────────────────────────

/**
 * Choose which letter index to reveal as the free letter.
 * - Easy: random index
 * - Medium: pick the letter that is most common in English (least useful to hide)
 * - Hard: pick the letter that gives away the least information (rarest letter)
 */
export function chooseAIFreeLetter(word: string, difficulty: Difficulty): number {
  const letters = word.toUpperCase().split('');

  switch (difficulty) {
    case 'easy':
      return Math.floor(Math.random() * letters.length);

    case 'medium': {
      // Reveal the most common letter (least useful to keep hidden)
      let bestIndex = 0;
      let bestFreqRank = Infinity;
      letters.forEach((letter, i) => {
        const rank = FREQUENCY_ORDER.indexOf(letter);
        if (rank !== -1 && rank < bestFreqRank) {
          bestFreqRank = rank;
          bestIndex = i;
        }
      });
      return bestIndex;
    }

    case 'hard': {
      // Reveal the rarest letter (gives away the least information)
      let bestIndex = 0;
      let worstFreqRank = -1;
      letters.forEach((letter, i) => {
        const rank = FREQUENCY_ORDER.indexOf(letter);
        if (rank > worstFreqRank) {
          worstFreqRank = rank;
          bestIndex = i;
        }
      });
      return bestIndex;
    }
  }
}

// ─── AI Turn Decision ────────────────────────────────────────────────────────

export interface AIDecision {
  action: 'ask_letter' | 'guess_word';
  targetId: PlayerId;
  letter?: string;       // set when action = 'ask_letter'
  guessedWord?: string;  // set when action = 'guess_word'
}

/**
 * Decide the AI's move for this turn.
 * High-level logic:
 *   1. If confident enough to guess a word → guess it
 *   2. Otherwise → ask a letter of the most promising target
 */
export function decideAITurn(state: GameState, aiPlayer: Player): AIDecision {
  const opponents = state.players.filter(p => p.id !== aiPlayer.id && !p.eliminated);
  if (opponents.length === 0) {
    // No opponents left — this shouldn't happen during normal play
    throw new Error('AI has no valid opponents');
  }

  const difficulty = aiPlayer.difficulty;

  // Check if we should attempt a word guess
  const guessAttempt = tryWordGuess(aiPlayer, opponents, difficulty);
  if (guessAttempt) return guessAttempt;

  // Otherwise, ask a letter
  const target = chooseTarget(aiPlayer, opponents, difficulty);
  const letter = chooseLetter(aiPlayer, target, difficulty);

  return {
    action: 'ask_letter',
    targetId: target.id,
    letter,
  };
}

// ─── Targeting ───────────────────────────────────────────────────────────────

function chooseTarget(aiPlayer: Player, opponents: Player[], difficulty: Difficulty): Player {
  switch (difficulty) {
    case 'easy':
      // Random opponent
      return opponents[Math.floor(Math.random() * opponents.length)];

    case 'medium': {
      // Target opponent with most revealed letters (closest to solved)
      return opponents.reduce((best, opp) => {
        const revealedCount = opp.revealedMask.filter(Boolean).length;
        const bestCount = best.revealedMask.filter(Boolean).length;
        return revealedCount > bestCount ? opp : best;
      });
    }

    case 'hard': {
      // Target opponent whose candidate list is smallest
      const tracking = aiPlayer.aiState?.letterTracking;
      if (!tracking) return opponents[0];
      return opponents.reduce((best, opp) => {
        const oppCandidates = tracking[opp.id]?.candidateWords.length ?? Infinity;
        const bestCandidates = tracking[best.id]?.candidateWords.length ?? Infinity;
        return oppCandidates < bestCandidates ? opp : best;
      });
    }
  }
}

// ─── Letter Selection ────────────────────────────────────────────────────────

function chooseLetter(aiPlayer: Player, target: Player, difficulty: Difficulty): string {
  const tracking = aiPlayer.aiState?.letterTracking[target.id];
  const asked = tracking?.askedLetters ?? new Set<string>();

  // Letters already revealed in target's word — no need to ask these
  const knownLetters = new Set<string>();
  target.revealedMask.forEach((revealed, i) => {
    if (revealed) knownLetters.add(target.word[i]);
  });

  const available = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    .split('')
    .filter(l => !asked.has(l) && !knownLetters.has(l));

  if (available.length === 0) {
    // Fallback: just pick any un-asked letter
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      .split('')
      .filter(l => !asked.has(l))[0] ?? 'A';
  }

  switch (difficulty) {
    case 'easy': {
      // Random, with slight vowel bias
      const vowelsAvailable = available.filter(l => VOWELS.has(l));
      if (vowelsAvailable.length > 0 && Math.random() < 0.6) {
        return vowelsAvailable[Math.floor(Math.random() * vowelsAvailable.length)];
      }
      return available[Math.floor(Math.random() * available.length)];
    }

    case 'medium': {
      // Frequency-ordered
      for (const letter of FREQUENCY_ORDER) {
        if (available.includes(letter)) return letter;
      }
      return available[0];
    }

    case 'hard': {
      // Information-theoretic: pick the letter that maximally partitions the
      // remaining candidate words. For each available letter, count how many
      // candidates contain it vs don't — the best letter is the one closest
      // to a 50/50 split.
      const candidates = tracking?.candidateWords ?? [];
      if (candidates.length === 0) {
        // Fallback to frequency if no candidates tracked
        for (const letter of FREQUENCY_ORDER) {
          if (available.includes(letter)) return letter;
        }
        return available[0];
      }

      let bestLetter = available[0];
      let bestScore = Infinity;

      for (const letter of available) {
        const withLetter = candidates.filter(w => w.toUpperCase().includes(letter)).length;
        const withoutLetter = candidates.length - withLetter;
        // Score = distance from perfect 50/50 split
        const score = Math.abs(withLetter - withoutLetter);
        if (score < bestScore) {
          bestScore = score;
          bestLetter = letter;
        }
      }

      return bestLetter;
    }
  }
}

// ─── Word Guessing ───────────────────────────────────────────────────────────

function tryWordGuess(
  aiPlayer: Player,
  opponents: Player[],
  difficulty: Difficulty
): AIDecision | null {
  for (const opp of opponents) {
    const totalLetters = opp.word.length;
    const revealedCount = opp.revealedMask.filter(Boolean).length;
    const revealedRatio = revealedCount / totalLetters;

    switch (difficulty) {
      case 'easy': {
        // Only guess when 100% of letters are revealed
        if (revealedCount === totalLetters) {
          return {
            action: 'guess_word',
            targetId: opp.id,
            guessedWord: opp.word, // All letters are visible
          };
        }
        break;
      }

      case 'medium': {
        // Guess when >=80% revealed and a dictionary match exists
        if (revealedRatio >= 0.8) {
          const guess = findMatchingWord(opp);
          if (guess) {
            return { action: 'guess_word', targetId: opp.id, guessedWord: guess };
          }
        }
        break;
      }

      case 'hard': {
        // Guess when candidate list is 1–3 words
        const tracking = aiPlayer.aiState?.letterTracking[opp.id];
        const candidates = tracking?.candidateWords ?? [];
        if (candidates.length >= 1 && candidates.length <= 3) {
          return {
            action: 'guess_word',
            targetId: opp.id,
            guessedWord: candidates[0].toUpperCase(),
          };
        }
        break;
      }
    }
  }

  return null;
}

/**
 * Given an opponent with partially revealed letters, try to find a dictionary
 * word that matches the known pattern.
 */
function findMatchingWord(opponent: Player): string | null {
  // Build a pattern from revealed letters, e.g. "H_LL_" → regex /^H.LL.$/
  const pattern = opponent.revealedMask.map((revealed, i) =>
    revealed ? opponent.word[i] : '.'
  ).join('');

  const regex = new RegExp(`^${pattern}$`, 'i');
  const candidates = getWordsOfLength(opponent.word.length)
    .filter(w => regex.test(w));

  if (candidates.length === 0) return null;
  return candidates[0].toUpperCase();
}

// ─── AI Penalty Handling ─────────────────────────────────────────────────────

/**
 * When the AI guesses wrong and must reveal a letter, pick the one that
 * leaks the least information.
 */
export function chooseAIPenaltyLetter(player: Player): number {
  const unrevealed = player.revealedMask
    .map((r, i) => (r ? -1 : i))
    .filter(i => i !== -1);

  if (unrevealed.length === 0) return 0; // shouldn't happen

  switch (player.difficulty) {
    case 'easy':
      // Random unrevealed letter
      return unrevealed[Math.floor(Math.random() * unrevealed.length)];

    case 'medium':
    case 'hard': {
      // Reveal the most common letter (least informative to opponents)
      let bestIndex = unrevealed[0];
      let bestFreqRank = Infinity;
      for (const idx of unrevealed) {
        const rank = FREQUENCY_ORDER.indexOf(player.word[idx]);
        if (rank !== -1 && rank < bestFreqRank) {
          bestFreqRank = rank;
          bestIndex = idx;
        }
      }
      return bestIndex;
    }
  }
}

/** Generate a random delay for AI "thinking" animation. */
export function getAIThinkDelay(): number {
  return AI_THINK_DELAY_MIN + Math.random() * (AI_THINK_DELAY_MAX - AI_THINK_DELAY_MIN);
}
