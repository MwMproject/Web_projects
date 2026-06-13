export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.dragDelta = { x: 0, y: 0 };
    this.zoomDirection = 0;
    this.pointer = {
      active: false,
      moved: false,
      lastX: 0,
      lastY: 0,
      canvasX: 0,
      canvasY: 0,
    };
    this.onMapClick = null;
    this.onZoom = null;

    this.bind();
  }

  bind() {
    window.addEventListener("keydown", (event) => {
      this.keys.add(event.key.toLowerCase());
      if (event.key === "+" || event.key === "=") this.zoomDirection = 1;
      if (event.key === "-" || event.key === "_") this.zoomDirection = -1;
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.key.toLowerCase());
    });

    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const amount = event.deltaY > 0 ? -0.12 : 0.12;
      this.onZoom?.(amount, {
        x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
        y: (event.clientY - rect.top) * (this.canvas.height / rect.height),
      });
    }, { passive: false });

    this.canvas.addEventListener("pointerdown", (event) => {
      this.updateCanvasPointer(event);
      this.canvas.setPointerCapture(event.pointerId);
      this.pointer.active = true;
      this.pointer.moved = false;
      this.pointer.lastX = event.clientX;
      this.pointer.lastY = event.clientY;
    });

    this.canvas.addEventListener("pointermove", (event) => {
      this.updateCanvasPointer(event);
      if (!this.pointer.active) return;
      const rect = this.canvas.getBoundingClientRect();
      const dx = (event.clientX - this.pointer.lastX) * (this.canvas.width / rect.width);
      const dy = (event.clientY - this.pointer.lastY) * (this.canvas.height / rect.height);
      this.dragDelta.x += dx;
      this.dragDelta.y += dy;
      this.pointer.lastX = event.clientX;
      this.pointer.lastY = event.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 3) this.pointer.moved = true;
    });

    this.canvas.addEventListener("pointerup", (event) => {
      this.updateCanvasPointer(event);
      if (!this.pointer.moved) this.onMapClick?.(this.pointer.canvasX, this.pointer.canvasY);
      this.pointer.active = false;
      this.canvas.releasePointerCapture(event.pointerId);
    });
  }

  updateCanvasPointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.canvasX = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    this.pointer.canvasY = (event.clientY - rect.top) * (this.canvas.height / rect.height);
  }

  getMovementVector() {
    const left = this.keys.has("a") || this.keys.has("arrowleft");
    const right = this.keys.has("d") || this.keys.has("arrowright");
    const up = this.keys.has("w") || this.keys.has("arrowup");
    const down = this.keys.has("s") || this.keys.has("arrowdown");
    const x = Number(right) - Number(left);
    const y = Number(down) - Number(up);
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  }

  clearDragDelta() {
    this.dragDelta.x = 0;
    this.dragDelta.y = 0;
  }
}
