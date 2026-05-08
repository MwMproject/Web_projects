// ═══════════════════════════════════════════════════
//  WaveBorn — engine.js
// ═══════════════════════════════════════════════════
"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const MAP_W = 2400,
  MAP_H = 1800;

let G = null;
let animId = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ═══ GAME INIT ═══
function startGame(cls) {
  stopGame();
  const def = CLASS_DEF[cls];
  G = {
    cls,
    def,
    player: {
      x: MAP_W / 2,
      y: MAP_H / 2,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      dx: 0,
      dy: 0,
      lastAttack: 0,
      rageActive: false,
      rageTimer: 0,
      dashDx: 0,
      dashDy: 0,
      dashTimer: 0,
      invincible: 0,
      shieldActive: false,
      shieldTimer: 0,
      shieldHP: 0,
      buffSpeed: false,
      buffSpeedTimer: 0,
      buffDamage: false,
      buffDamageTimer: 0,
      buffMagnet: false,
      buffMagnetTimer: 0,
    },
    enemies: [],
    projectiles: [],
    particles: [],
    traps: [],
    loots: [],
    lootTexts: [],
    bonusCredits: 0,
    dmgNumbers: [],
    shake: null,
    kills: 0,
    score: 0,
    wave: 1,
    waveSpawnLeft: 0,
    waveSpawnTimer: 0,
    betweenWaves: false,
    betweenTimer: 0,
    bossWave: false,
    gameOver: false,
    paused: false,
    mouse: { x: canvas.width / 2, y: canvas.height / 2 },
    keys: {},
    skills: def.skills.map((s) => ({ ...s, lastUsed: 0 })),
    spinActive: false,
    spinTimer: 0,
    stormActive: false,
    stormTimer: 0,
    stormTick: 0,
    camX: 0,
    camY: 0,
    lastTime: 0,
  };

  // Setup game HUD
  document.getElementById("g-class").textContent = def.label;
  document.getElementById("g-class").className = "ghud-class " + cls;
  G.skills.forEach((sk, i) => {
    document.getElementById("sk" + i + "-i").textContent = sk.icon;
  });
  document.getElementById("game-hud").classList.add("visible");
  document.getElementById("skills-bar").classList.add("visible");
  document.getElementById("hud").style.display = "none";
  document.getElementById("bottom-nav").classList.remove("visible");

  showRaw("s-game");
  spawnWave(1);
  G.lastTime = performance.now();
  animId = requestAnimationFrame(loop);
}

function stopGame() {
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }
  document.getElementById("game-hud").classList.remove("visible");
  document.getElementById("skills-bar").classList.remove("visible");
  G = null;
}

// ═══ WAVE SYSTEM ═══
function spawnWave(n) {
  G.wave = n;
  G.betweenWaves = false;
  G.bossWave = n % 5 === 0;
  document.getElementById("g-wave").textContent = n;

  if (G.bossWave) {
    // Boss wave: fewer normal enemies + 1 boss
    G.waveSpawnLeft = 3 + Math.floor(n / 5);
    announceWave("⚠ VAGUE " + n + " — BOSS !");
    // Spawn boss after short delay
    setTimeout(() => {
      if (G && G.wave === n && !G.gameOver) spawnBoss(n);
    }, 1500);
  } else {
    const count = 5 + n * 4;
    G.waveSpawnLeft = count;
    announceWave(n === 1 ? "⚠ VAGUE 1 — BONNE CHANCE" : "⚠ VAGUE " + n);
  }
}

function announceWave(msg) {
  const el = document.getElementById("wave-announce");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2500);
}

// ═══ MAIN LOOP ═══
function loop(ts) {
  const dt = Math.min(ts - G.lastTime, 50);
  G.lastTime = ts;
  if (!G.paused && !G.gameOver) update(dt);
  render();
  animId = requestAnimationFrame(loop);
}

