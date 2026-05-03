// --- Elements du DOM ---
const cells = document.querySelectorAll(".cell");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("reset-btn");
const levelButtons = document.querySelectorAll(".level-btn");

const scorePlayerEl = document.getElementById("score-player");
const scoreAiEl = document.getElementById("score-ai");
const scoreDrawEl = document.getElementById("score-draw");

// --- Etat du jeu ---
let board = Array(9).fill(null);
const HUMAN = "X";
const AI = "O";
let currentPlayer = HUMAN;
let gameOver = false;
let difficulty = "easy";

let scorePlayer = 0;
let scoreAi = 0;
let scoreDraw = 0;

// --- Combinaisons gagnantes ---
const winPatterns = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// ================== INIT ===================
cells.forEach((cell) => {
  cell.addEventListener("click", onCellClick);
});

resetBtn.addEventListener("click", resetGame);

levelButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    levelButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    difficulty = btn.dataset.level;
    resetGame(); // on repart sur une nouvelle partie
  });
});

updateStatus("À vous de jouer (vous êtes X).");

// ================== HANDLERS ===================
function onCellClick(e) {
  const index = parseInt(e.target.dataset.index, 10);

  if (gameOver || board[index] !== null || currentPlayer !== HUMAN) return;

  makeMove(index, HUMAN);
  const result = checkGameEnd();

  if (!result) {
    currentPlayer = AI;
    updateStatus("Tour de l’IA…");
    setTimeout(aiTurn, 450);
  }
}

function aiTurn() {
  if (gameOver) return;

  const index = chooseAiMove();
  makeMove(index, AI);
  checkGameEnd();

  if (!gameOver) {
    currentPlayer = HUMAN;
    updateStatus("À vous de jouer.");
  }
}

// ================== MOTEUR DE JEU ===================
function makeMove(index, player) {
  board[index] = player;
  const cell = cells[index];
  cell.textContent = player;
  cell.classList.add(player === HUMAN ? "x" : "o");
}

function checkGameEnd() {
  const winnerInfo = getWinner(board);

  if (winnerInfo) {
    gameOver = true;
    highlightWinner(winnerInfo.line);

    if (winnerInfo.winner === HUMAN) {
      scorePlayer++;
      scorePlayerEl.textContent = scorePlayer;
      updateStatus("<span>Vous gagnez 🎉</span>");
    } else {
      scoreAi++;
      scoreAiEl.textContent = scoreAi;
      updateStatus("<span>L’IA gagne 🤖</span>");
    }
    return true;
  }

  if (isBoardFull(board)) {
    gameOver = true;
    scoreDraw++;
    scoreDrawEl.textContent = scoreDraw;
    updateStatus("<span>Match nul.</span>");
    return true;
  }

  return false;
}

function highlightWinner(line) {
  line.forEach((i) => {
    cells[i].classList.add("winning");
  });
}

// ================== IA ===================
function chooseAiMove() {
  const available = getAvailableMoves(board);

  if (difficulty === "easy") {
    // IA totalement aléatoire
    return randomFrom(available);
  }

  if (difficulty === "normal") {
    // 60% du temps : coup optimal / 40% du temps : aléatoire
    const rnd = Math.random();
    if (rnd < 0.6) {
      return bestMoveMinimax();
    } else {
      return randomFrom(available);
    }
  }

  // impossible → toujours meilleur coup
  return bestMoveMinimax();
}

function randomFrom(arr) {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

function bestMoveMinimax() {
  let bestScore = -Infinity;
  let move = null;

  getAvailableMoves(board).forEach((index) => {
    board[index] = AI;
    const score = minimax(board, 0, false);
    board[index] = null;

    if (score > bestScore) {
      bestScore = score;
      move = index;
    }
  });

  return move;
}

// Minimax classique pour Tic Tac Toe
function minimax(newBoard, depth, isMaximizing) {
  const winnerInfo = getWinner(newBoard);

  if (winnerInfo) {
    // IA gagne
    if (winnerInfo.winner === AI) return 10 - depth;
    // humain gagne
    if (winnerInfo.winner === HUMAN) return depth - 10;
  }

  if (isBoardFull(newBoard)) {
    return 0;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    getAvailableMoves(newBoard).forEach((i) => {
      newBoard[i] = AI;
      const score = minimax(newBoard, depth + 1, false);
      newBoard[i] = null;
      bestScore = Math.max(score, bestScore);
    });
    return bestScore;
  } else {
    let bestScore = Infinity;
    getAvailableMoves(newBoard).forEach((i) => {
      newBoard[i] = HUMAN;
      const score = minimax(newBoard, depth + 1, true);
      newBoard[i] = null;
      bestScore = Math.min(score, bestScore);
    });
    return bestScore;
  }
}

// ================== HELPERS ===================
function getAvailableMoves(b) {
  const moves = [];
  b.forEach((v, i) => {
    if (v === null) moves.push(i);
  });
  return moves;
}

function getWinner(b) {
  for (const line of winPatterns) {
    const [a, b1, c] = line;
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
      return { winner: b[a], line };
    }
  }
  return null;
}

function isBoardFull(b) {
  return b.every((cell) => cell !== null);
}

function updateStatus(message) {
  statusEl.innerHTML = message;
}

function resetGame() {
  board = Array(9).fill(null);
  gameOver = false;
  currentPlayer = HUMAN;

  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("x", "o", "winning");
  });

  updateStatus("Nouvelle manche : à vous de jouer.");
}
