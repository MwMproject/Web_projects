const counterDisplay = document.querySelector("h3");
let counter = 0;
// Tableau des images de Pokéballs
const pokeballImages = [
  "assets/img/pokeball.png",
  "assets/img/masterball.png",
  "assets/img/superball.png",
];

const pokeballMaker = () => {
  const pokeball = document.createElement("img"); // Création d'un élément img

  const randomIndex = Math.floor(Math.random() * pokeballImages.length); // Sélection aléatoire d'une image
  pokeball.src = pokeballImages[randomIndex]; // Attribution de la source de l'image

  pokeball.classList.add("pokeball"); // Ajout de la classe "pokeball"
  pokeball.draggable = false; // Désactivation du drag and drop
  document.body.appendChild(pokeball); // Ajout de l'élément au body

  const size = Math.random() * 200 + 100 + "px"; // Taille aléatoire des pokéballs entre 50px et 150px
  pokeball.style.width = size; // Application de la taille
  pokeball.style.height = size; // Application de la taille

  pokeball.style.left = Math.random() * 100 + "%"; // Position horizontale aléatoire
  pokeball.style.top = Math.random() * 100 + 50 + "%"; // Position verticale aléatoire

  const plusMinus = Math.random() < 0.5 ? -1 : 1; // Choix aléatoire entre -1 et 1 pour la direction de l'animation
  pokeball.style.setProperty("--left", Math.random() * 100 + plusMinus + "%"); // Définition de la variable CSS --left pour les animations

  pokeball.addEventListener("click", () => {
    counter++;
    counterDisplay.textContent = counter; // Mise à jour du compteur affiché
    pokeball.remove(); // Suppression de la pokéball au clic
  });

  setTimeout(() => {
    pokeball.remove(); // Suppression de l'élément après l'animation (gérée en CSS)
  }, 8000); // Durée de vie de la pokéball avant suppression
};
setInterval(pokeballMaker, 500); // Appel de la fonction pokeballMaker toutes les 500 millisecondes
