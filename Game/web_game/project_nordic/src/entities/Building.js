export class Building {
  constructor(definition, x, y) {
    this.id = definition.id;
    this.name = definition.name;
    this.x = x;
    this.y = y;
    this.cost = definition.cost;
    this.produces = definition.produces;
    this.unlocks = definition.unlocks || [];
    this.color = definition.color;
    this.productionTimer = 0;
  }
}
