// ═══════════════════════════════════════════════════
//  enemies.js
//  Enemy types, Boss system, AI behavior, spawning
// ═══════════════════════════════════════════════════
"use strict";

const ETYPES = [
  {
    name: "RAIDER",
    color: "#e74c3c",
    size: 10,
    hp: 30,
    spd: 1.2,
    dmg: 8,
    score: 10,
    ranged: false,
  },
  {
    name: "BRUTE",
    color: "#c0392b",
    size: 16,
    hp: 80,
    spd: 0.7,
    dmg: 18,
    score: 25,
    ranged: false,
  },
  {
    name: "SPEEDER",
    color: "#f39c12",
    size: 8,
    hp: 20,
    spd: 2.5,
    dmg: 6,
    score: 15,
    ranged: false,
  },
  {
    name: "TANK",
    color: "#7f8c8d",
    size: 20,
    hp: 200,
    spd: 0.5,
    dmg: 25,
    score: 50,
    ranged: false,
  },
  {
    name: "SHOOTER",
    color: "#e67e22",
    size: 11,
    hp: 40,
    spd: 1.0,
    dmg: 10,
    score: 20,
    ranged: true,
  },
];

// ═══ BOSS DEFINITIONS ═══
const BOSS_TYPES = [
  {
    name: "WARDEN",
    title: "⚠ BOSS: WARDEN ⚠",
    color: "#ff1744",
    size: 32,
    baseHp: 800,
    spd: 0.6,
    dmg: 30,
    score: 300,
    // Charge at player periodically
    pattern: "charger",
    attackCD: 3000,
    specialCD: 6000,
  },
  {
    name: "NEXUS CORE",
    title: "⚠ BOSS: NEXUS CORE ⚠",
    color: "#aa00ff",
    size: 28,
    baseHp: 600,
    spd: 0.4,
    dmg: 15,
    score: 350,
    // Shoots projectile rings
    pattern: "shooter",
    attackCD: 1500,
    specialCD: 5000,
  },
  {
    name: "SWARM QUEEN",
    title: "⚠ BOSS: SWARM QUEEN ⚠",
    color: "#ffab00",
    size: 26,
    baseHp: 500,
    spd: 0.8,
    dmg: 12,
    score: 400,
    // Spawns minions
    pattern: "spawner",
    attackCD: 2000,
    specialCD: 4000,
  },
];

// ═══ SPAWN NORMAL ENEMY ═══
function spawnEnemy() {
  if (G.waveSpawnLeft <= 0) return;
  const vw = canvas.width,
    vh = canvas.height,
    m = 90;
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) {
    x = G.camX - m;
    y = G.camY + Math.random() * vh;
  } else if (side === 1) {
    x = G.camX + vw + m;
    y = G.camY + Math.random() * vh;
  } else if (side === 2) {
    x = G.camX + Math.random() * vw;
    y = G.camY - m;
  } else {
    x = G.camX + Math.random() * vw;
    y = G.camY + vh + m;
  }
  x = Math.max(30, Math.min(MAP_W - 30, x));
  y = Math.max(30, Math.min(MAP_H - 30, y));

  let pool = [0, 0, 0, 2, 2];
  if (G.wave >= 2) pool.push(1, 4);
  if (G.wave >= 4) pool.push(3);
  if (G.wave >= 6) pool.push(3, 4, 4);
  const ti = pool[Math.floor(Math.random() * pool.length)];
  const t = ETYPES[ti];
  const sc = 1 + (G.wave - 1) * 0.15;

  G.enemies.push({
    x,
    y,
    type: ti,
    isBoss: false,
    hp: (t.hp * sc) | 0,
    maxHp: (t.hp * sc) | 0,
    spd: t.spd,
    lastAttack: 0,
    lastShot: 0,
    stunTimer: 0,
    flashTimer: 0,
  });
  G.waveSpawnLeft--;
}

