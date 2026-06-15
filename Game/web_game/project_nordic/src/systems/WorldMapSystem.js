import { clans, expeditionModes, worldDestinations } from "../data/worldMap.js";

export class WorldMapSystem {
  constructor(spawnLocation = null) {
    this.destinations = worldDestinations;
    this.modes = expeditionModes;
    this.clans = clans.map((clan) => ({ ...clan }));
    this.selectedDestinationId = spawnLocation?.worldOrigin ?? "bergen";
    this.selectedMode = "explore";
  }

  selectDestination(id) {
    if (this.getDestination(id)) {
      this.selectedDestinationId = id;
    }
  }

  selectMode(mode) {
    if (this.modes[mode]) {
      this.selectedMode = mode;
    }
  }

  getSelectedPlan() {
    return {
      destination: this.getDestination(this.selectedDestinationId),
      mode: this.modes[this.selectedMode],
      modeId: this.selectedMode,
    };
  }

  getDestination(id) {
    return this.destinations.find((destination) => destination.id === id);
  }

  getClan(id) {
    return this.clans.find((clan) => clan.id === id);
  }

  getRelationLabel(value) {
    if (value >= 35) return "Allié";
    if (value >= 12) return "Amical";
    if (value > -12) return "Neutre";
    if (value > -35) return "Tendu";
    return "Hostile";
  }

  getRisk(destination, mode) {
    const clan = this.getClan(destination.clanId);
    const relationRisk = clan ? Math.max(-0.1, Math.min(0.16, -clan.relation / 220)) : 0;
    return Math.max(0.05, Math.min(0.82, destination.risk + mode.riskModifier + relationRisk));
  }

  getCost(destination, mode) {
    const travelFood = destination.distance * 3;
    return {
      ...mode.cost,
      food: (mode.cost.food || 0) + travelFood,
    };
  }

  getDuration(destination) {
    return 5 + destination.distance * 2;
  }

  changeRelation(clanId, amount) {
    const clan = this.getClan(clanId);
    if (!clan) return;
    clan.relation = Math.max(-100, Math.min(100, clan.relation + amount));
  }
}
