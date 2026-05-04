// -----------------------------
// Memory Moji — MwM_ edition
// -----------------------------

const symbols = ["🐻", "🦊", "🐼", "🐸", "🐙", "🐵", "🐯", "🐧"]; // 8 paires => 16 cartes

const board = document.getElementById("game-board");
const resetBtn = document.getElementById("reset-btn");
const movesEl = document.getElementById("moves");
const timeEl = document.getElementById("time");
const messageEl = document.getElementById("game-message");

let firstCard = null;
let secondCard = null;
let lockBoard = false;

let moves = 0;
let matchedPairs = 0;
let startTime = null;
let timerInterval = null;
const totalPairs = symbols.length;

// -----------------------------
// Utilitaires
// -----------------------------

function shuffle(array) {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

function updateStats() {
  movesEl.textContent = moves;
}

function resetStats() {
  moves = 0;
  matchedPairs = 0;
  startTime = null;

  clearInterval(timerInterval);
  timerInterval = null;

  timeEl.textContent = "0s";
  messageEl.textContent = "";
  updateStats();
}

function startTimer() {
  if (timerInterval) return;

  startTime = Date.now();
  timerInterval = setInterval(() => {
    const diff = Math.floor((Date.now() - startTime) / 1000);
    timeEl.textContent = `${diff}s`;
  }, 1000);
}

// -----------------------------
// Création du plateau
// -----------------------------

function createCard(symbol, index) {
  const button = document.createElement("button");
  button.className = "game-card";
  button.setAttribute("type", "button");
  button.dataset.symbol = symbol;
  button.style.setProperty("--card-index", index);

  const inner = document.createElement("div");
  inner.className = "card-inner";

  const back = document.createElement("div");
  back.className = "card-face card-back";
  back.textContent = "•";

  const front = document.createElement("div");
  front.className = "card-face card-front";
  front.textContent = symbol;

  inner.appendChild(back);
  inner.appendChild(front);
  button.appendChild(inner);

  button.addEventListener("click", () => handleCardClick(button));
  return button;
}

function buildBoard() {
  board.innerHTML = "";
  const double = [...symbols, ...symbols];
  const shuffled = shuffle(double);

  shuffled.forEach((symbol, index) => {
    board.appendChild(createCard(symbol, index));
  });
}

// -----------------------------
// Logique du jeu
// -----------------------------

function handleCardClick(card) {
  if (lockBoard) return;
  if (card === firstCard) return;
  if (card.classList.contains("is-matched")) return;

  if (!startTime) startTimer();

  card.classList.add("is-flipped");

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  moves++;
  updateStats();

  checkMatch();
}

function checkMatch() {
  const match = firstCard.dataset.symbol === secondCard.dataset.symbol;

  if (match) {
    handleMatch();
  } else {
    handleMismatch();
  }
}

function handleMatch() {
  firstCard.classList.add("is-matched");
  secondCard.classList.add("is-matched");

  matchedPairs++;

  firstCard = null;
  secondCard = null;

  if (matchedPairs === totalPairs) endGame();
}

function handleMismatch() {
  lockBoard = true;

  setTimeout(() => {
    firstCard.classList.remove("is-flipped");
    secondCard.classList.remove("is-flipped");
    firstCard = null;
    secondCard = null;
    lockBoard = false;
  }, 650);
}

function endGame() {
  clearInterval(timerInterval);

  const finalTime = timeEl.textContent;
  const finalMoves = moves;

  messageEl.textContent = `Bravo ! Terminé en ${finalMoves} coups et ${finalTime}`;
}

// -----------------------------
// Reset
// -----------------------------

function resetGame() {
  lockBoard = false;
  resetStats();
  firstCard = null;
  secondCard = null;
  buildBoard();
}

// -----------------------------
// Initialisation
// -----------------------------

document.addEventListener("DOMContentLoaded", resetGame);
resetBtn.addEventListener("click", resetGame);
