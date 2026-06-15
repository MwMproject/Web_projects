import { roles } from "../data/roles.js";

export class VillagerJobSystem {
  constructor(game) {
    this.game = game;
    this.roles = roles;
  }

  update(delta) {
    this.game.villagers.forEach((villager) => {
      const role = this.roles[villager.role] || this.roles.idle;
      if (!role.produces) return;
      if (role.requiresBuilding && !this.game.hasBuilding(role.requiresBuilding)) return;

      villager.workTimer += delta;
      if (villager.workTimer < role.produces.interval) return;
      villager.workTimer = 0;

      const gains = this.getProductionForRole(villager.role, role.produces.resources);
      this.game.resources.add(gains);
      this.game.notify();
    });
  }

  assign(villagerId, roleId) {
    const villager = this.game.villagers.find((item) => item.id === villagerId);
    const role = this.roles[roleId];
    if (!villager || !role) return false;
    if (role.requiresBuilding && !this.game.hasBuilding(role.requiresBuilding)) {
      this.game.addEvent(`${role.label} nécessite d'abord une forge.`);
      return false;
    }

    villager.role = roleId;
    villager.workTimer = 0;
    villager.tunic = role.color;
    this.game.addEvent(`${villager.name} devient ${role.label.toLowerCase()}.`);
    this.game.notify();
    return true;
  }

  getProductionForRole(roleId, resources) {
    if (roleId !== "farmer") return resources;
    const farmCount = this.game.buildings.count("field");
    const bonus = Math.min(8, farmCount * 2);
    return {
      ...resources,
      food: (resources.food || 0) + bonus,
    };
  }

  count(roleId) {
    return this.game.villagers.filter((villager) => villager.role === roleId).length;
  }
}