// ═══ UPDATE ═══
function update(dt) {
  const p = G.player,
    k = G.keys,
    def = G.def;

  // Movement
  let spd = p.speed * (p.rageActive ? 1.35 : 1) * (p.buffSpeed ? 1.5 : 1);
  p.dx = 0;
  p.dy = 0;
  if (k["ArrowLeft"] || k["a"] || k["A"]) p.dx -= spd;
  if (k["ArrowRight"] || k["d"] || k["D"]) p.dx += spd;
  if (k["ArrowUp"] || k["w"] || k["W"]) p.dy -= spd;
  if (k["ArrowDown"] || k["s"] || k["S"]) p.dy += spd;
  if (p.dx && p.dy) {
    p.dx *= 0.707;
    p.dy *= 0.707;
  }
  if (p.dashTimer > 0) {
    p.dashTimer -= dt;
    p.dx = p.dashDx * 8;
    p.dy = p.dashDy * 8;
  }
  p.x = Math.max(15, Math.min(MAP_W - 15, p.x + p.dx));
  p.y = Math.max(15, Math.min(MAP_H - 15, p.y + p.dy));
  G.camX = p.x - canvas.width / 2;
  G.camY = p.y - canvas.height / 2;

  // Timers
  if (p.rageActive) {
    p.rageTimer -= dt;
    if (p.rageTimer <= 0) p.rageActive = false;
  }
  if (p.invincible > 0) p.invincible -= dt;

  // ── WARRIOR PASSIVE: regen ──
  if (def.regen && def.regen > 0) {
    p.hp = Math.min(p.maxHp, p.hp + def.regen * dt * 0.06);
  }

  // ── MAGE SHIELD timer ──
  if (p.shieldActive) {
    p.shieldTimer -= dt;
    if (p.shieldTimer <= 0 || p.shieldHP <= 0) {
      p.shieldActive = false;
    }
  }

  // ── SPIN AoE (warrior) — with knockback + lifesteal ──
  if (G.spinActive) {
    G.spinTimer -= dt;
    if (G.spinTimer <= 0) G.spinActive = false;
    let spinHits = 0;
    G.enemies.forEach((e) => {
      if (vdist(p, e) < 95) {
        const dmg = p.rageActive ? 1.8 : 1.0;
        e.hp -= dmg;
        e.flashTimer = 100;
        // Knockback
        const kb = Math.atan2(e.y - p.y, e.x - p.x);
        e.x += Math.cos(kb) * 2;
        e.y += Math.sin(kb) * 2;
        spinHits++;
        if (e.hp <= 0) killEnemy(e);
      }
    });
    // Heal 1 HP per hit per tick
    if (spinHits > 0) p.hp = Math.min(p.maxHp, p.hp + spinHits * 0.3);
  }

  // ── STORM (mage) ──
  if (G.stormActive) {
    G.stormTimer -= dt;
    G.stormTick -= dt;
    if (G.stormTimer <= 0) G.stormActive = false;
    if (G.stormTick <= 0) {
      G.stormTick = 120;
      const alive = G.enemies.filter((e) => e.hp > 0);
      if (alive.length) {
        const t = alive[Math.floor(Math.random() * alive.length)];
        t.hp -= 48;
        t.flashTimer = 200;
        spawnFX(t.x, t.y, "#ffd700", 10);
        spawnDmgNumber(t.x, t.y, 48, "#ffd700", true);
        screenShake(3, 100);
        if (t.hp <= 0) killEnemy(t);
      }
    }
  }

  // Auto attack
  const now = performance.now();
  if (now - p.lastAttack > def.attackRate * (p.rageActive ? 0.5 : 1)) {
    p.lastAttack = now;
    autoAttack();
  }

  // Enemy spawning
  if (G.waveSpawnLeft > 0) {
    G.waveSpawnTimer -= dt;
    if (G.waveSpawnTimer <= 0) {
      spawnEnemy();
      G.waveSpawnTimer = Math.max(180, 1200 - G.wave * 60);
    }
  }

  // Enemies
  G.enemies.filter((e) => e.hp > 0).forEach((e) => updateEnemy(e, dt, now));
  G.enemies = G.enemies.filter((e) => e.hp > 0);
  document.getElementById("g-enemies").textContent = G.enemies.length;

  // Projectiles
  G.projectiles.forEach((pr) => {
    pr.x += pr.dx * pr.spd;
    pr.y += pr.dy * pr.spd;
    pr.life -= dt;
    if (pr.x < 0 || pr.x > MAP_W || pr.y < 0 || pr.y > MAP_H) pr.life = 0;
  });
  G.projectiles = G.projectiles.filter((pr) => {
    if (pr.life <= 0) return false;
    if (pr.friendly) {
      for (const e of G.enemies) {
        const hitSize = e.isBoss ? e.bossSize || 28 : ETYPES[e.type].size;
        if (vdist(pr, e) < hitSize + pr.r) {
          e.hp -= pr.dmg;
          e.flashTimer = 120;
          spawnFX(e.x, e.y, pr.color, 4);
          spawnDmgNumber(e.x, e.y, pr.dmg | 0, "#fff", pr.dmg > 30);
          if (e.hp <= 0) killEnemy(e);
          if (!pr.pierce) return false;
          break;
        }
      }
    } else {
      if (p.invincible <= 0 && vdist(pr, p) < 20 + pr.r) {
        takeDamage(pr.dmg);
        return false;
      }
    }
    return true;
  });

  // Traps
  G.traps.forEach((t) => {
    t.life -= dt;
    if (!t.triggered) {
      G.enemies.forEach((e) => {
        if (vdist(t, e) < 32) {
          t.triggered = true;
          t.life = 500;
          spawnFX(t.x, t.y, "#00d4aa", 16);
          G.enemies.forEach((en) => {
            if (vdist(t, en) < 85) {
              en.hp -= 65;
              en.stunTimer = 2000;
              en.flashTimer = 300;
              if (en.hp <= 0) killEnemy(en);
            }
          });
        }
      });
    }
  });
  G.traps = G.traps.filter((t) => t.life > 0);

  // Particles
  G.particles.forEach((p) => {
    p.x += p.dx;
    p.y += p.dy;
    p.life -= dt;
    p.dy += 0.05;
  });
  G.particles = G.particles.filter((p) => p.life > 0);

  // Loots
  updateLoots(dt);
  updateBuffs(dt);
  updateLootTexts(dt);

  // Damage numbers + screen shake
  updateDmgNumbers(dt);
  updateScreenShake(dt);

  // Wave complete?
  if (!G.betweenWaves && G.waveSpawnLeft === 0 && G.enemies.length === 0) {
    G.betweenWaves = true;
    G.betweenTimer = G.bossWave ? 5000 : 3500;
    announceWave("✓ VAGUE " + G.wave + " TERMINÉE !");
  }
  if (G.betweenWaves) {
    G.betweenTimer -= dt;
    if (G.betweenTimer <= 0) spawnWave(G.wave + 1);
  }

  updateGameHUD();
  updateSkillsBar();
}

