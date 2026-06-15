import { tileTypes } from "../world/tiles.js";

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.game = game;
    this.scale = 1;
    this.ctx.imageSmoothingEnabled = false;
  }

  setScale(scale) {
    this.scale = scale;
    this.ctx.imageSmoothingEnabled = false;
  }

  render() {
    const { ctx, canvas, game } = this;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-Math.floor(game.camera.x), -Math.floor(game.camera.y));

    this.drawTiles();
    this.drawBuildings();
    this.drawVillagers();
    this.drawPlacementPreview();

    ctx.restore();
  }

  drawTiles() {
    const { ctx, game } = this;
    const size = game.tileSize;
    const startX = Math.max(0, Math.floor(game.camera.x / size) - 1);
    const startY = Math.max(0, Math.floor(game.camera.y / size) - 1);
    const endX = Math.min(game.map.width, startX + Math.ceil(game.canvas.width / game.camera.zoom / size) + 3);
    const endY = Math.min(game.map.height, startY + Math.ceil(game.canvas.height / game.camera.zoom / size) + 3);

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const tile = game.map.getTile(x, y);
        const type = tileTypes[tile.type];
        const px = x * size;
        const py = y * size;
        ctx.fillStyle = type.color;
        ctx.fillRect(px, py, size, size);

        if (tile.variant % 3 === 0) {
          ctx.fillStyle = type.detail;
          ctx.fillRect(px + 5, py + 6, 3, 3);
          ctx.fillRect(px + 15, py + 14, 2, 2);
        }

        if (tile.type === "forest") this.drawTree(px, py);
        if (tile.type === "stone") this.drawRock(px, py);
        if (tile.type === "water") this.drawWater(px, py, tile.variant);
        if (tile.type === "buildable") this.drawBuildable(px, py);
      }
    }
  }

  drawTree(x, y) {
    const { ctx } = this;
    ctx.fillStyle = "#243c2f";
    ctx.fillRect(x + 8, y + 5, 9, 9);
    ctx.fillStyle = "#2f523e";
    ctx.fillRect(x + 6, y + 10, 13, 8);
    ctx.fillStyle = "#69482a";
    ctx.fillRect(x + 11, y + 16, 3, 5);
  }

  drawRock(x, y) {
    const { ctx } = this;
    ctx.fillStyle = "#56605d";
    ctx.fillRect(x + 6, y + 11, 12, 8);
    ctx.fillStyle = "#838d87";
    ctx.fillRect(x + 9, y + 8, 7, 4);
  }

  drawWater(x, y, variant) {
    const { ctx } = this;
    ctx.fillStyle = variant % 2 ? "#5c91a8" : "#4e8198";
    ctx.fillRect(x + 3, y + 9, 12, 2);
    ctx.fillRect(x + 9, y + 17, 10, 2);
  }

  drawBuildable(x, y) {
    const { ctx } = this;
    ctx.strokeStyle = "rgba(218, 197, 141, 0.18)";
    ctx.strokeRect(x + 2, y + 2, 20, 20);
  }

  drawBuildings() {
    this.game.buildings.items.forEach((building) => {
      this.drawBuilding(building.x * this.game.tileSize, building.y * this.game.tileSize, building);
    });
  }

  drawBuilding(x, y, building) {
    const { ctx } = this;
    const size = this.game.tileSize;

    if (building.id === "path") {
      this.drawPathTile(x, y, building);
      return;
    }

    if (building.id === "field") {
      ctx.fillStyle = "#6f7d35";
      ctx.fillRect(x + 2, y + 3, size - 4, size - 5);
      ctx.fillStyle = "#9b9a4a";
      for (let row = 0; row < 4; row += 1) {
        ctx.fillRect(x + 4, y + 5 + row * 4, size - 8, 2);
      }
      return;
    }

    if (building.id === "palisade") {
      ctx.fillStyle = "#4a2d1d";
      for (let px = 3; px < size - 2; px += 5) {
        ctx.fillRect(x + px, y + 4, 3, 18);
        ctx.fillStyle = "#7a4c2a";
        ctx.fillRect(x + px, y + 2, 3, 3);
        ctx.fillStyle = "#4a2d1d";
      }
      ctx.fillRect(x + 2, y + 12, size - 4, 3);
      return;
    }

    ctx.fillStyle = building.color.base;
    ctx.fillRect(x + 3, y + 8, size - 6, size - 8);
    ctx.fillStyle = building.color.roof;
    ctx.fillRect(x + 1, y + 5, size - 2, 5);
    ctx.fillStyle = "#14100d";
    ctx.fillRect(x + 10, y + 15, 5, 9);

    if (building.id === "port") {
      ctx.fillStyle = "#60421f";
      ctx.fillRect(x + 4, y + 21, 18, 3);
      ctx.fillStyle = "#d7d0b0";
      ctx.fillRect(x + 15, y + 2, 2, 11);
    }

    if (building.id === "temple") {
      ctx.fillStyle = "#d5a44a";
      ctx.fillRect(x + 11, y + 2, 3, 7);
    }
  }

  drawPathTile(x, y, building) {
    const { ctx } = this;
    const size = this.game.tileSize;
    const variant = (building.x * 11 + building.y * 7) % 8;

    ctx.fillStyle = "#65523c";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "#846d4d";
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);

    ctx.fillStyle = "#7a674d";
    if (variant % 2 === 0) {
      ctx.fillRect(x + 6, y + 7, 3, 3);
      ctx.fillRect(x + 16, y + 15, 2, 2);
    } else {
      ctx.fillRect(x + 5, y + 15, 2, 2);
      ctx.fillRect(x + 15, y + 7, 3, 3);
    }
  }

  drawVillagers() {
    this.game.villagers.forEach((villager) => villager.draw(this.ctx));
  }

  drawPlacementPreview() {
    const { game, ctx } = this;
    if (!game.selectedBuildingId) return;
    const world = game.camera.screenToWorld(
      game.input.pointer.canvasX,
      game.input.pointer.canvasY,
    );
    const tileX = Math.floor(world.x / game.tileSize);
    const tileY = Math.floor(world.y / game.tileSize);
    const canPlace = game.buildings.canPlace(game.selectedBuildingId, tileX, tileY).ok;
    ctx.fillStyle = canPlace ? "rgba(126, 166, 106, 0.55)" : "rgba(184, 92, 74, 0.55)";
    ctx.fillRect(tileX * game.tileSize, tileY * game.tileSize, game.tileSize, game.tileSize);
  }
}
