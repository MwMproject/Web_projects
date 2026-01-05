// =====================
// Sélection des éléments
// =====================
const counterDisplay = document.getElementById("scoreDisplay");
const lifeDisplay = document.getElementById("life");

const startMenu = document.getElementById("startMenu");
const endMenu = document.getElementById("endMenu");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const finalScore = document.getElementById("finalScore");
const scoreList = document.getElementById("scoreList");

const speedMessage = document.getElementById("speedMessage");

// =====================
// Variables de jeu
// =====================
let counter = 0;
let lives = 5;
let gameLoop = null;
let speedMultiplier = 1;
let lastSpeedIncrease = 0;

// Données joueur (envoyées à Google Sheets)
let playerData = {
  name: "",
  email: "",
  consent: false,
};

// Classement top 5 (session)
let scores = [];

// =====================
// Google Sheets Webhook
// =====================
const GOOGLE_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbxMmPVYNxyhh3SLpqfsg9pFcwuHEtQKUNHhu-QD-1yQZ4v1vkUT_rdYR2nBcaXs62SW/exec";

function sendToGoogleSheets(data) {
  fetch(GOOGLE_SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

// =====================
// Pokéballs
// =====================
const pokeballTypes = [
  { src: "assets/img/pokeball.png", points: 1, size: 200 },
  { src: "assets/img/pokeball.png", points: 1, size: 200 },
  { src: "assets/img/pokeball.png", points: 1, size: 200 },
  { src: "assets/img/pokeball.png", points: 1, size: 200 },
  { src: "assets/img/masterball.png", points: 3, size: 150 },
  { src: "assets/img/masterball.png", points: 3, size: 150 },
  { src: "assets/img/superball.png", points: 5, size: 100 },
];

// =====================
// Création des Pokéballs
// =====================
function pokeballMaker() {
  const data = pokeballTypes[Math.floor(Math.random() * pokeballTypes.length)];
  const gameZone = document.querySelector(".gameZone");

  const ball = document.createElement("img");
  ball.src = data.src;
  ball.className = "pokeball";
  ball.draggable = false;

  const size = data.size;
  ball.style.width = size + "px";
  ball.style.height = size + "px";

  const margin = 20;
  let x = Math.random() * (gameZone.clientWidth - size - margin * 2) + margin;
  let y = gameZone.clientHeight - size - margin;

  let speedX = (Math.random() - 0.5) * 3 * speedMultiplier;
  let speedY = (-1.5 - Math.random() * 1.5) * speedMultiplier;

  ball.style.left = x + "px";
  ball.style.top = y + "px";

  gameZone.appendChild(ball);

  function move() {
    if (!gameZone.contains(ball)) return;

    x += speedX;
    y += speedY;

    if (x <= 0 || x + size >= gameZone.clientWidth) {
      speedX *= -1;
    }

    if (y <= 0) {
      ball.remove();
      lives--;
      updateLives();
      if (lives <= 0) endGame();
      return;
    }

    ball.style.left = x + "px";
    ball.style.top = y + "px";

    requestAnimationFrame(move);
  }

  requestAnimationFrame(move);

  ball.addEventListener("click", () => {
    counter += data.points;
    counterDisplay.textContent = counter;
    ball.remove();
    checkSpeedIncrease();
  });
}

// =====================
// Vitesse & effets
// =====================
function checkSpeedIncrease() {
  if (counter >= lastSpeedIncrease + 50) {
    lastSpeedIncrease += 50;
    speedMultiplier += 0.2;
    flashEffect();
  }
}

function flashEffect() {
  const zone = document.querySelector(".gameZone");
  zone.classList.add("flash");
  speedMessage.classList.add("show");

  setTimeout(() => zone.classList.remove("flash"), 400);
  setTimeout(() => speedMessage.classList.remove("show"), 1200);
}

// =====================
// Vies
// =====================
function updateLives() {
  lifeDisplay.textContent = "❤️".repeat(lives) + "🤍".repeat(5 - lives);
}

// =====================
// Démarrage / Fin
// =====================
startBtn.addEventListener("click", () => {
  const name = document.getElementById("playerName").value.trim();
  const email = document.getElementById("playerEmail").value.trim();
  const consent = document.getElementById("consent").checked;

  if (!name || !email || !consent) {
    alert(
      "Merci de renseigner ton pseudo, ton email et d’accepter les conditions."
    );
    return;
  }

  playerData = { name, email, consent };

  startMenu.classList.add("hidden");
  startGame();
});

function startGame() {
  document.querySelectorAll(".pokeball").forEach((b) => b.remove());

  counter = 0;
  lives = 5;
  speedMultiplier = 1;
  lastSpeedIncrease = 0;

  counterDisplay.textContent = "0";
  updateLives();
  endMenu.classList.add("hidden");

  gameLoop = setInterval(pokeballMaker, 800);
}

function endGame() {
  clearInterval(gameLoop);

  // Envoi Google Sheets
  sendToGoogleSheets({
    name: playerData.name,
    email: playerData.email,
    score: counter,
    consent: playerData.consent,
  });

  // Classement local (top 5)
  scores.push({ name: playerData.name, score: counter });
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 5);

  showEndMenu();
}

// =====================
// Fin de partie UI
// =====================
function showEndMenu() {
  finalScore.textContent = `Ton score : ${counter}`;
  scoreList.innerHTML = "";

  scores.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${s.name} - ${s.score} pts`;
    scoreList.appendChild(li);
  });

  endMenu.classList.remove("hidden");
}

restartBtn.addEventListener("click", startGame);

// =====================
// Init
// =====================
updateLives();
