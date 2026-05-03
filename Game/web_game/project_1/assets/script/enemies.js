// ═══════════════════════════════════════════════════
//  NEXUS ZERO — enemies.js
//  Enemy types, AI behavior, spawning
// ═══════════════════════════════════════════════════
'use strict';

const ETYPES = [
  { name: 'RAIDER',  color: '#e74c3c', size: 10, hp: 30,  spd: 1.2, dmg: 8,  score: 10, ranged: false },
  { name: 'BRUTE',   color: '#c0392b', size: 16, hp: 80,  spd: 0.7, dmg: 18, score: 25, ranged: false },
  { name: 'SPEEDER', color: '#f39c12', size: 8,  hp: 20,  spd: 2.5, dmg: 6,  score: 15, ranged: false },
  { name: 'TANK',    color: '#7f8c8d', size: 20, hp: 200, spd: 0.5, dmg: 25, score: 50, ranged: false },
  { name: 'SHOOTER', color: '#e67e22', size: 11, hp: 40,  spd: 1.0, dmg: 10, score: 20, ranged: true },
];

function spawnEnemy() {
  if (G.waveSpawnLeft <= 0) return;
  const vw = canvas.width, vh = canvas.height, m = 90;
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0)      { x = G.camX - m;      y = G.camY + Math.random() * vh; }
  else if (side === 1) { x = G.camX + vw + m;  y = G.camY + Math.random() * vh; }
  else if (side === 2) { x = G.camX + Math.random() * vw; y = G.camY - m; }
  else                 { x = G.camX + Math.random() * vw; y = G.camY + vh + m; }
  x = Math.max(30, Math.min(MAP_W - 30, x));
  y = Math.max(30, Math.min(MAP_H - 30, y));

  // Pool based on wave
  let pool = [0, 0, 0, 2, 2];
  if (G.wave >= 2) pool.push(1, 4);
  if (G.wave >= 4) pool.push(3);
  if (G.wave >= 6) pool.push(3, 4, 4);
  const ti = pool[Math.floor(Math.random() * pool.length)];
  const t = ETYPES[ti];
  const sc = 1 + (G.wave - 1) * 0.15;

  G.enemies.push({
    x, y, type: ti,
    hp: t.hp * sc | 0,
    maxHp: t.hp * sc | 0,
    spd: t.spd,
    lastAttack: 0,
    lastShot: 0,
    stunTimer: 0,
    flashTimer: 0,
  });
  G.waveSpawnLeft--;
}

function updateEnemy(e, dt, now) {
  const p = G.player, t = ETYPES[e.type];
  if (e.flashTimer > 0) e.flashTimer -= dt;
  if (e.stunTimer > 0) { e.stunTimer -= dt; return; }

  const dx = p.x - e.x, dy = p.y - e.y;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  const spd = t.spd * (1 + G.wave * .04);

  if (t.ranged) {
    // Keep distance and shoot
    if (d < 200) { e.x -= (dx / d) * spd; e.y -= (dy / d) * spd; }
    else if (d > 300) { e.x += (dx / d) * spd; e.y += (dy / d) * spd; }
    if (now - e.lastShot > 2000) {
      e.lastShot = now;
      const a = Math.atan2(dy, dx);
      G.projectiles.push({
        x: e.x, y: e.y,
        dx: Math.cos(a), dy: Math.sin(a),
        spd: 3.5, r: 5, dmg: t.dmg, color: '#e67e22',
        life: 2000, friendly: false
      });
    }
  } else {
    // Chase player
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

function killEnemy(e) {
  const t = ETYPES[e.type];
  e.hp = 0;
  G.kills++;
  G.score += t.score * G.wave;
  spawnFX(e.x, e.y, t.color, 10);
}

function takeDamage(dmg) {
  const p = G.player;
  p.hp = Math.max(0, p.hp - dmg);
  p.invincible = 420;
  spawnFX(p.x, p.y, '#e74c3c', 7);
  if (p.hp <= 0) endGame();
}