// ═══ END GAME ═══
function endGame() {
  G.gameOver = true;
  const bonusCreds = G.bonusCredits || 0;
  const coins = Math.floor(G.score / 10) + G.wave * 5 + bonusCreds;
  if (CU) {
    const u = DB.get(CU.email);
    DB.update(CU.email, {
      games: (u.games || 0) + 1,
      kills: (u.kills || 0) + G.kills,
      waves: Math.max(u.waves || 0, G.wave),
      best: Math.max(u.best || 0, G.score),
      coins: (u.coins || 0) + coins,
      xp: (u.xp || 0) + G.score,
      level: calcLevel((u.xp || 0) + G.score),
    });
    CU = DB.get(CU.email);
  }
  document.getElementById("ov-waves").textContent = G.wave;
  document.getElementById("ov-kills").textContent = G.kills;
  document.getElementById("ov-score").textContent = G.score;
  document.getElementById("ov-coins").textContent = "+" + coins + " ◆";
  document.getElementById("over-title").className = "over-title dead";
  document.getElementById("over-title").textContent = "☠ GAME OVER";
  setTimeout(() => {
    document.getElementById("game-hud").classList.remove("visible");
    document.getElementById("skills-bar").classList.remove("visible");
    showRaw("s-over");
  }, 700);
}

