// Sélection de l'élément h3 pour afficher le compteur
const counterDisplay = document.querySelector("h3");
let counter = 0;

// Tableau des Pokéballs avec leurs propriétés
const pokeballTypes = [
  // Pokéball : 70% des cas
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

// Fonction principale
const pokeballMaker = () => {
  // On choisit un type de Pokéball au hasard
  const pokeballData =
    pokeballTypes[Math.floor(Math.random() * pokeballTypes.length)];

  // Création de l’image
  const pokeball = document.createElement("img");
  pokeball.src = pokeballData.src;
  pokeball.classList.add("pokeball");
  pokeball.draggable = false; // Empêche le clic + glisser

  document.body.appendChild(pokeball);

  // Taille selon le type
  const size = pokeballData.size + "px";
  pokeball.style.width = size;
  pokeball.style.height = size;

  // Position aléatoire
  pokeball.style.left = Math.random() * 100 + "%";
  pokeball.style.top = Math.random() * 100 + 50 + "%";

  const plusMinus = Math.random() < 0.5 ? -1 : 1;
  pokeball.style.setProperty("--left", Math.random() * 100 + plusMinus + "%");

  // === Gestion du clic ===
  pokeball.addEventListener("click", () => {
    counter += pokeballData.points; // ajoute les points selon le type
    counterDisplay.textContent = counter;
    pokeball.remove();
  });

  // Suppression automatique après 8 secondes
  setTimeout(() => {
    pokeball.remove();
  }, 8000);
};

// Génération d'une Pokéball toutes les 500 ms
setInterval(pokeballMaker, 300);
