// ═══════════════════════════════════════════════════
//  NEXUS ZERO — player.js
//  Class definitions, skills, auto-attack
// ═══════════════════════════════════════════════════
'use strict';

const CLASS_DEF = {
  warrior: {
    label: '⚔ RAVAGER', color: '#ff6b35',
    hp: 150, speed: 2.2, attackRange: 72, attackDmg: 26, attackRate: 380, projSpeed: 0,
    skills: [
      { name: 'CHARGE',     icon: '💥', cd: 5000,  fn: 'skillCharge' },
      { name: 'TOURBILLON', icon: '🌀', cd: 8000,  fn: 'skillSpin' },
      { name: 'RAGE',       icon: '🔥', cd: 15000, fn: 'skillRage' },
    ]
  },
  mage: {
    label: '🔮 HEXOMANCER', color: '#9b59b6',
    hp: 75, speed: 2.9, attackRange: 240, attackDmg: 17, attackRate: 720, projSpeed: 5.8,
    skills: [
      { name: 'NOVA',     icon: '💜', cd: 6000,  fn: 'skillNova' },
      { name: 'TÉLÉPORT', icon: '✨', cd: 10000, fn: 'skillTeleport' },
      { name: 'TEMPÊTE',  icon: '⚡', cd: 20000, fn: 'skillStorm' },
    ]
  },
  archer: {
    label: '🎯 DRIFTER', color: '#00d4aa',
    hp: 100, speed: 3.6, attackRange: 290, attackDmg: 14, attackRate: 280, projSpeed: 7.2,
    skills: [
      { name: 'RAFALE',  icon: '🏹', cd: 4000, fn: 'skillBurst' },
      { name: 'PIÈGE',   icon: '💣', cd: 8000, fn: 'skillTrap' },
      { name: 'ESQUIVE', icon: '💨', cd: 6000, fn: 'skillDash' },
    ]
  },
};

// ═══ AUTO-ATTACK ═══
function autoAttack() {
  const p = G.player, def = G.def;
  const mx = G.mouse.x + G.camX, my = G.mouse.y + G.camY;
  const angle = Math.atan2(my - p.y, mx - p.x);

  if (G.cls === 'warrior') {
    // Melee cone attack
    G.enemies.forEach(e => {
      const d = vdist(p, e);
      if (d < def.attackRange) {
        const ea = Math.atan2(e.y - p.y, e.x - p.x);
        if (Math.abs(normAngle(ea - angle)) < 1.1) {
          e.hp -= def.attackDmg * (p.rageActive ? 2.2 : 1);
          e.flashTimer = 150;
          spawnFX(e.x, e.y, def.color, 5);
          if (e.hp <= 0) killEnemy(e);
        }
      }
    });
    spawnFX(p.x + Math.cos(angle) * 42, p.y + Math.sin(angle) * 42, '#ff6b35', 3);
  } else {
    // Ranged projectile
    const dmg = def.attackDmg * (p.rageActive ? 2 : 1);
    G.projectiles.push({
      x: p.x, y: p.y,
      dx: Math.cos(angle), dy: Math.sin(angle),
      spd: def.projSpeed,
      r: G.cls === 'mage' ? 6 : 4,
      dmg, color: def.color,
      life: 2500, friendly: true, pierce: false
    });
  }
}

// ═══ SKILLS ═══
function useSkill(i) {
  const sk = G.skills[i], now = performance.now();
  if (now - sk.lastUsed < sk.cd) return;
  sk.lastUsed = now;
  window[sk.fn]?.();
}

// ── WARRIOR SKILLS ──
function skillCharge() {
  const p = G.player, a = Math.atan2(G.mouse.y + G.camY - p.y, G.mouse.x + G.camX - p.x);
  p.dashDx = Math.cos(a); p.dashDy = Math.sin(a); p.dashTimer = 260;
  G.enemies.forEach(e => {
    if (vdist(p, e) < 105) {
      e.hp -= 55; e.stunTimer = 1300; e.flashTimer = 300;
      spawnFX(e.x, e.y, '#ff6b35', 13);
      if (e.hp <= 0) killEnemy(e);
    }
  });
  spawnFX(p.x, p.y, '#ff6b35', 16);
}

function skillSpin() {
  G.spinActive = true; G.spinTimer = 2600;
  spawnFX(G.player.x, G.player.y, '#ff6b35', 22);
}

function skillRage() {
  G.player.rageActive = true; G.player.rageTimer = 8000;
  spawnFX(G.player.x, G.player.y, '#ff3300', 32);
  announceWave('🔥 RAGE ACTIVÉE !');
}

// ── MAGE SKILLS ──
function skillNova() {
  const p = G.player, step = (Math.PI * 2) / 12;
  for (let i = 0; i < 12; i++) {
    G.projectiles.push({
      x: p.x, y: p.y,
      dx: Math.cos(i * step), dy: Math.sin(i * step),
      spd: 5.2, r: 7, dmg: 38, color: '#9b59b6',
      life: 1900, friendly: true
    });
  }
  spawnFX(p.x, p.y, '#9b59b6', 28);
}

function skillTeleport() {
  const p = G.player;
  spawnFX(p.x, p.y, '#9b59b6', 22);
  p.x = Math.max(15, Math.min(MAP_W - 15, G.mouse.x + G.camX));
  p.y = Math.max(15, Math.min(MAP_H - 15, G.mouse.y + G.camY));
  p.invincible = 650;
  spawnFX(p.x, p.y, '#c39bd3', 22);
}

function skillStorm() {
  G.stormActive = true; G.stormTimer = 5500; G.stormTick = 0;
  announceWave('⚡ TEMPÊTE DE FOUDRE !');
}

// ── ARCHER SKILLS ──
function skillBurst() {
  const p = G.player, a = Math.atan2(G.mouse.y + G.camY - p.y, G.mouse.x + G.camX - p.x);
  for (let i = -2; i <= 2; i++) {
    G.projectiles.push({
      x: p.x, y: p.y,
      dx: Math.cos(a + i * .18), dy: Math.sin(a + i * .18),
      spd: 8, r: 4, dmg: 22, color: '#00d4aa',
      life: 1500, friendly: true
    });
  }
}

function skillTrap() {
  G.traps.push({
    x: G.mouse.x + G.camX,
    y: G.mouse.y + G.camY,
    life: 15000, triggered: false
  });
}

function skillDash() {
  const p = G.player, a = Math.atan2(G.mouse.y + G.camY - p.y, G.mouse.x + G.camX - p.x);
  p.dashDx = Math.cos(a); p.dashDy = Math.sin(a);
  p.dashTimer = 210; p.invincible = 320;
  spawnFX(p.x, p.y, '#00d4aa', 13);
}
