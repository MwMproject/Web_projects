import { Building } from "../entities/Building.js";
import { buildings } from "../data/buildings.js";
import { tileTypes } from "../world/tiles.js";

export class BuildingSystem {
  constructor(game) {
    this.game = game;
    this.definitions = buildings;
    this.items = [];
    this.occupied = new Set();
  }

  update(delta) {
    this.items.forEach((building) => {
      if (!building.produces) return;
      building.productionTimer += delta;
      if (building.productionTimer < building.produces.interval) return;
      building.productionTimer = 0;
      this.game.resources.add(building.produces.resources);
      this.game.notify();
    });
  }

  place(id, x, y) {
    const definition = this.getDefinition(id);
    const check = this.canPlace(id, x, y);
    if (!check.ok) return check;
    if (!this.game.resources.spend(definition.cost)) {
      return { ok: false, reason: "Ressources insuffisantes pour cette construction." };
    }

    const building = new Building(definition, x, y);
    this.items.push(building);
    this.occupied.add(this.key(x, y));
    return { ok: true, building };
  }

  canPlace(id, x, y) {
    const definition = this.getDefinition(id);
    if (!definition) return { ok: false, reason: "Bâtiment inconnu." };
    const tile = this.game.map.getTile(x, y);
    if (!tile) return { ok: false, reason: "Cette zone est hors de la carte." };
    if (!this.canBuildOnTile(definition, tile.type)) return { ok: false, reason: "Ce terrain n'est pas constructible." };
    if (this.occupied.has(this.key(x, y))) return { ok: false, reason: "Une construction occupe déjà cette case." };
    if (!this.isUnlocked(definition)) return { ok: false, reason: "Ce bâtiment n'est pas encore débloqué." };
    return { ok: true };
  }

  canBuildOnTile(definition, tileType) {
    if (!tileTypes[tileType]) return false;
    if (definition.placeOn) return definition.placeOn.includes(tileType);
    return tileType === "buildable" || tileType === "grass";
  }

  isUnlocked(definition) {
    if (!definition.requires) return true;
    return definition.requires.every((requiredId) => this.count(requiredId) > 0);
  }

  getDefinition(id) {
    return this.definitions.find((building) => building.id === id);
  }

  count(id) {
    return this.items.filter((building) => building.id === id).length;
  }

  key(x, y) {
    return `${x},${y}`;
  }
}
