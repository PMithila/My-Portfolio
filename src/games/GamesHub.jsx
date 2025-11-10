import React from "react";
import MemoryMatchGame from "./FindMyPath.jsx";
import TicTacToe from "./TicTacToe.jsx";

const GamesHub = () => (
  <div className="games-hub">
    <MemoryMatchGame />
    <TicTacToe />
  </div>
);

export default GamesHub;
