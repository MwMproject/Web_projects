class SnakeGame {
  constructor() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");

    this.gridSize = 20;
    this.tileCount = this.canvas.width / this.gridSize;

    this.running = false;
    this.isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;

    this.overlay = document.getElementById("start-overlay");
    this.startBtn = document.getElementById("start-btn");

    this.reset();
    this.bindStartButton();
    this.bindKeyboard();
    this.initJoystick();
  }

  /* ---------- Démarrage ---------- */
  bindStartButton() {
    this.startBtn.addEventListener("click", () => {
      this.startGame();
    });
  }

  startGame() {
    this.overlay.classList.add("hidden");
    if (!this.running) {
      this.running = true;
      this.gameLoop();
    }
  }

  /* ---------- Clavier (desktop) ---------- */
  bindKeyboard() {
    document.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();

      const up = ["arrowup", "w"];
      const down = ["arrowdown", "s"];
      const left = ["arrowleft", "a"];
      const right = ["arrowright", "d"];

      // Si on presse une touche directionnelle et que le jeu n'est pas lancé, on démarre
      if (!this.running && [...up, ...down, ...left, ...right].includes(key)) {
        this.startGame();
      }

      if (up.includes(key) && this.velocity.y !== 1) {
        this.velocity = { x: 0, y: -1 };
      }
      if (down.includes(key) && this.velocity.y !== -1) {
        this.velocity = { x: 0, y: 1 };
      }
      if (left.includes(key) && this.velocity.x !== 1) {
        this.velocity = { x: -1, y: 0 };
      }
      if (right.includes(key) && this.velocity.x !== -1) {
        this.velocity = { x: 1, y: 0 };
      }
    });
  }

  /* ---------- Joystick (mobile/tablette) ---------- */
  initJoystick() {
    const joystickContainer = document.getElementById("joystick");

    if (!this.isTouch) {
      // Pas d'écran tactile → pas de joystick
      joystickContainer.style.display = "none";
      return;
    }

    // Appareil tactile → on montre le joystick
    joystickContainer.style.display = "block";

    const joystick = nipplejs.create({
      zone: joystickContainer,
      mode: "static",
      position: { left: "50%", top: "50%" },
      color: "white",
      size: 130,
    });

    joystick.on("dir", (evt, data) => {
      const dir = data.direction.angle;

      if (dir === "up" && this.velocity.y !== 1) {
        this.velocity = { x: 0, y: -1 };
      }
      if (dir === "down" && this.velocity.y !== -1) {
        this.velocity = { x: 0, y: 1 };
      }
      if (dir === "left" && this.velocity.x !== 1) {
        this.velocity = { x: -1, y: 0 };
      }
      if (dir === "right" && this.velocity.x !== -1) {
        this.velocity = { x: 1, y: 0 };
      }

      // Si on bouge le joystick et que le jeu n'est pas en cours → on démarre
      if (!this.running) {
        this.startGame();
      }
    });
  }

  /* ---------- Moteur du jeu ---------- */

  reset() {
    this.snake = [{ x: 10, y: 10 }];
    this.velocity = { x: 0, y: 0 };
    this.food = this.randomFood();
    this.score = 0;
    this.level = 1;
    this.running = false;
    this.updateUI();
  }

  gameLoop() {
    if (!this.running) return;

    this.update();
    this.draw();

    const speed = Math.max(60, 200 - this.level * 10); // limite une vitesse minimum
    setTimeout(() => this.gameLoop(), speed);
  }

  update() {
    const head = {
      x: this.snake[0].x + this.velocity.x,
      y: this.snake[0].y + this.velocity.y,
    };

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      if (this.score % 5 === 0) this.levelUp();
      this.food = this.randomFood();
    } else {
      this.snake.pop();
    }

    // Collisions
    if (
      head.x < 0 ||
      head.x >= this.tileCount ||
      head.y < 0 ||
      head.y >= this.tileCount ||
      this.snake.slice(1).some((s) => s.x === head.x && s.y === head.y)
    ) {
      this.gameOver();
    }

    this.updateUI();
  }

  gameOver() {
    this.running = false;
    this.reset();
    this.overlay.classList.remove("hidden");
  }

  randomFood() {
    return {
      x: Math.floor(Math.random() * this.tileCount),
      y: Math.floor(Math.random() * this.tileCount),
    };
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Snake
    this.ctx.fillStyle = "lime";
    this.snake.forEach((s) => {
      this.ctx.fillRect(
        s.x * this.gridSize,
        s.y * this.gridSize,
        this.gridSize,
        this.gridSize
      );
    });

    // Food
    this.ctx.fillStyle = "red";
    this.ctx.fillRect(
      this.food.x * this.gridSize,
      this.food.y * this.gridSize,
      this.gridSize,
      this.gridSize
    );
  }

  updateUI() {
    document.getElementById("score").textContent = this.score;
    document.getElementById("level").textContent = this.level;
  }

  levelUp() {
    this.level++;
  }
}

new SnakeGame();
