import { Renderer } from "./Renderer.js";
import { Input } from "./Input.js";
import { Camera } from "./Camera.js";
import { TileMap } from "../world/TileMap.js";
import { Villager } from "../entities/Villager.js";
import { ResourceSystem } from "../systems/ResourceSystem.js";
import { BuildingSystem } from "../systems/BuildingSystem.js";
import { ExpeditionSystem } from "../systems/ExpeditionSystem.js";
import { resources } from "../data/resources.js";
import { events } from "../data/events.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.tileSize = 24;
    this.map = new TileMap(44, 34);
    this.camera = new Camera(canvas, this.map, this.tileSize);
    this.renderer = new Renderer(canvas, this);
    this.input = new Input(canvas);
    this.resources = new ResourceSystem(resources);
    this.buildings = new BuildingSystem(this);
    this.expeditions = new ExpeditionSystem(this);
    this.villagers = this.createVillagers();
    this.villagerNames = [
      "Astrid", "Eirik", "Sigrid", "Leif", "Ragna", "Bjorn", "Ingrid", "Harald",
      "Solveig", "Ulf", "Freydis", "Torsten", "Yrsa", "Kari", "Hilda", "Sten",
    ];
    this.eventLog = [];
    this.selectedBuildingId = null;
    this.productionMultiplier = 1;
    this.njordBlessing = false;
    this.ui = null;
    this.lastTime = 0;
    this.eventTimer = 18;
    this.populationGrowthTimer = 0;
    this.isRunning = false;

    this.addEvent("Le clan arrive au bord du fjord. Une longue saison commence.");
    this.bindInput();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  setUI(ui) {
    this.ui = ui;
    this.notify();
  }

  start() {
    this.isRunning = true;
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(time) {
    if (!this.isRunning) return;
    const delta = Math.min((time - this.lastTime) / 1000 || 0, 0.1);
    this.lastTime = time;

    this.update(delta);
    this.renderer.render();
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  update(delta) {
    this.camera.update(delta, this.input);
    this.buildings.update(delta * this.productionMultiplier);
    this.expeditions.update(delta);
    this.villagers.forEach((villager) => villager.update(delta, this.map));
    this.updatePopulationGrowth(delta);
    this.tickMythEvents(delta);
  }

  resize() {
    const bounds = this.canvas.parentElement.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(320, Math.floor(bounds.width * scale));
    this.canvas.height = Math.max(260, Math.floor(bounds.height * scale));
    this.renderer.setScale(scale);
    this.camera.clamp();
  }

  bindInput() {
    this.input.onMapClick = (screenX, screenY) => {
      const world = this.camera.screenToWorld(screenX, screenY);
      const tileX = Math.floor(world.x / this.tileSize);
      const tileY = Math.floor(world.y / this.tileSize);
      this.tryPlaceSelectedBuilding(tileX, tileY);
    };

    this.input.onZoom = (amount, origin) => {
      this.camera.zoomAt(amount, origin.x, origin.y);
    };
  }

  createVillagers() {
    const center = this.map.getVillageCenter();
    return [
      new Villager(center.x * this.tileSize + 4, center.y * this.tileSize + 6, "Astrid"),
      new Villager((center.x + 2) * this.tileSize, (center.y + 1) * this.tileSize, "Eirik"),
      new Villager((center.x - 2) * this.tileSize, (center.y + 2) * this.tileSize, "Sigrid"),
      new Villager((center.x + 1) * this.tileSize, (center.y - 2) * this.tileSize, "Leif"),
    ];
  }

  selectBuilding(buildingId) {
    this.selectedBuildingId = buildingId;
    this.notify();
  }

  cancelBuildMode() {
    this.selectedBuildingId = null;
    this.notify();
  }

  tryPlaceSelectedBuilding(tileX, tileY) {
    if (!this.selectedBuildingId) return;
    const result = this.buildings.place(this.selectedBuildingId, tileX, tileY);
    if (result.ok) {
      this.addEvent(`${result.building.name} construit. Le village prend forme.`);
      if (result.building.id === "longhouse") {
        this.spawnVillager("Une nouvelle famille rejoint la maison longue.");
      }
      this.selectedBuildingId = null;
    } else {
      this.addEvent(result.reason);
    }
    this.notify();
  }

  addEvent(message) {
    this.eventLog.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      message,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    });
    this.eventLog = this.eventLog.slice(0, 8);
    this.notify();
  }

  tickMythEvents(delta) {
    this.eventTimer -= delta;
    if (this.eventTimer > 0) return;
    this.eventTimer = 22 + Math.random() * 18;
    const event = events[Math.floor(Math.random() * events.length)];
    event.apply(this);
    this.addEvent(event.text);
    this.notify();
  }

  getPopulationCap() {
    return 4 + this.buildings.count("longhouse") * 4;
  }

  updatePopulationGrowth(delta) {
    if (this.villagers.length >= this.getPopulationCap()) return;
    this.populationGrowthTimer += delta;
    if (this.populationGrowthTimer < 10) return;
    this.populationGrowthTimer = 0;

    if (this.resources.spend({ food: 5 })) {
      this.spawnVillager("Un nouveau villageois s'installe au village.");
    } else {
      this.addEvent("Le village manque de nourriture pour accueillir plus d'habitants.");
    }
  }

  spawnVillager(message) {
    if (this.villagers.length >= this.getPopulationCap()) return false;
    const center = this.map.getVillageCenter();
    const offsetX = Math.floor(Math.random() * 5) - 2;
    const offsetY = Math.floor(Math.random() * 5) - 2;
    const name = this.villagerNames[this.villagers.length % this.villagerNames.length];

    this.villagers.push(new Villager(
      (center.x + offsetX) * this.tileSize + 8,
      (center.y + offsetY) * this.tileSize + 6,
      name,
    ));
    this.addEvent(`${message} Population : ${this.villagers.length}/${this.getPopulationCap()}.`);
    this.notify();
    return true;
  }

  hasBuilding(id) {
    return this.buildings.count(id) > 0;
  }

  notify() {
    if (this.ui) this.ui.render();
  }
}