// ═══ SPAWN BOSS ═══
function spawnBoss(wave) {
  const bossIndex = Math.floor((wave / 5 - 1) % BOSS_TYPES.length);
  const boss = BOSS_TYPES[bossIndex];
  const hpScale = 1 + (wave - 5) * 0.2;

  // Spawn opposite side of player
  const px = G.player.x,
    py = G.player.y;
  let bx = px < MAP_W / 2 ? MAP_W * 0.75 : MAP_W * 0.25;
  let by = py < MAP_H / 2 ? MAP_H * 0.75 : MAP_H * 0.25;

  G.enemies.push({
    x: bx,
    y: by,
    type: -1, // special boss type
    isBoss: true,
    bossType: bossIndex,
    bossName: boss.name,
    bossColor: boss.color,
    bossSize: boss.size,
    bossPattern: boss.pattern,
    hp: (boss.baseHp * hpScale) | 0,
    maxHp: (boss.baseHp * hpScale) | 0,
    spd: boss.spd,
    dmg: boss.dmg,
    score: (boss.score * (wave / 5)) | 0,
    lastAttack: 0,
    lastShot: 0,
    lastSpecial: 0,
    stunTimer: 0,
    flashTimer: 0,
    phaseTimer: 0,
    chargeDir: 0,
    charging: false,
    chargeTimer: 0,
  });

  announceWave(boss.title);
}

// ═══ UPDATE ENEMY ═══
function updateEnemy(e, dt, now) {
  const p = G.player;

  if (e.flashTimer > 0) e.flashTimer -= dt;
  if (e.stunTimer > 0) {
    e.stunTimer -= dt;
    return;
  }

  if (e.isBoss) {
    updateBoss(e, dt, now);
    return;
  }

  const t = ETYPES[e.type];
  const dx = p.x - e.x,
    dy = p.y - e.y;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  const spd = t.spd * (1 + G.wave * 0.04);

  if (t.ranged) {
    if (d < 200) {
      e.x -= (dx / d) * spd;
      e.y -= (dy / d) * spd;
    } else if (d > 300) {
      e.x += (dx / d) * spd;
      e.y += (dy / d) * spd;
    }
    if (now - e.lastShot > 2000) {
      e.lastShot = now;
      const a = Math.atan2(dy, dx);
      G.projectiles.push({
        x: e.x,
        y: e.y,
        dx: Math.cos(a),
        dy: Math.sin(a),
        spd: 3.5,
        r: 5,
        dmg: t.dmg,
        color: "#e67e22",
        life: 2000,
        friendly: false,
      });
    }
  } else {
    e.x += (dx / d) * spd;
    e.y += (dy / d) * spd;
    if (d < 28 && now - e.lastAttack > 800) {
      e.lastAttack = now;
      if (p.invincible <= 0) takeDamage(t.dmg);
    }
  }
  e.x = Math.max(15, Math.min(MAP_W - 15, e.x));
  e.y = Math.max(15, Math.min(MAP_H - 15, e.y));
}

