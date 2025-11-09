import React, { useEffect, useMemo, useState } from "react";

const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const pickBestMove = (board, marker) => {
  const emptyIndices = board
    .map((value, index) => (value === "" ? index : null))
    .filter((value) => value !== null);

  // Try winning move
  for (const index of emptyIndices) {
    const testBoard = [...board];
    testBoard[index] = marker;
    if (checkWinner(testBoard) === marker) {
      return index;
    }
  }

  return null;
};

const checkWinner = (board) => {
  for (const combo of winningCombos) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(""));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [status, setStatus] = useState("Your move! Choose any square.");
  const [scores, setScores] = useState({ player: 0, bot: 0, draws: 0 });

  const emptyCount = useMemo(
    () => board.filter((value) => value === "").length,
    [board]
  );

  const winner = useMemo(() => checkWinner(board), [board]);
  const isFinished = winner || emptyCount === 0;

  useEffect(() => {
    if (!isPlayerTurn && !isFinished) {
      const timeout = setTimeout(() => {
        botMove();
      }, 650);
      return () => clearTimeout(timeout);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayerTurn, isFinished]);

  useEffect(() => {
    if (winner === "X") {
      setStatus("Nice! You sealed the win.");
      setScores((prev) => ({ ...prev, player: prev.player + 1 }));
    } else if (winner === "O") {
      setStatus("Bot takes the round. Rematch?");
      setScores((prev) => ({ ...prev, bot: prev.bot + 1 }));
    } else if (!winner && emptyCount === 0) {
      setStatus("Draw! Fresh board?");
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
    }
  }, [winner, emptyCount]);

  const handleSquareClick = (index) => {
    if (!isPlayerTurn || board[index] || isFinished) return;
    const nextBoard = [...board];
    nextBoard[index] = "X";
    setBoard(nextBoard);
    setIsPlayerTurn(false);
    setStatus("Calculating best reply...");
  };

  const botMove = () => {
    const currentBoard = [...board];
    const emptyIndices = currentBoard
      .map((value, index) => (value === "" ? index : null))
      .filter((value) => value !== null);

    if (!emptyIndices.length || isFinished) return;

    // try winning
    let move =
      pickBestMove(currentBoard, "O") ??
      // try block
      pickBestMove(currentBoard, "X");

    // prefer center
    if (move === null && emptyIndices.includes(4)) {
      move = 4;
    }

    // pick corner
    const corners = [0, 2, 6, 8].filter((corner) =>
      emptyIndices.includes(corner)
    );
    if (move === null && corners.length) {
      move = corners[Math.floor(Math.random() * corners.length)];
    }

    // fallback random
    if (move === null) {
      move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    currentBoard[move] = "O";
    setBoard(currentBoard);
    setIsPlayerTurn(true);
    if (!winner) {
      setStatus("Your turn! Spot the winning line.");
    }
  };

  const resetBoard = () => {
    setBoard(Array(9).fill(""));
    setIsPlayerTurn(true);
    setStatus("New round! You play as X.");
  };

  return (
    <div className="tic-tac-toe">
      <div className="tic-header">
        <h3>Tic Tac Toe</h3>
        <p>
          Tap a tile to drop your <strong>X</strong>. The bot responds instantly
          trying to snag three in a row, but it’s beatable—outsmart it!
        </p>
      </div>

      <div className="tic-grid">
        {board.map((value, index) => (
          <button
            key={index}
            type="button"
            className={`tic-cell ${value ? `tic-cell--${value}` : ""}`}
            onClick={() => handleSquareClick(index)}
            disabled={Boolean(value) || isFinished || !isPlayerTurn}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="tic-status">
        <span>{status}</span>
        <button type="button" onClick={resetBoard}>
          Restart
        </button>
      </div>

      <div className="tic-scoreboard">
        <div>
          <span>You</span>
          <strong>{scores.player}</strong>
        </div>
        <div>
          <span>Bot</span>
          <strong>{scores.bot}</strong>
        </div>
        <div>
          <span>Draws</span>
          <strong>{scores.draws}</strong>
        </div>
      </div>
    </div>
  );
};

export default TicTacToe;
