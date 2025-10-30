// Sélection des éléments
const counterDisplay = document.querySelector("h3");
const lifeDisplay = document.querySelector("#life");
let counter = 0;
let lives = 5;

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

// --------------------- Fonction principale ---------------------
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
  alert("Game Over 💀");
}

// --------------------- Lancement du jeu ---------------------
const gameLoop = setInterval(pokeballMaker, 800); // un peu plus espacé
updateLives();
