import { tileTypes } from "./tiles.js";

export class TileMap {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = this.generate();
  }

  generate() {
    const tiles = [];
    const center = this.getVillageCenter();

    for (let y = 0; y < this.height; y += 1) {
      const row = [];
      for (let x = 0; x < this.width; x += 1) {
        const distance = Math.hypot(x - center.x, y - center.y);
        let type = "grass";

        if (x < 5 || y > this.height - 6) type = "water";
        if ((x + y * 2) % 17 === 0 && distance > 5) type = "forest";
        if ((x * 3 + y) % 23 === 0 && distance > 6) type = "stone";
        if (distance < 6.3) type = "buildable";
        if (distance < 2.2) type = "grass";

        row.push({ type, variant: (x * 11 + y * 7) % 8 });
      }
      tiles.push(row);
    }

    return tiles;
  }

  getVillageCenter() {
    return {
      x: Math.floor(this.width * 0.54),
      y: Math.floor(this.height * 0.48),
    };
  }

  getTile(x, y) {
    if (!this.isInside(x, y)) return null;
    return this.tiles[y][x];
  }

  setTile(x, y, type) {
    if (!this.isInside(x, y) || !tileTypes[type]) return;
    this.tiles[y][x].type = type;
  }

  isInside(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  isWalkableWorld(x, y) {
    const tileX = Math.floor(x / 24);
    const tileY = Math.floor(y / 24);
    const tile = this.getTile(tileX, tileY);
    return Boolean(tile && tileTypes[tile.type].walkable);
  }
}
