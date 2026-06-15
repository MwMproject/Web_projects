import { Game } from "./game/Game.js";
import { UI } from "./ui/UI.js";
import { spawnLocations } from "./data/spawnLocations.js";

const canvas = document.querySelector("#gameCanvas");
const spawnOverlay = document.querySelector("#spawnOverlay");
const spawnList = document.querySelector("#spawnList");

spawnList.innerHTML = spawnLocations.map((location) => `
  <button class="spawn-card" type="button" data-spawn-id="${location.id}">
    <strong>${location.name}</strong>
    <span>${location.description}</span>
    <small>${location.difficulty} · ${location.bonuses.join(" · ")}</small>
  </button>
`).join("");

spawnList.querySelectorAll(".spawn-card").forEach((button) => {
  button.addEventListener("click", () => {
    const spawnLocation = spawnLocations.find((location) => location.id === button.dataset.spawnId);
    const game = new Game(canvas, spawnLocation);
    const ui = new UI(game);

    game.setUI(ui);
    game.start();
    spawnOverlay.classList.add("is-hidden");
  });
});
