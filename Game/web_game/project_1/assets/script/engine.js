// ═══════════════════════════════════════════════════
//  WaveBorn — engine.js
//  Game loop, update, render, wave system, controls
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
function createRunClassDef(cls) {
  const base = CLASS_DEF[cls];
  return {
    ...base,
    skills: base.skills.map((skill) => ({ ...skill })),
  };
}

function startGame(cls) {
  stopGame();
  const def = createRunClassDef(cls);
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
      critChance: 0.05,
      xpMult: 1,
      lifesteal: 0,
      thorns: 0,
      magnetRange: 50,
      explodeOnKill: false,
      explodeRadius: 0,
      explodeDmg: 0,
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
    explosions: [],
    slashEffects: [],
    castRings: [],
    biome: ["ruins", "desert", "lab", "sewer"][Math.floor(Math.random() * 4)],
    kills: 0,
    score: 0,
    wave: 1,
    inGameXP: 0,
    inGameLevel: 1,
    levelUpPending: false,
    levelUpChoices: [],
    appliedUpgrades: [],
    levelUpFlash: 0,
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

  // Apply equipment stats
  if (CU) applyEquipStats(G.def, G.player, CU.email);

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
          spawnFX(
            e.x,
            e.y,
            pr.isCrit ? "#ffd700" : pr.color,
            pr.isCrit ? 8 : 4,
          );
          spawnDmgNumber(
            e.x,
            e.y,
            pr.dmg | 0,
            pr.isCrit ? "#ffd700" : "#fff",
            pr.isCrit,
          );
          if (pr.isCrit) screenShake(3, 80);
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

  // VFX
  updateExplosions(dt);
  updateSlashEffects(dt);
  updateCastRings(dt);

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
  updateXPBar();
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
  drawBiomeMap(G.biome);
  drawBiomeAmbient(G.biome);
  drawTraps();
  drawLoots();
  drawSlashEffects();
  drawProjs();
  drawExplosions();
  drawEnemies();
  drawPlayer();
  drawCastRings();
  drawDmgNumbers();
  drawLootTexts();
  drawFX();
  ctx.restore();
  // Buff bar (screen space, after ctx.restore)
  drawBuffBar();
  // Off-screen enemy indicators
  drawOffScreenIndicators();
  // Minimap
  drawMinimap();
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
  // Damage flash (red vignette when hit)
  if (G.player?.invincible > 200) {
    const flashAlpha = Math.min(0.3, (G.player.invincible - 200) / 600);
    const gr2 = ctx.createRadialGradient(
      cw / 2,
      ch / 2,
      ch * 0.2,
      cw / 2,
      ch / 2,
      ch * 0.6,
    );
    gr2.addColorStop(0, "transparent");
    gr2.addColorStop(1, "rgba(231,76,60," + flashAlpha + ")");
    ctx.fillStyle = gr2;
    ctx.fillRect(0, 0, cw, ch);
  }
  // Low HP warning vignette
  if (G.player && G.player.hp / G.player.maxHp < 0.25) {
    const pulseAlpha = 0.08 + Math.sin(Date.now() * 0.006) * 0.06;
    const gr3 = ctx.createRadialGradient(
      cw / 2,
      ch / 2,
      ch * 0.15,
      cw / 2,
      ch / 2,
      ch * 0.55,
    );
    gr3.addColorStop(0, "transparent");
    gr3.addColorStop(1, "rgba(200,20,20," + pulseAlpha + ")");
    ctx.fillStyle = gr3;
    ctx.fillRect(0, 0, cw, ch);
  }
  // Level-up flash (golden burst for 1s after leveling)
  if (G.levelUpFlash > 0) {
    G.levelUpFlash -= 16;
    const flashA = Math.min(0.2, G.levelUpFlash / 1000);
    ctx.fillStyle = "rgba(255,215,0," + flashA + ")";
    ctx.fillRect(0, 0, cw, ch);
  }
  // Upgrade count badge
  if (G.appliedUpgrades && G.appliedUpgrades.length > 0) {
    ctx.fillStyle = "rgba(12,12,20,.75)";
    ctx.fillRect(12, ch - 82, 56, 18);
    ctx.strokeStyle = "#ffd70066";
    ctx.lineWidth = 1;
    ctx.strokeRect(12, ch - 82, 56, 18);
    ctx.fillStyle = "#ffd700";
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.fillText("⬆" + G.appliedUpgrades.length, 40, ch - 70);
  }
}

