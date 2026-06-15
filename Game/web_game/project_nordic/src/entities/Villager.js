import { Entity } from "./Entity.js";

export class Villager extends Entity {
  constructor(x, y, name) {
    super(x, y);
    this.id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    this.name = name;
    this.role = "idle";
    this.workTimer = 0;
    this.speed = 16 + Math.random() * 8;
    this.target = { x, y };
    this.wait = Math.random() * 2;
    this.stepTime = 0;
    this.tunic = ["#8a4f3a", "#3f6f78", "#7d7246", "#8b7a9a"][Math.floor(Math.random() * 4)];
  }

  update(delta, map) {
    this.stepTime += delta;
    this.wait -= delta;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 1.5) {
      if (this.wait <= 0) this.pickTarget(map);
      return;
    }

    this.x += (dx / distance) * this.speed * delta;
    this.y += (dy / distance) * this.speed * delta;
  }

  pickTarget(map) {
    const center = map.getVillageCenter();
    const tileX = center.x + Math.floor(Math.random() * 11) - 5;
    const tileY = center.y + Math.floor(Math.random() * 9) - 4;
    const tile = map.getTile(tileX, tileY);

    if (tile && (tile.type === "buildable" || tile.type === "grass")) {
      this.target.x = tileX * 24 + 8;
      this.target.y = tileY * 24 + 6;
    }

    this.wait = 1 + Math.random() * 2.5;
  }

  draw(ctx) {
    const bob = Math.floor(Math.sin(this.stepTime * 8) * 1);
    const x = Math.floor(this.x);
    const y = Math.floor(this.y + bob);

    ctx.fillStyle = "#d9b08c";
    ctx.fillRect(x + 4, y, 5, 5);
    ctx.fillStyle = this.tunic;
    ctx.fillRect(x + 3, y + 5, 7, 8);
    ctx.fillStyle = "#d7d0b0";
    ctx.fillRect(x + 9, y + 4, 2, 2);
    ctx.fillStyle = "#2c2119";
    ctx.fillRect(x + 2, y + 13, 3, 3);
    ctx.fillRect(x + 8, y + 13, 3, 3);
  }
}
