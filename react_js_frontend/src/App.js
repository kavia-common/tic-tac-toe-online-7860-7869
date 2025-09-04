import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

// Game types and helpers
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // cols
  [0, 4, 8],
  [2, 4, 6], // diagonals
];

function calculateWinner(squares) {
  for (const [a, b, c] of LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { player: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

function findBestMoveBasicAI(squares, aiPlayer) {
  // Basic AI: 1) can I win? 2) can I block? 3) take center 4) take a corner 5) take a side
  const human = aiPlayer === 'X' ? 'O' : 'X';

  // 1) Try to win
  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      const test = squares.slice();
      test[i] = aiPlayer;
      if (calculateWinner(test)) return i;
    }
  }

  // 2) Try to block human
  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      const test = squares.slice();
      test[i] = human;
      if (calculateWinner(test)) return i;
    }
  }

  // 3) Center
  if (!squares[4]) return 4;

  // 4) Corners
  const corners = [0, 2, 6, 8].filter(i => !squares[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  // 5) Sides
  const sides = [1, 3, 5, 7].filter(i => !squares[i]);
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];

  return null;
}

// Square component
function Square({ value, onClick, highlight }) {
  return (
    <button
      className={`ttt-square ${highlight ? 'highlight' : ''}`}
      onClick={onClick}
      aria-label={`Square ${value ? value : 'empty'}`}
    >
      {value}
    </button>
  );
}

// Board component
function Board({ squares, onSquareClick, winningLine }) {
  return (
    <div className="ttt-board" role="grid" aria-label="Tic Tac Toe board">
      {squares.map((value, idx) => (
        <Square
          key={idx}
          value={value}
          onClick={() => onSquareClick(idx)}
          highlight={winningLine?.includes(idx)}
        />
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /**
   * A complete Tic Tac Toe game with:
   * - two-player on same device
   * - optional basic AI
   * - responsive, minimalistic UI and light theme
   * - restart/reset, status messages, winner/draw display
   */
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState('two'); // 'two' | 'single'
  const [aiPlays, setAiPlays] = useState('O'); // 'X' | 'O'
  const [theme] = useState('light'); // light-only per requirements

  // Apply theme (light)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const winnerInfo = useMemo(() => calculateWinner(squares), [squares]);
  const isBoardFull = useMemo(() => squares.every(Boolean), [squares]);
  const currentPlayer = xIsNext ? 'X' : 'O';
  const isGameOver = !!winnerInfo || isBoardFull;

  const status = useMemo(() => {
    if (winnerInfo) {
      return `Winner: ${winnerInfo.player}`;
    }
    if (isBoardFull) {
      return "It's a draw!";
    }
    return `Next: ${currentPlayer}` + (mode === 'single' ? (currentPlayer === aiPlays ? ' (AI)' : ' (You)') : '');
  }, [winnerInfo, isBoardFull, currentPlayer, mode, aiPlays]);

  const handleSquareClick = useCallback(
    (idx) => {
      if (squares[idx] || isGameOver) return;

      // Human move or any move in two-player mode
      setSquares(prev => {
        const next = prev.slice();
        next[idx] = currentPlayer;
        return next;
      });
      setXIsNext(prev => !prev);
    },
    [squares, isGameOver, currentPlayer]
  );

  // AI move effect
  useEffect(() => {
    if (mode !== 'single') return;
    if (isGameOver) return;
    const playerToMove = xIsNext ? 'X' : 'O';
    if (playerToMove !== aiPlays) return;

    const timer = setTimeout(() => {
      setSquares(prev => {
        const move = findBestMoveBasicAI(prev, aiPlays);
        if (move === null || prev[move]) return prev;
        const next = prev.slice();
        next[move] = aiPlays;
        return next;
      });
      setXIsNext(prev => !prev);
    }, 300); // a small delay for UX

    return () => clearTimeout(timer);
  }, [mode, xIsNext, aiPlays, isGameOver]);

  const resetBoard = useCallback(() => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  }, []);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    resetBoard();
  }, [resetBoard]);

  const handleAiPlaysChange = useCallback((who) => {
    setAiPlays(who);
    resetBoard();
  }, [resetBoard]);

  return (
    <div className="App">
      <header className="ttt-header">
        <h1 className="ttt-title">Tic Tac Toe</h1>
        <p className="ttt-subtitle">Classic. Minimal. Fun.</p>
      </header>

      <main className="ttt-main">
        <section className="ttt-controls" aria-label="Game settings">
          <div className="control-group">
            <span className="control-label">Mode:</span>
            <div className="control-buttons" role="group" aria-label="Mode selection">
              <button
                className={`btn ${mode === 'two' ? 'active' : ''}`}
                onClick={() => handleModeChange('two')}
              >
                Two Players
              </button>
              <button
                className={`btn ${mode === 'single' ? 'active' : ''}`}
                onClick={() => handleModeChange('single')}
              >
                Single Player
              </button>
            </div>
          </div>

          {mode === 'single' && (
            <div className="control-group">
              <span className="control-label">AI plays:</span>
              <div className="control-buttons" role="group" aria-label="AI plays">
                <button
                  className={`btn ${aiPlays === 'X' ? 'active' : ''}`}
                  onClick={() => handleAiPlaysChange('X')}
                >
                  X (First)
                </button>
                <button
                  className={`btn ${aiPlays === 'O' ? 'active' : ''}`}
                  onClick={() => handleAiPlaysChange('O')}
                >
                  O (Second)
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="ttt-board-wrapper">
          <div className="ttt-status" role="status" aria-live="polite">{status}</div>
          <Board
            squares={squares}
            onSquareClick={handleSquareClick}
            winningLine={winnerInfo?.line}
          />
          <div className="ttt-actions">
            <button className="btn btn-accent" onClick={resetBoard} aria-label="Restart game">
              Restart
            </button>
          </div>
        </section>
      </main>

      <footer className="ttt-footer">
        <small>Built with React • Minimal, responsive UI</small>
      </footer>
    </div>
  );
}

export default App;
