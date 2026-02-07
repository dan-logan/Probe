import type { GameState } from '../game/types';

interface ResultsScreenProps {
  state: GameState;
  onPlayAgain: () => void;
}

/**
 * Results screen shown after the game ends.
 * Displays the winner, reveals all words, and shows game stats.
 */
export function ResultsScreen({ state, onPlayAgain }: ResultsScreenProps) {
  const winner = state.players.find(p => p.id === state.winner);
  const isHumanWinner = state.winner === 'human';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      {/* Outcome */}
      <div className={`text-center mb-8 ${isHumanWinner ? 'animate-confetti' : ''}`}>
        <h1 className="text-5xl font-bold mb-2">
          {isHumanWinner ? 'You Won!' : `${winner?.name ?? 'Unknown'} Won!`}
        </h1>
        <p className="text-gray-400 text-lg">
          {isHumanWinner
            ? 'Congratulations — you outsmarted the AI!'
            : 'Better luck next time!'}
        </p>
      </div>

      {/* Word Reveal */}
      <div className="mb-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center">All Words</h2>
        <div className="space-y-3">
          {state.players.map(player => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                player.id === state.winner
                  ? 'bg-green-900/30 border border-green-600'
                  : player.eliminated
                  ? 'bg-gray-800 opacity-60'
                  : 'bg-gray-800'
              }`}
            >
              <span className="text-gray-300 font-medium">{player.name}</span>
              <span className="text-xl tracking-widest font-mono">{player.word}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Game Stats */}
      <div className="mb-8 text-center">
        <h2 className="text-xl font-semibold mb-3">Stats</h2>
        <div className="flex gap-6 text-gray-400">
          <div>
            <div className="text-2xl font-bold text-white">{state.turnNumber}</div>
            <div className="text-sm">Turns</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{state.log.length}</div>
            <div className="text-sm">Actions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {state.log.filter(e => e.result === 'hit').length}
            </div>
            <div className="text-sm">Hits</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {state.players.filter(p => p.eliminated).length}
            </div>
            <div className="text-sm">Eliminated</div>
          </div>
        </div>
      </div>

      {/* Play Again */}
      <button
        onClick={onPlayAgain}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Play Again
      </button>
    </div>
  );
}
