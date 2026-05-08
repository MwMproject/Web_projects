// ═══════════════════════════════════════════════════
//  WaveBorn — player.js
// ═══════════════════════════════════════════════════
"use strict";

const CLASS_DEF = {
  warrior: {
    label: "⚔ RAVAGER",
    color: "#ff6b35",
    hp: 200,
    speed: 2.4,
    attackRange: 88,
    attackDmg: 30,
    attackRate: 350,
    projSpeed: 0,
    armor: 0.3,
    regen: 0.02,
    skills: [
      { name: "CHARGE", icon: "💥", cd: 4500, fn: "skillCharge" },
      { name: "TOURBILLON", icon: "🌀", cd: 7000, fn: "skillSpin" },
      { name: "RAGE", icon: "🔥", cd: 14000, fn: "skillRage" },
    ],
  },
  mage: {
    label: "🔮 HEXOMANCER",
    color: "#9b59b6",
    hp: 75,
    speed: 2.9,
    attackRange: 240,
    attackDmg: 17,
    attackRate: 720,
    projSpeed: 5.8,
    armor: 0,
    regen: 0,
    skills: [
      { name: "NOVA", icon: "💜", cd: 6000, fn: "skillNova" },
      { name: "BOUCLIER", icon: "🛡", cd: 12000, fn: "skillShield" },
      { name: "TEMPÊTE", icon: "⚡", cd: 20000, fn: "skillStorm" },
    ],
  },
  archer: {
    label: "🎯 DRIFTER",
    color: "#00d4aa",
    hp: 100,
    speed: 3.6,
    attackRange: 290,
    attackDmg: 14,
    attackRate: 280,
    projSpeed: 7.2,
    armor: 0,
    regen: 0,
    skills: [
      { name: "RAFALE", icon: "🏹", cd: 4000, fn: "skillBurst" },
      { name: "PIÈGE", icon: "💣", cd: 8000, fn: "skillTrap" },
      { name: "ESQUIVE", icon: "💨", cd: 6000, fn: "skillDash" },
    ],
  },
};

// ═══ AUTO-ATTACK ═══
function autoAttack() {
  const p = G.player,
    def = G.def;
  const mx = G.mouse.x + G.camX,
    my = G.mouse.y + G.camY;
  const angle = Math.atan2(my - p.y, mx - p.x);

  if (G.cls === "warrior") {
    let hitCount = 0;
    G.enemies.forEach((e) => {
      const d = vdist(p, e);
      if (d < def.attackRange) {
        const ea = Math.atan2(e.y - p.y, e.x - p.x);
        if (Math.abs(normAngle(ea - angle)) < 1.5) {
          const dmgMult = (p.rageActive ? 2.5 : 1) * (p.buffDamage ? 2 : 1);
          const dmg = def.attackDmg * dmgMult;
          e.hp -= dmg;
          e.flashTimer = 150;
          const kbAngle = Math.atan2(e.y - p.y, e.x - p.x);
          e.x += Math.cos(kbAngle) * 6;
          e.y += Math.sin(kbAngle) * 6;
          spawnFX(e.x, e.y, def.color, 5);
          spawnDmgNumber(e.x, e.y, dmg | 0, "#fff", dmgMult > 2);
          hitCount++;
          if (e.hp <= 0) killEnemy(e);
        }
      }
    });
    if (hitCount > 0) p.hp = Math.min(p.maxHp, p.hp + hitCount * 3);
    for (let i = -2; i <= 2; i++) {
      const sa = angle + i * 0.3;
      spawnFX(p.x + Math.cos(sa) * 50, p.y + Math.sin(sa) * 50, "#ff6b35", 2);
    }
  } else {
    const dmgMult = (p.rageActive ? 2 : 1) * (p.buffDamage ? 2 : 1);
    const dmg = def.attackDmg * dmgMult;
    G.projectiles.push({
      x: p.x,
      y: p.y,
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      spd: def.projSpeed,
      r: G.cls === "mage" ? 6 : 4,
      dmg,
      color: def.color,
      life: 2500,
      friendly: true,
      pierce: false,
    });
  }
}

