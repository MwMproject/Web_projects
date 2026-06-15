export class ResourceSystem {
  constructor(resourceDefinitions) {
    this.definitions = resourceDefinitions;
    this.amounts = Object.fromEntries(
      Object.entries(resourceDefinitions).map(([id, resource]) => [id, resource.start]),
    );
  }

  canAfford(cost = {}) {
    return Object.entries(cost).every(([resource, amount]) => this.get(resource) >= amount);
  }

  spend(cost = {}) {
    if (!this.canAfford(cost)) return false;
    Object.entries(cost).forEach(([resource, amount]) => {
      this.amounts[resource] -= amount;
    });
    return true;
  }

  add(gains = {}) {
    Object.entries(gains).forEach(([resource, amount]) => {
      this.amounts[resource] = Math.max(0, this.get(resource) + amount);
    });
  }

  setStartingAmounts(amounts = {}) {
    Object.keys(this.amounts).forEach((resource) => {
      this.amounts[resource] = amounts[resource] ?? this.definitions[resource].start;
    });
  }

  get(resource) {
    return this.amounts[resource] ?? 0;
  }
}
