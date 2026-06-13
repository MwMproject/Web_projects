import { Game } from "./game/Game.js";
import { UI } from "./ui/UI.js";

const canvas = document.querySelector("#gameCanvas");
const game = new Game(canvas);
const ui = new UI(game);

game.setUI(ui);
game.start();
