import React, { useEffect, useMemo, useState } from "react";

const GRID_OPTIONS = [10, 20, 30];
const DEFAULT_SIZE = 20;

const createMatrix = (size, fill = "empty") =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => fill));

const coordKey = (row, col) => `${row}-${col}`;

const parseKey = (key) => key.split("-").map((value) => Number(value));

const buildBaseGrid = (size, start, end, walls) => {
  const grid = createMatrix(size, "empty");
  walls.forEach((key) => {
    const [row, col] = parseKey(key);
    if (row < size && col < size) {
      grid[row][col] = "wall";
    }
  });
  if (start && start.row < size && start.col < size) {
    grid[start.row][start.col] = "start";
  }
  if (end && end.row < size && end.col < size) {
    grid[end.row][end.col] = "end";
  }
  return grid;
};

const mergeGrids = (base, overlay) =>
  base.map((row, rowIndex) =>
    row.map((value, colIndex) => overlay[rowIndex]?.[colIndex] ?? value)
  );

const wait = (duration) =>
  new Promise((resolve) => setTimeout(resolve, Math.max(5, duration)));

const heuristic = (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

const getNeighbors = (row, col, size) => {
  const deltas = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  return deltas
    .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
    .filter(
      ({ row: r, col: c }) => r >= 0 && r < size && c >= 0 && c < size
    );
};

const runPathfinding = ({ size, start, end, walls, algorithm }) => {
  const open = [
    {
      row: start.row,
      col: start.col,
      g: 0,
      priority:
        algorithm === "astar" ? heuristic(start, end) : 0,
    },
  ];
  const cameFrom = new Map();
  const gScore = new Map([[coordKey(start.row, start.col), 0]]);
  const visited = new Set();
  const steps = [];
  let found = false;
  const startKey = coordKey(start.row, start.col);
  const endKey = coordKey(end.row, end.col);

  const t0 = performance.now();

  while (open.length) {
    open.sort((a, b) => a.priority - b.priority);
    const current = open.shift();
    const currentKey = coordKey(current.row, current.col);
    if (visited.has(currentKey)) continue;

    visited.add(currentKey);
    if (!(current.row === start.row && current.col === start.col)) {
      steps.push({
        row: current.row,
        col: current.col,
        status: "visited",
      });
    }

    if (current.row === end.row && current.col === end.col) {
      found = true;
      break;
    }

    const neighbors = getNeighbors(current.row, current.col, size);
    neighbors.forEach((neighbor) => {
      const neighborKey = coordKey(neighbor.row, neighbor.col);
      if (walls.has(neighborKey) || visited.has(neighborKey)) return;

      const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;
      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeG);
        const priority =
          algorithm === "astar"
            ? tentativeG + heuristic(neighbor, end)
            : tentativeG;
        open.push({
          row: neighbor.row,
          col: neighbor.col,
          priority,
        });
        steps.push({
          row: neighbor.row,
          col: neighbor.col,
          status: "frontier",
        });
      }
    });
  }

  const t1 = performance.now();
  const path = [];
  if (found) {
    let currentKey = endKey;
    path.push(parseKey(currentKey));
    while (cameFrom.has(currentKey)) {
      currentKey = cameFrom.get(currentKey);
      path.push(parseKey(currentKey));
      if (currentKey === startKey) break;
    }
    path.reverse();
  }

  return {
    steps,
    path: found ? path : [],
    visitedCount: visited.size,
    duration: t1 - t0,
    pathLength: found ? Math.max(0, path.length - 1) : 0,
    found,
  };
};