// ═══ SKILLS ═══
function useSkill(i) {
  const sk = G.skills[i],
    now = performance.now();
  if (now - sk.lastUsed < sk.cd) return;
  sk.lastUsed = now;
  window[sk.fn]?.();
}

// ── WARRIOR ──
function skillCharge() {
  const p = G.player,
    a = Math.atan2(G.mouse.y + G.camY - p.y, G.mouse.x + G.camX - p.x);
  p.dashDx = Math.cos(a);
  p.dashDy = Math.sin(a);
  p.dashTimer = 280;
  p.invincible = 300;
  G.enemies.forEach((e) => {
    if (vdist(p, e) < 120) {
      e.hp -= 60;
      e.stunTimer = 1500;
      e.flashTimer = 300;
      const kb = Math.atan2(e.y - p.y, e.x - p.x);
      e.x += Math.cos(kb) * 30;
      e.y += Math.sin(kb) * 30;
      spawnFX(e.x, e.y, "#ff6b35", 13);
      spawnDmgNumber(e.x, e.y, 60, "#ff6b35", true);
      if (e.hp <= 0) killEnemy(e);
    }
  });
  spawnFX(p.x, p.y, "#ff6b35", 18);
  screenShake(6, 250);
}

function skillSpin() {
  G.spinActive = true;
  G.spinTimer = 3000;
  spawnFX(G.player.x, G.player.y, "#ff6b35", 25);
}

function skillRage() {
  const p = G.player;
  p.rageActive = true;
  p.rageTimer = 8000;
  p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.3);
  spawnFX(p.x, p.y, "#ff3300", 35);
  screenShake(5, 200);
  announceWave("🔥 RAGE !");
}

// ── MAGE ──
function skillNova() {
  const p = G.player,
    step = (Math.PI * 2) / 12;
  for (let i = 0; i < 12; i++) {
    G.projectiles.push({
      x: p.x,
      y: p.y,
      dx: Math.cos(i * step),
      dy: Math.sin(i * step),
      spd: 5.2,
      r: 7,
      dmg: 38,
      color: "#9b59b6",
      life: 1900,
      friendly: true,
    });
  }
  spawnFX(p.x, p.y, "#9b59b6", 28);
  screenShake(5, 200);
}

function skillShield() {
  const p = G.player;
  p.shieldActive = true;
  p.shieldTimer = 4000;
  p.shieldHP = 60;
  spawnFX(p.x, p.y, "#6c3fff", 20);
  announceWave("🛡 BOUCLIER ARCANE !");
}

function skillStorm() {
  G.stormActive = true;
  G.stormTimer = 5500;
  G.stormTick = 0;
  announceWave("⚡ TEMPÊTE !");
}

// ── ARCHER ──
function skillBurst() {
  const p = G.player,
    a = Math.atan2(G.mouse.y + G.camY - p.y, G.mouse.x + G.camX - p.x);
  for (let i = -2; i <= 2; i++) {
    G.projectiles.push({
      x: p.x,
      y: p.y,
      dx: Math.cos(a + i * 0.18),
      dy: Math.sin(a + i * 0.18),
      spd: 8,
      r: 4,
      dmg: 22,
      color: "#00d4aa",
      life: 1500,
      friendly: true,
    });
  }
}

function skillTrap() {
  G.traps.push({
    x: G.mouse.x + G.camX,
    y: G.mouse.y + G.camY,
    life: 15000,
    triggered: false,
  });
}

function skillDash() {
  const p = G.player,
    a = Math.atan2(G.mouse.y + G.camY - p.y, G.mouse.x + G.camX - p.x);
  p.dashDx = Math.cos(a);
  p.dashDy = Math.sin(a);
  p.dashTimer = 210;
  p.invincible = 320;
  spawnFX(p.x, p.y, "#00d4aa", 13);
}