// ═══ GAME HUD ═══
function updateGameHUD() {
  const p = G.player;
  if (!p) return;
  const pct = (p.hp / p.maxHp) * 100;
  const fill = document.getElementById("hp-fill");
  fill.style.width = pct + "%";
  fill.className = "hp-fill" + (pct < 30 ? " low" : "");
  document.getElementById("hp-txt").textContent =
    Math.max(0, p.hp | 0) + "/" + p.maxHp;
  document.getElementById("g-score").textContent = G.score;
}

function updateSkillsBar() {
  const now = performance.now();
  G.skills.forEach((sk, i) => {
    const rem = Math.max(0, sk.cd - (now - sk.lastUsed));
    document.getElementById("sk" + i + "-cd").style.height =
      (rem / sk.cd) * 100 + "%";
    const txt = document.getElementById("sk" + i + "-t");
    if (rem > 0) {
      txt.textContent = (rem / 1000).toFixed(1) + "s";
      document.getElementById("sk" + i).classList.add("oncd");
      document.getElementById("sk" + i).classList.remove("ready");
    } else {
      txt.textContent = "";
      document.getElementById("sk" + i).classList.remove("oncd");
      document.getElementById("sk" + i).classList.add("ready");
    }
  });
}

// ═══ RENDER ═══
function render() {
  const cw = canvas.width,
    ch = canvas.height;
  ctx.clearRect(0, 0, cw, ch);
  // Screen shake offset
  const shake = getShakeOffset();
  ctx.save();
  ctx.translate((-G.camX + shake.x) | 0, (-G.camY + shake.y) | 0);
  drawMap();
  drawTraps();
  drawLoots();
  drawProjs();
  drawEnemies();
  drawPlayer();
  drawDmgNumbers();
  drawLootTexts();
  drawFX();
  ctx.restore();
  // Buff bar (screen space, after ctx.restore)
  drawBuffBar();
  // Rage vignette
  if (G.player?.rageActive) {
    const gr = ctx.createRadialGradient(
      cw / 2,
      ch / 2,
      ch * 0.3,
      cw / 2,
      ch / 2,
      ch * 0.7,
    );
    gr.addColorStop(0, "transparent");
    gr.addColorStop(1, "rgba(255,50,0,.16)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, cw, ch);
  }
}

function drawMap() {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, MAP_W, MAP_H);
  ctx.strokeStyle = "rgba(0,212,170,.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x < MAP_W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, MAP_H);
    ctx.stroke();
  }
  for (let y = 0; y < MAP_H; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(MAP_W, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#1a1a2e";
  ctx.strokeStyle = "#252540";
  ctx.lineWidth = 1;
  [
    [200, 180, 60, 28],
    [450, 620, 42, 18],
    [820, 300, 80, 24],
    [1200, 800, 52, 32],
    [650, 1200, 72, 19],
    [1620, 400, 46, 26],
    [1020, 1400, 88, 21],
    [320, 1000, 56, 17],
    [2020, 600, 66, 28],
    [1830, 1220, 78, 24],
  ].forEach(([x, y, w, h]) => {
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#151525";
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    ctx.fillStyle = "#1a1a2e";
  });
  ctx.strokeStyle = "rgba(255,107,53,.25)";
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, MAP_W - 6, MAP_H - 6);
  ctx.fillStyle = "#ff6b35";
  [
    [0, 0],
    [MAP_W - 10, 0],
    [0, MAP_H - 10],
    [MAP_W - 10, MAP_H - 10],
  ].forEach(([x, y]) => ctx.fillRect(x, y, 10, 10));
}

