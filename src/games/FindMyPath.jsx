import React, { useEffect, useMemo, useState } from "react";

const GRID_SIZE = 4;
const TOTAL_PAIRS = (GRID_SIZE * GRID_SIZE) / 2;
const GAME_DURATION = 60; // seconds
const CARD_SYMBOLS = [
  "🌕",
  "🌟",
  "🪐",
  "☄️",
  "🚀",
  "🛰️",
  "👾",
  "🌌",
];
const INITIAL_MESSAGE = "Find every matching pair before the 1-minute timer hits zero.";

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const shuffleArray = (array) => {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};

const createDeck = () => {
  const base = CARD_SYMBOLS.slice(0, TOTAL_PAIRS);
  const paired = base.flatMap((symbol, index) => [
    { id: `${symbol}-${index}-a`, symbol, matched: false },
    { id: `${symbol}-${index}-b`, symbol, matched: false },
  ]);
  return shuffleArray(paired);
};

const MemoryMatchGame = () => {
  const [cards, setCards] = useState(() => createDeck());
  const [flipped, setFlipped] = useState([]);
  const [matches, setMatches] = useState(0);
  const [status, setStatus] = useState("playing");
  const [message, setMessage] = useState(INITIAL_MESSAGE);
  const [lockBoard, setLockBoard] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [timerRunning, setTimerRunning] = useState(false);

  const timerDisplay = useMemo(() => formatTime(timeLeft), [timeLeft]);

  const resetGame = () => {
    setCards(createDeck());
    setFlipped([]);
    setMatches(0);
    setStatus("playing");
    setMessage(INITIAL_MESSAGE);
    setLockBoard(false);
    setTimeLeft(GAME_DURATION);
    setTimerRunning(false);
  };

  useEffect(() => {
    if (matches === TOTAL_PAIRS && status === "playing") {
      setStatus("won");
      setMessage("Perfect memory! Every pair has been cleared.");
    }
  }, [matches, status]);

  useEffect(() => {
    if (!timerRunning || status !== "playing") return undefined;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStatus("lost");
          setMessage("Time's up! Try again to beat the deck!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, status]);

  useEffect(() => {
    if (status !== "playing") {
      setTimerRunning(false);
    }
  }, [status]);

  const handleCardClick = (cardId) => {
    if (lockBoard || status !== "playing") return;
    if (!timerRunning) setTimerRunning(true);

    const clickedCard = cards.find((card) => card.id === cardId);
    if (!clickedCard || clickedCard.matched || flipped.includes(cardId)) return;

    setMessage("Find its matching card.");
    const updatedFlipped = [...flipped, cardId];
    setFlipped(updatedFlipped);

    if (updatedFlipped.length !== 2) {
      return;
    }

    setLockBoard(true);
    const [firstId, secondId] = updatedFlipped;
    const firstCard = cards.find((card) => card.id === firstId);
    const secondCard = cards.find((card) => card.id === secondId);

    if (firstCard?.symbol === secondCard?.symbol) {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((card) =>
            card.id === firstId || card.id === secondId
              ? { ...card, matched: true }
              : card
          )
        );
        setMatches((prev) => {
          const updated = prev + 1;
          if (updated < TOTAL_PAIRS) {
            setMessage(`Pair found! ${TOTAL_PAIRS - updated} to go.`);
          }
          return updated;
        });
        setFlipped([]);
        setLockBoard(false);
      }, 400);
      return;
    }

    setTimeout(() => {
      setFlipped([]);
      setLockBoard(false);
      setMessage("No match. Keep searching!");
    }, 900);
  };

  return (
    <div className="memory-match">
      <div className="memory-header">
        <h3>Match the Cards</h3>
        <p>
          Flip the cards, remember their spots, and match every pair before the
          timer reaches zero.
        </p>
      </div>

      <div className="memory-stats">
        <div className="memory-timer" aria-label={`Time remaining: ${timerDisplay}`}>
          <span>Time left:</span>
          <span>{timerDisplay}</span>
        </div>
        <div className="memory-progress">
          Pairs cleared: {matches}/{TOTAL_PAIRS}
        </div>
        <button type="button" onClick={resetGame} className="memory-reset">
          Reset Game
        </button>
      </div>

      <p className="memory-message" role="status">
        {message}
      </p>

      <div
        className="memory-grid"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {cards.map((card) => {
          const isRevealed = card.matched || flipped.includes(card.id);
          return (
            <button
              key={card.id}
              type="button"
              className={`memory-card${isRevealed ? " revealed" : ""}${
                card.matched ? " matched" : ""
              }`}
              onClick={() => handleCardClick(card.id)}
              disabled={
                card.matched ||
                flipped.includes(card.id) ||
                status !== "playing" ||
                lockBoard
              }
              aria-label={
                card.matched
                  ? "Card removed"
                  : isRevealed
                  ? `Showing ${card.symbol}`
                  : "Hidden card"
              }
            >
              <span className="memory-card__symbol">
                {isRevealed ? card.symbol : "?"}
              </span>
            </button>
          );
        })}
      </div>

      {status !== "playing" && (
        <div className="memory-result">
          {status === "won" ? "Victory!" : "Game Over"}
        </div>
      )}
    </div>
  );
};

export default MemoryMatchGame;
