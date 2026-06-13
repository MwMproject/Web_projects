export class Camera {
  constructor(canvas, map, tileSize) {
    this.canvas = canvas;
    this.map = map;
    this.tileSize = tileSize;
    this.x = 140;
    this.y = 80;
    this.zoom = 1.75;
    this.minZoom = 1.15;
    this.maxZoom = 2.45;
  }

  update(delta, input) {
    const speed = 320 / this.zoom;
    const movement = input.getMovementVector();
    this.x += movement.x * speed * delta;
    this.y += movement.y * speed * delta;

    if (input.dragDelta.x || input.dragDelta.y) {
      this.x -= input.dragDelta.x / this.zoom;
      this.y -= input.dragDelta.y / this.zoom;
      input.clearDragDelta();
    }

    if (input.zoomDirection) {
      this.zoomAt(input.zoomDirection * 0.08, this.canvas.width / 2, this.canvas.height / 2);
      input.zoomDirection = 0;
    }

    this.clamp();
  }

  zoomAt(amount, screenX, screenY) {
    const before = this.screenToWorld(screenX, screenY);
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + amount));
    const after = this.screenToWorld(screenX, screenY);
    this.x += before.x - after.x;
    this.y += before.y - after.y;
    this.clamp();
  }

  screenToWorld(screenX, screenY) {
    return {
      x: this.x + screenX / this.zoom,
      y: this.y + screenY / this.zoom,
    };
  }

  clamp() {
    const viewWidth = this.canvas.width / this.zoom;
    const viewHeight = this.canvas.height / this.zoom;
    const worldWidth = this.map.width * this.tileSize;
    const worldHeight = this.map.height * this.tileSize;
    this.x = Math.max(0, Math.min(this.x, Math.max(0, worldWidth - viewWidth)));
    this.y = Math.max(0, Math.min(this.y, Math.max(0, worldHeight - viewHeight)));
  }
}
