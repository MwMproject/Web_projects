import { tileTypes } from "./tiles.js";

export class TileMap {
  constructor(width, height, spawnLocation = null) {
    this.width = width;
    this.height = height;
    this.spawnLocation = spawnLocation;
    this.villageCenter = spawnLocation?.spawn ?? {
      x: Math.floor(this.width * 0.54),
      y: Math.floor(this.height * 0.48),
    };
    this.tiles = this.generate();
  }

  generate() {
    const tiles = [];
    const center = this.getVillageCenter();
    const biome = this.spawnLocation?.biome ?? "fjord";

    for (let y = 0; y < this.height; y += 1) {
      const row = [];
      for (let x = 0; x < this.width; x += 1) {
        const distance = Math.hypot(x - center.x, y - center.y);
        const noise = this.noise(x, y);
        let type = this.getBaseTile(x, y, biome, noise);

        if (distance < 8) type = "grass";

        row.push({ type, variant: (x * 11 + y * 7) % 8 });
      }
      tiles.push(row);
    }

    return tiles;
  }

  getVillageCenter() {
    return this.villageCenter;
  }

  getBaseTile(x, y, biome, noise) {
    const coastWest = x < 9 + Math.sin(y * 0.18) * 4;
    const coastSouth = y > this.height - 10 + Math.sin(x * 0.15) * 4;
    const river = Math.abs(x - (this.width * 0.5 + Math.sin(y * 0.11) * 9)) < 1.4;

    if (biome === "island") {
      const centerDistance = Math.hypot(x - this.width / 2, y - this.height / 2);
      if (centerDistance > this.width * 0.38 + Math.sin(y * 0.18) * 4) return "water";
    }

    if (biome === "fjord" && (coastWest || river || y < 5)) return "water";
    if (biome === "coast" && (coastSouth || river)) return "water";
    if (biome !== "forest" && x < 3) return "water";

    const forestChance = biome === "forest" ? 0.46 : biome === "mountain" ? 0.18 : 0.28;
    const stoneChance = biome === "mountain" ? 0.33 : 0.11;

    if (noise > 1 - stoneChance) return "stone";
    if (noise < forestChance) return "forest";
    return "grass";
  }

  noise(x, y) {
    const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return value - Math.floor(value);
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
