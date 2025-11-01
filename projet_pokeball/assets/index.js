// Sélection des éléments
const counterDisplay = document.querySelector("h3");
const lifeDisplay = document.querySelector("#life");
let counter = 0;
let lives = 5;
let gameLoop;

// --------------------- Tableau des Pokéballs ---------------------
const pokeballTypes = [
  // Pokéball : communes (70%)
  { name: "pokeball", src: "assets/img/pokeball.png", points: 1, size: 200 },
  { name: "pokeball", src: "assets/img/pokeball.png", points: 1, size: 200 },
  { name: "pokeball", src: "assets/img/pokeball.png", points: 1, size: 200 },
  { name: "pokeball", src: "assets/img/pokeball.png", points: 1, size: 200 },
  { name: "pokeball", src: "assets/img/pokeball.png", points: 1, size: 200 },
  { name: "pokeball", src: "assets/img/pokeball.png", points: 1, size: 200 },
  { name: "pokeball", src: "assets/img/pokeball.png", points: 1, size: 200 },

  // Masterball : 2 chances sur 10
  {
    name: "masterball",
    src: "assets/img/masterball.png",
    points: 3,
    size: 150,
  },
  {
    name: "masterball",
    src: "assets/img/masterball.png",
    points: 3,
    size: 150,
  },

  // Superball : 1 chance sur 10
  { name: "superball", src: "assets/img/superball.png", points: 5, size: 100 },
];

// --------------------- Création des Pokeballs ---------------------
const pokeballMaker = () => {
  const pokeballData =
    pokeballTypes[Math.floor(Math.random() * pokeballTypes.length)];

  // Création de la pokéball
  const pokeball = document.createElement("img");
  pokeball.src = pokeballData.src;
  pokeball.classList.add("pokeball");
  pokeball.draggable = false;

  const gameZone = document.querySelector(".gameZone");
  gameZone.appendChild(pokeball);

  // Taille
  const size = pokeballData.size;
  pokeball.style.width = size + "px";
  pokeball.style.height = size + "px";

  // Position de départ
  const zoneWidth = gameZone.clientWidth;
  const zoneHeight = gameZone.clientHeight;
  const margin = 20;

  let x = Math.random() * (zoneWidth - size - margin * 2) + margin;
  let y = zoneHeight - size - margin;

  // Vitesse initiale
  let speedX = (Math.random() - 0.5) * 3; // vitesse horizontale aléatoire
  let speedY = -1.5 - Math.random() * 1.5; // monte vers le haut

  // Applique la position
  pokeball.style.left = x + "px";
  pokeball.style.top = y + "px";

  // Animation du mouvement
  function move() {
    if (!gameZone.contains(pokeball)) return;

    x += speedX;
    y += speedY;

    // Rebonds sur les côtés
    if (x <= 0 || x + size >= zoneWidth) {
      speedX *= -1; // inverse la direction
    }

    // Touche le haut de la zone de jeu
    if (y <= 0) {
      pokeball.remove();
      lives--;
      updateLives();

      if (lives <= 0) endGame();
      return;
    }

    // Applique la position mise à jour
    pokeball.style.left = x + "px";
    pokeball.style.top = y + "px";

    requestAnimationFrame(move);
  }

  requestAnimationFrame(move);

  // Clic : gagne des points
  pokeball.addEventListener("click", () => {
    counter += pokeballData.points;
    counterDisplay.textContent = counter;
    pokeball.remove();
  });
};

// --------------------- Gestion de la barre de vie ---------------------
function updateLives() {
  lifeDisplay.textContent = "❤️".repeat(lives) + "🤍".repeat(5 - lives);
}

// --------------------- Fin du jeu ---------------------
function endGame() {
  clearInterval(gameLoop);
  saveScore();
  showEndMenu();
}

// --------------------- Menus et Scores ---------------------
// Récupération des éléments du DOM
const startMenu = document.getElementById("startMenu");
const endMenu = document.getElementById("endMenu");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const finalScore = document.getElementById("finalScore");
const scoreList = document.getElementById("scoreList");

// --- Démarrage du jeu ---
startBtn.addEventListener("click", () => {
  const name = document.getElementById("playerName").value.trim();
  const email = document.getElementById("playerEmail").value.trim();

  if (!name || !email) {
    alert("Merci de renseigner ton pseudo et ton email !");
    return;
  }

  localStorage.setItem("playerName", name);
  localStorage.setItem("playerEmail", email);

  startMenu.classList.add("hidden");
  startGame();
});

// --- Lancement de la partie ---
function startGame() {
  document.querySelectorAll(".pokeball").forEach((p) => p.remove());
  counter = 0;
  lives = 5;
  updateLives();
  counterDisplay.textContent = "0";
  endMenu.classList.add("hidden");
  gameLoop = setInterval(pokeballMaker, 800);
}

// --- Rejouer ---
restartBtn.addEventListener("click", () => {
  endMenu.classList.add("hidden");
  startGame();
});

// --- Sauvegarde du score ---
function saveScore() {
  const name = localStorage.getItem("playerName") || "Anonyme";
  const email = localStorage.getItem("playerEmail") || "noemail@none.com";

  const scores = JSON.parse(localStorage.getItem("scores") || "[]");
  scores.push({ name, email, score: counter, date: new Date().toISOString() });

  // Tri du plus grand au plus petit
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem("scores", JSON.stringify(scores));
}

// --- Affichage du classement ---
function showEndMenu() {
  endMenu.classList.remove("hidden");
  finalScore.textContent = `Ton score : ${counter}`;

  const scores = JSON.parse(localStorage.getItem("scores") || "[]");
  scoreList.innerHTML = "";
  scores.slice(0, 5).forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${s.name} - ${s.score} pts`;
    scoreList.appendChild(li);
  });
}

// --------------------- Initialisation ---------------------
updateLives();