const FindMyPath = () => {
  const [gridSize, setGridSize] = useState(DEFAULT_SIZE);
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [walls, setWalls] = useState(new Set());
  const [baseGrid, setBaseGrid] = useState(() =>
    buildBaseGrid(DEFAULT_SIZE, null, null, new Set())
  );
  const [overlayGrid, setOverlayGrid] = useState(() =>
    createMatrix(DEFAULT_SIZE, null)
  );
  const [algorithm, setAlgorithm] = useState("astar");
  const [isAnimating, setIsAnimating] = useState(false);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState("");
  const [speed, setSpeed] = useState(35);

  useEffect(() => {
    setBaseGrid(buildBaseGrid(gridSize, startNode, endNode, walls));
    setOverlayGrid(createMatrix(gridSize, null));
  }, [gridSize, startNode, endNode, walls]);

  const displayGrid = useMemo(
    () => mergeGrids(baseGrid, overlayGrid),
    [baseGrid, overlayGrid]
  );

  const resetOverlay = () => {
    setOverlayGrid(createMatrix(gridSize, null));
  };

  const handleCellClick = (row, col) => {
    if (isAnimating) return;
    setMessage("");
    resetOverlay();
    setStats(null);
    const clickedKey = coordKey(row, col);

    if (startNode && startNode.row === row && startNode.col === col) {
      setStartNode(null);
      return;
    }

    if (endNode && endNode.row === row && endNode.col === col) {
      setEndNode(null);
      return;
    }

    if (!startNode) {
      setStartNode({ row, col });
      return;
    }

    if (!endNode) {
      setEndNode({ row, col });
      return;
    }

    setWalls((prev) => {
      const next = new Set(prev);
      if (next.has(clickedKey)) {
        next.delete(clickedKey);
      } else {
        next.add(clickedKey);
      }
      return next;
    });
  };

  const clearGrid = () => {
    if (isAnimating) return;
    setStartNode(null);
    setEndNode(null);
    setWalls(new Set());
    setStats(null);
    setMessage("");
    resetOverlay();
  };

  const randomizeWalls = () => {
    if (isAnimating) return;
    setMessage("");
    const probability = gridSize >= 25 ? 0.22 : 0.28;
    const nextWalls = new Set();
    for (let row = 0; row < gridSize; row += 1) {
      for (let col = 0; col < gridSize; col += 1) {
        const isCritical =
          (startNode && startNode.row === row && startNode.col === col) ||
          (endNode && endNode.row === row && endNode.col === col);
        if (isCritical) continue;
        if (Math.random() < probability) {
          nextWalls.add(coordKey(row, col));
        }
      }
    }
    setWalls(nextWalls);
    setStats(null);
    resetOverlay();
  };

  const handleResize = (size) => {
    if (isAnimating) return;
    setGridSize(size);
    setStartNode(null);
    setEndNode(null);
    setWalls(new Set());
    setStats(null);
    setMessage("");
    resetOverlay();
  };

  const animateTraversal = async (steps, path) => {
    setIsAnimating(true);
    const overlay = createMatrix(gridSize, null);
    const isCriticalCell = (row, col) =>
      (startNode && startNode.row === row && startNode.col === col) ||
      (endNode && endNode.row === row && endNode.col === col);

    for (const step of steps) {
      if (isCriticalCell(step.row, step.col)) continue;
      overlay[step.row][step.col] = step.status;
      setOverlayGrid(overlay.map((row) => row.slice()));
      await wait(speed);
    }

    for (const node of path) {
      const [row, col] = node;
      if (isCriticalCell(row, col)) continue;
      overlay[row][col] = "path";
      setOverlayGrid(overlay.map((row) => row.slice()));
      await wait(Math.max(10, speed));
    }
    setIsAnimating(false);
  };

  const handleRun = async () => {
    if (isAnimating) return;
    if (!startNode || !endNode) {
      setMessage("Place both start and end nodes before running a search.");
      return;
    }
    setMessage("");
    setStats(null);
    resetOverlay();

    const result = runPathfinding({
      size: gridSize,
      start: startNode,
      end: endNode,
      walls,
      algorithm,
    });

    await animateTraversal(result.steps, result.path);
    setStats({
      algorithm: algorithm === "astar" ? "A*" : "Dijkstra",
      pathLength: result.pathLength,
      visited: result.visitedCount,
      duration: result.duration.toFixed(2),
      found: result.found,
    });
    if (!result.found) {
      setMessage("No path found. Try adjusting walls or node placement.");
    }
  };

  return (
    <div className="find-my-path">
      <div className="find-my-path__intro">
        <h3>Find My Path</h3>
        <p>
          Drop a start (green) and end (red) node, paint some walls, then watch
          A* or Dijkstra explore the maze. Every step is animated so you can see
          how the algorithm thinks.
        </p>
      </div>
      <div className="find-my-path__controls">
        <label>
          Algorithm
          <select
            value={algorithm}
            onChange={(event) => setAlgorithm(event.target.value)}
            disabled={isAnimating}
          >
            <option value="astar">A* Search</option>
            <option value="dijkstra">Dijkstra</option>
          </select>
        </label>

        <label>
          Grid Size
          <select
            value={gridSize}
            onChange={(event) => handleResize(Number(event.target.value))}
            disabled={isAnimating}
          >
            {GRID_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} x {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Speed ({speed}ms)
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            disabled={isAnimating}
          />
        </label>

        <div className="find-my-path__buttons">
          <button onClick={handleRun} disabled={isAnimating}>
            {isAnimating ? "Visualizing..." : "Run Algorithm"}
          </button>
          <button onClick={clearGrid} disabled={isAnimating}>
            Clear Grid
          </button>
          <button onClick={randomizeWalls} disabled={isAnimating}>
            Randomize Walls
          </button>
        </div>
      </div>

      <div
        className="find-my-path__grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(16px, 1fr))`,
        }}
      >
        {displayGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`path-cell cell-${cell}`}
              type="button"
              onClick={() => handleCellClick(rowIndex, colIndex)}
              disabled={isAnimating}
              aria-label={`Grid cell ${rowIndex}, ${colIndex}`}
            />
          ))
        )}
      </div>

      <div className="find-my-path__legend">
        <span className="legend-item">
          <span className="legend-swatch cell-start" /> Start
        </span>
        <span className="legend-item">
          <span className="legend-swatch cell-end" /> End
        </span>
        <span className="legend-item">
          <span className="legend-swatch cell-wall" /> Wall
        </span>
        <span className="legend-item">
          <span className="legend-swatch cell-visited" /> Visited
        </span>
        <span className="legend-item">
          <span className="legend-swatch cell-frontier" /> Frontier
        </span>
        <span className="legend-item">
          <span className="legend-swatch cell-path" /> Final Path
        </span>
      </div>

      {stats && (
        <div className="find-my-path__stats">
          <h4>Run Stats</h4>
          <div className="stat-row">
            <span>Algorithm:</span>
            <strong>{stats.algorithm}</strong>
          </div>
          <div className="stat-row">
            <span>Path Length:</span>
            <strong>{stats.pathLength}</strong>
          </div>
          <div className="stat-row">
            <span>Nodes Visited:</span>
            <strong>{stats.visited}</strong>
          </div>
          <div className="stat-row">
            <span>Execution Time:</span>
            <strong>{stats.duration} ms</strong>
          </div>
          {!stats.found && (
            <div className="stat-row warning">No valid path detected.</div>
          )}
        </div>
      )}

      {message && <p className="find-my-path__message">{message}</p>}
    </div>
  );
};

export default FindMyPath;