function drawPlayer() {
  const p = G.player;
  if (!p) return;
  const def = G.def,
    col = def.color;
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 14, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Invincible blink
  if (p.invincible > 0 && Math.floor(p.invincible / 80) % 2 === 0) return;

  // ── MAGE SHIELD visual ──
  if (p.shieldActive) {
    ctx.strokeStyle = "#6c3fff";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.006) * 0.2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
    ctx.stroke();
    // Shield HP indicator
    ctx.fillStyle = "#6c3fff";
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Rage aura
  if (p.rageActive) {
    ctx.strokeStyle = "#ff3300";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.35 + Math.sin(Date.now() * 0.01) * 0.28;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Spin
  if (G.spinActive) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      const a = Date.now() * 0.005 + (i * Math.PI) / 3;
      ctx.fillStyle = col;
      ctx.fillRect(
        p.x + Math.cos(a) * 88 - 3,
        p.y + Math.sin(a) * 88 - 3,
        6,
        6,
      );
    }
  }
  // Storm aura
  if (G.stormActive) {
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.008) * 0.2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── WARRIOR ARMOR glow ──
  if (G.cls === "warrior" && !p.rageActive) {
    ctx.strokeStyle = "#ff6b3533";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Character pixels
  const s = 3,
    px = getCharPixels(G.cls),
    col2 = getCharColors(G.cls);
  const ox = p.x - (px[0].length * s) / 2,
    oy = p.y - (px.length * s) / 2;
  px.forEach((row, ry) =>
    row.forEach((c, cx2) => {
      if (c === 0 || col2[c] === "t") return;
      ctx.fillStyle = col2[c];
      ctx.fillRect(ox + cx2 * s, oy + ry * s, s, s);
    }),
  );
  // Aim line
  const a = Math.atan2(G.mouse.y + G.camY - p.y, G.mouse.x + G.camX - p.x);
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(a) * 15, p.y + Math.sin(a) * 15);
  ctx.lineTo(p.x + Math.cos(a) * 28, p.y + Math.sin(a) * 28);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawEnemies() {
  G.enemies.forEach((e) => {
    // ── BOSS RENDERING ──
    if (e.isBoss) {
      drawBoss(e);
      return;
    }
    const t = ETYPES[e.type],
      flash = e.flashTimer > 0,
      col = flash ? "#fff" : t.color;
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.beginPath();
    ctx.ellipse(
      e.x,
      e.y + t.size * 0.7,
      t.size * 0.8,
      t.size * 0.3,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    if (e.stunTimer > 0) {
      ctx.fillStyle = "#ffd700";
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(e.x, e.y, t.size + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = col;
    ctx.fillRect(e.x - t.size, e.y - t.size, t.size * 2, t.size * 2);
    ctx.fillStyle = "#fff";
    ctx.fillRect(e.x - t.size * 0.5 - 2, e.y - t.size * 0.3, 4, 4);
    ctx.fillRect(e.x + t.size * 0.2 - 1, e.y - t.size * 0.3, 4, 4);
    ctx.fillStyle = "#111";
    ctx.fillRect(e.x - t.size * 0.5 - 1, e.y - t.size * 0.3 + 1, 2, 2);
    ctx.fillRect(e.x + t.size * 0.2, e.y - t.size * 0.3 + 1, 2, 2);
    const pct = e.hp / e.maxHp,
      bw = t.size * 2.6,
      bh = 4,
      bx = e.x - bw / 2,
      by = e.y - t.size - 11;
    ctx.fillStyle = "#111";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = pct > 0.5 ? "#2ecc71" : pct > 0.25 ? "#f39c12" : "#e74c3c";
    ctx.fillRect(bx, by, bw * pct, bh);
    if (t.size >= 16) {
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(t.name, e.x, e.y - t.size - 15);
    }
  });
}

function drawBoss(e) {
  const s = e.bossSize,
    col = e.flashTimer > 0 ? "#fff" : e.bossColor;
  // Big shadow
  ctx.fillStyle = "rgba(0,0,0,.4)";
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + s * 0.8, s * 1.1, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Danger aura (pulsing)
  ctx.strokeStyle = e.bossColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.25 + Math.sin(Date.now() * 0.005) * 0.15;
  ctx.beginPath();
  ctx.arc(e.x, e.y, s + 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Charge indicator
  if (e.charging) {
    ctx.fillStyle = "#ff174488";
    ctx.beginPath();
    ctx.arc(e.x, e.y, s + 20, 0, Math.PI * 2);
    ctx.fill();
  }
  // Body — bigger, more detailed pixel square
  ctx.fillStyle = col;
  ctx.fillRect(e.x - s, e.y - s, s * 2, s * 2);
  // Inner pattern
  ctx.fillStyle = e.bossColor + "44";
  ctx.fillRect(e.x - s + 4, e.y - s + 4, s * 2 - 8, s * 2 - 8);
  // Eyes — larger, menacing
  ctx.fillStyle = "#fff";
  ctx.fillRect(e.x - s * 0.4 - 3, e.y - s * 0.2, 8, 6);
  ctx.fillRect(e.x + s * 0.2 - 2, e.y - s * 0.2, 8, 6);
  ctx.fillStyle = "#ff0000";
  ctx.fillRect(e.x - s * 0.4, e.y - s * 0.2 + 2, 4, 3);
  ctx.fillRect(e.x + s * 0.2, e.y - s * 0.2 + 2, 4, 3);
  // HP bar — wide, above boss
  const pct = e.hp / e.maxHp;
  const bw = s * 3,
    bh = 6,
    bx = e.x - bw / 2,
    by = e.y - s - 20;
  ctx.fillStyle = "#111";
  ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  ctx.fillStyle = pct > 0.5 ? "#e74c3c" : pct > 0.25 ? "#ff5722" : "#ff1744";
  ctx.fillRect(bx, by, bw * pct, bh);
  // Name label
  ctx.fillStyle = e.bossColor;
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.fillText(e.bossName, e.x, by - 6);
}

function drawProjs() {
  G.projectiles.forEach((pr) => {
    ctx.fillStyle = pr.color;
    ctx.globalAlpha = Math.min(1, pr.life / 300);
    ctx.shadowColor = pr.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(pr.x - pr.r, pr.y - pr.r, pr.r * 2, pr.r * 2);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  });
}

function drawTraps() {
  G.traps.forEach((t) => {
    if (t.triggered) return;
    ctx.fillStyle = "rgba(0,212,170,.12)";
    ctx.strokeStyle = "#00d4aa";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(t.x - 22, t.y - 22, 44, 44);
    ctx.setLineDash([]);
    ctx.fillRect(t.x - 22, t.y - 22, 44, 44);
    ctx.font = "16px serif";
    ctx.textAlign = "center";
    ctx.fillText("💣", t.x, t.y + 7);
  });
}

function drawFX() {
  G.particles.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
  });
  ctx.globalAlpha = 1;
}

// ═══ GAME CONTROLS ═══
function togglePause() {
  if (!G || G.gameOver) return;
  G.paused = !G.paused;
  if (G.paused) {
    document.getElementById("game-hud").classList.remove("visible");
    document.getElementById("skills-bar").classList.remove("visible");
    showRaw("s-pause");
  } else {
    document.getElementById("game-hud").classList.add("visible");
    document.getElementById("skills-bar").classList.add("visible");
    showRaw("s-game");
  }
}

function resumeGame() {
  if (!G) return;
  G.paused = false;
  document.getElementById("game-hud").classList.add("visible");
  document.getElementById("skills-bar").classList.add("visible");
  showRaw("s-game");
}

function restartGame() {
  const cls = G?.cls || CU?.class;
  stopGame();
  if (cls) startGame(cls);
}

function quitToHub() {
  stopGame();
  document.getElementById("hud").style.display = "flex";
  refreshHudTop();
  showScreen("s-hub");
  refreshHub();
}

// ═══ INPUT HANDLERS ═══
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (currentScreen === "s-game" || currentScreen === "s-pause")
      togglePause();
    return;
  }
  if (G && !G.paused && !G.gameOver) {
    G.keys[e.key] = true;
    if (e.key === "1") useSkill(0);
    if (e.key === "2") useSkill(1);
    if (e.key === "3") useSkill(2);
  }
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key))
    e.preventDefault();
});

document.addEventListener("keyup", (e) => {
  if (G) G.keys[e.key] = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (G) {
    const r = canvas.getBoundingClientRect();
    G.mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
  }
});

canvas.addEventListener("click", (e) => {
  if (!G || G.paused || G.gameOver) return;
  const now = performance.now();
  if (now - G.player.lastAttack > G.def.attackRate * 0.8) {
    G.player.lastAttack = now;
    autoAttack();
  }
});

document.addEventListener("keydown", (e) => {
  if (currentScreen === "s-auth" && e.key === "Enter") {
    const active = document.querySelector(".auth-form.active");
    if (active?.id === "form-login") doLogin();
    if (active?.id === "form-register") doRegister();
  }
});