// ═══ OFF-SCREEN INDICATORS ═══
function drawOffScreenIndicators() {
  const cw = canvas.width,
    ch = canvas.height;
  const p = G.player;
  const margin = 40; // distance from edge
  const hudTop = 58; // don't overlap HUD

  G.enemies.forEach((e) => {
    // Convert enemy world pos to screen pos
    const sx = e.x - G.camX;
    const sy = e.y - G.camY;

    // Only draw if off-screen
    if (sx >= -10 && sx <= cw + 10 && sy >= hudTop - 10 && sy <= ch + 10)
      return;

    // Clamp to screen edges
    const cx = cw / 2,
      cy = ch / 2;
    const angle = Math.atan2(sy - cy, sx - cx);

    // Find edge intersection
    let ix, iy;
    const cos = Math.cos(angle),
      sin = Math.sin(angle);
    const halfW = cw / 2 - margin,
      halfH = (ch - hudTop) / 2 - margin;

    if (Math.abs(cos * halfH) > Math.abs(sin * halfW)) {
      // Hit left or right edge
      ix = cos > 0 ? cw - margin : margin;
      iy = cy + sin * Math.abs((ix - cx) / cos);
    } else {
      // Hit top or bottom edge
      iy = sin > 0 ? ch - margin : hudTop + margin;
      ix = cx + cos * Math.abs((iy - cy) / sin);
    }

    // Clamp
    ix = Math.max(margin, Math.min(cw - margin, ix));
    iy = Math.max(hudTop + margin / 2, Math.min(ch - margin, iy));

    // Distance for alpha (closer = more opaque)
    const dist = vdist({ x: sx, y: sy }, { x: cx, y: cy });
    const alpha = Math.min(1, Math.max(0.3, 1 - (dist - 500) / 1000));

    // Color: boss = special, normal = red
    const isBoss = e.isBoss;
    const col = isBoss ? e.bossColor || "#ff1744" : "#e74c3c";
    const size = isBoss ? 12 : 7;

    ctx.globalAlpha = alpha;

    // Arrow triangle pointing towards enemy
    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(angle);

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, -size * 0.6);
    ctx.lineTo(-size * 0.7, size * 0.6);
    ctx.closePath();
    ctx.fill();

    // Glow for bosses
    if (isBoss) {
      ctx.fillStyle = col + "44";
      ctx.beginPath();
      ctx.arc(0, 0, size + 6, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing ring
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = alpha * (0.4 + Math.sin(Date.now() * 0.006) * 0.3);
      ctx.beginPath();
      ctx.arc(
        0,
        0,
        size + 10 + Math.sin(Date.now() * 0.008) * 3,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  });
}

// ═══ MINIMAP ═══
function drawMinimap() {
  const cw = canvas.width,
    ch = canvas.height;
  const p = G.player;

  // Minimap config
  const mw = 140,
    mh = 105;
  const mx = cw - mw - 12,
    my = ch - mh - 74; // above bottom nav + skills bar
  const scaleX = mw / MAP_W,
    scaleY = mh / MAP_H;

  // Background
  ctx.fillStyle = "rgba(10,10,18,.82)";
  ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4);
  ctx.strokeStyle = "rgba(42,42,74,.8)";
  ctx.lineWidth = 1;
  ctx.strokeRect(mx - 2, my - 2, mw + 4, mh + 4);

  // Map area
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(mx, my, mw, mh);

  // Grid lines (subtle)
  ctx.strokeStyle = "rgba(0,212,170,.08)";
  for (let x = 0; x < mw; x += mw / 6) {
    ctx.beginPath();
    ctx.moveTo(mx + x, my);
    ctx.lineTo(mx + x, my + mh);
    ctx.stroke();
  }
  for (let y = 0; y < mh; y += mh / 4.5) {
    ctx.beginPath();
    ctx.moveTo(mx, my + y);
    ctx.lineTo(mx + mw, my + y);
    ctx.stroke();
  }

  // Viewport rectangle
  const vx = mx + G.camX * scaleX;
  const vy = my + G.camY * scaleY;
  const vw = cw * scaleX,
    vh = ch * scaleY;
  ctx.strokeStyle = "rgba(200,200,230,.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(vx, vy, vw, vh);

  // Enemies (dots)
  G.enemies.forEach((e) => {
    const ex = mx + e.x * scaleX;
    const ey = my + e.y * scaleY;
    if (e.isBoss) {
      // Boss: larger pulsing dot
      ctx.fillStyle = e.bossColor || "#ff1744";
      const bsize = 3 + Math.sin(Date.now() * 0.006) * 1;
      ctx.fillRect(ex - bsize, ey - bsize, bsize * 2, bsize * 2);
    } else {
      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(ex - 1, ey - 1, 2, 2);
    }
  });

  // Loots (tiny gold dots)
  G.loots.forEach((l) => {
    if (l.type === "xp") return; // don't clutter with xp orbs
    const lx = mx + l.x * scaleX;
    const ly = my + l.y * scaleY;
    ctx.fillStyle = LOOT_TYPES[l.type]?.color || "#ffd700";
    ctx.fillRect(lx, ly, 1.5, 1.5);
  });

  // Traps (teal dots)
  G.traps.forEach((t) => {
    if (t.triggered) return;
    ctx.fillStyle = "#00d4aa";
    ctx.fillRect(mx + t.x * scaleX - 1, my + t.y * scaleY - 1, 2, 2);
  });

  // Player (bright dot)
  const px = mx + p.x * scaleX;
  const py = my + p.y * scaleY;
  const pcol = G.def.color;
  // Glow
  ctx.fillStyle = pcol + "55";
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fill();
  // Dot
  ctx.fillStyle = pcol;
  ctx.fillRect(px - 2, py - 2, 4, 4);
  // White center
  ctx.fillStyle = "#fff";
  ctx.fillRect(px - 1, py - 1, 2, 2);

  // Label
  ctx.fillStyle = "rgba(200,200,230,.4)";
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = "right";
  ctx.fillText("MAP", mx + mw - 2, my - 5);
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

  // Character — animated sprite
  const spriteState = getSpriteState(p);
  const facingAngle = Math.atan2(
    G.mouse.y + G.camY - p.y,
    G.mouse.x + G.camX - p.x,
  );
  drawAnimatedSprite(p.x, p.y, G.cls, spriteState, facingAngle);

  // Aim line
  const a = facingAngle;
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
    // Low HP blink
    const lowHP = e.hp / e.maxHp < 0.2;
    const blinkOff = lowHP && Math.floor(Date.now() / 120) % 3 === 0;
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
    ctx.fillStyle = blinkOff ? "#ff4444" : col;
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
    // Trail
    drawProjectileTrail(pr);
    // Main projectile
    ctx.fillStyle = pr.color;
    ctx.globalAlpha = Math.min(1, pr.life / 300);
    ctx.shadowColor = pr.color;
    ctx.shadowBlur = pr.isCrit ? 14 : 8;
    ctx.fillRect(pr.x - pr.r, pr.y - pr.r, pr.r * 2, pr.r * 2);
    // Crit glow extra
    if (pr.isCrit) {
      ctx.fillStyle = "#ffd700";
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.r + 3, 0, Math.PI * 2);
      ctx.fill();
    }
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