// ═══ BOSS AI ═══
function updateBoss(e, dt, now) {
  const p = G.player;
  const dx = p.x - e.x,
    dy = p.y - e.y;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;

  // ── WARDEN: charges at player ──
  if (e.bossPattern === "charger") {
    if (e.charging) {
      e.chargeTimer -= dt;
      e.x += Math.cos(e.chargeDir) * 5;
      e.y += Math.sin(e.chargeDir) * 5;
      // Damage on contact during charge
      if (d < 45 && p.invincible <= 0) {
        takeDamage(e.dmg * 1.5);
        e.charging = false;
      }
      if (e.chargeTimer <= 0) e.charging = false;
    } else {
      // Walk towards player slowly
      e.x += (dx / d) * e.spd;
      e.y += (dy / d) * e.spd;
      // Melee attack
      if (d < 40 && now - e.lastAttack > 1200) {
        e.lastAttack = now;
        if (p.invincible <= 0) takeDamage(e.dmg);
        spawnFX(p.x, p.y, e.bossColor, 8);
      }
      // Special: charge
      if (now - e.lastSpecial > 5000) {
        e.lastSpecial = now;
        e.charging = true;
        e.chargeTimer = 600;
        e.chargeDir = Math.atan2(dy, dx);
        spawnFX(e.x, e.y, "#ff1744", 20);
      }
    }
  }

  // ── NEXUS CORE: shoots rings ──
  else if (e.bossPattern === "shooter") {
    // Keep distance
    if (d < 250) {
      e.x -= (dx / d) * e.spd * 0.5;
      e.y -= (dy / d) * e.spd * 0.5;
    } else if (d > 400) {
      e.x += (dx / d) * e.spd;
      e.y += (dy / d) * e.spd;
    }
    // Single shots
    if (now - e.lastAttack > 1500) {
      e.lastAttack = now;
      const a = Math.atan2(dy, dx);
      for (let i = -1; i <= 1; i++) {
        G.projectiles.push({
          x: e.x,
          y: e.y,
          dx: Math.cos(a + i * 0.25),
          dy: Math.sin(a + i * 0.25),
          spd: 3,
          r: 7,
          dmg: e.dmg,
          color: "#aa00ff",
          life: 2500,
          friendly: false,
        });
      }
    }
    // Special: ring of projectiles
    if (now - e.lastSpecial > 5500) {
      e.lastSpecial = now;
      const step = (Math.PI * 2) / 16;
      for (let i = 0; i < 16; i++) {
        G.projectiles.push({
          x: e.x,
          y: e.y,
          dx: Math.cos(i * step),
          dy: Math.sin(i * step),
          spd: 2.5,
          r: 5,
          dmg: e.dmg * 0.7,
          color: "#d500f9",
          life: 3000,
          friendly: false,
        });
      }
      spawnFX(e.x, e.y, "#aa00ff", 25);
    }
  }

  // ── SWARM QUEEN: spawns minions ──
  else if (e.bossPattern === "spawner") {
    // Move towards player moderately
    e.x += (dx / d) * e.spd * 0.7;
    e.y += (dy / d) * e.spd * 0.7;
    // Melee
    if (d < 35 && now - e.lastAttack > 1000) {
      e.lastAttack = now;
      if (p.invincible <= 0) takeDamage(e.dmg);
    }
    // Special: spawn 3 speeders around her
    if (now - e.lastSpecial > 4500) {
      e.lastSpecial = now;
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const sx = e.x + Math.cos(a) * 50;
        const sy = e.y + Math.sin(a) * 50;
        G.enemies.push({
          x: sx,
          y: sy,
          type: 2,
          isBoss: false,
          hp: 25,
          maxHp: 25,
          spd: 2.5,
          lastAttack: 0,
          lastShot: 0,
          stunTimer: 0,
          flashTimer: 0,
        });
      }
      spawnFX(e.x, e.y, "#ffab00", 18);
    }
  }

  e.x = Math.max(20, Math.min(MAP_W - 20, e.x));
  e.y = Math.max(20, Math.min(MAP_H - 20, e.y));
}

// ═══ KILL / DAMAGE ═══
function killEnemy(e) {
  if (e.isBoss) {
    e.hp = 0;
    G.kills++;
    G.score += e.score;
    spawnFX(e.x, e.y, e.bossColor, 40);
    // Boss loot: heal player 50% + bonus coins
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + G.player.maxHp * 0.5);
    G.score += 200;
    announceWave("💀 " + e.bossName + " VAINCU !");
    return;
  }
  const t = ETYPES[e.type];
  e.hp = 0;
  G.kills++;
  G.score += t.score * G.wave;
  spawnFX(e.x, e.y, t.color, 10);
}

function takeDamage(dmg) {
  const p = G.player;
  // Mage shield absorb
  if (p.shieldActive && p.shieldHP > 0) {
    const absorbed = Math.min(dmg, p.shieldHP);
    p.shieldHP -= absorbed;
    dmg -= absorbed;
    spawnFX(p.x, p.y, "#6c3fff", 5);
    if (p.shieldHP <= 0) p.shieldActive = false;
    if (dmg <= 0) return;
  }
  // Warrior armor passive
  const armor = G.def.armor || 0;
  if (armor > 0) dmg = dmg * (1 - armor);
  p.hp = Math.max(0, p.hp - dmg);
  p.invincible = 420;
  spawnFX(p.x, p.y, "#e74c3c", 7);
  if (p.hp <= 0) endGame();
}
