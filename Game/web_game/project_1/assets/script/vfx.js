// ═══════════════════════════════════════════════════
//  WaveBorn — vfx.js
//  Visual effects: slash arcs, projectile trails, explosions
// ═══════════════════════════════════════════════════
"use strict";

// ═══ SLASH ARC (warrior melee) ═══
function drawSlashArc(x, y, angle, radius, color, progress) {
  // progress: 0 to 1
  const arcSpan = 2.2; // radians of arc
  const startAngle = angle - arcSpan / 2;
  const endAngle = startAngle + arcSpan * progress;

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 1 - progress * 0.7;
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.6 + progress * 0.4), startAngle, endAngle);
  ctx.stroke();

  // Inner glow
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.globalAlpha = (1 - progress) * 0.5;
  ctx.beginPath();
  ctx.arc(
    x,
    y,
    radius * (0.5 + progress * 0.3),
    startAngle + 0.1,
    endAngle - 0.1,
  );
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// ═══ PROJECTILE TRAIL ═══
function drawProjectileTrail(pr) {
  if (!pr.friendly && !pr.isCrit) return;

  const trailLen = 5;
  for (let i = 1; i <= trailLen; i++) {
    const t = i / trailLen;
    const tx = pr.x - pr.dx * pr.spd * i * 1.5;
    const ty = pr.y - pr.dy * pr.spd * i * 1.5;
    ctx.fillStyle = pr.color;
    ctx.globalAlpha = (1 - t) * 0.3;
    const s = pr.r * (1 - t * 0.5);
    ctx.fillRect(tx - s, ty - s, s * 2, s * 2);
  }
  ctx.globalAlpha = 1;
}

// ═══ KILL EXPLOSION ═══
function spawnKillExplosion(x, y, color, size) {
  if (!G) return;
  G.explosions.push({
    x,
    y,
    color,
    radius: size || 20,
    life: 400,
    maxLife: 400,
  });
}

function updateExplosions(dt) {
  if (!G) return;
  G.explosions.forEach((e) => {
    e.life -= dt;
  });
  G.explosions = G.explosions.filter((e) => e.life > 0);
}

function drawExplosions() {
  if (!G) return;
  G.explosions.forEach((e) => {
    const progress = 1 - e.life / e.maxLife;
    const r = e.radius * (0.3 + progress * 1.2);
    const alpha = (1 - progress) * 0.6;

    // Outer ring
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 3 * (1 - progress);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner flash
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = alpha * 0.4;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r * 0.4 * (1 - progress), 0, Math.PI * 2);
    ctx.fill();

    // Shockwave lines
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = alpha * 0.3;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + progress * 2;
      ctx.beginPath();
      ctx.moveTo(e.x + Math.cos(a) * r * 0.5, e.y + Math.sin(a) * r * 0.5);
      ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
      ctx.stroke();
    }
  });
  ctx.globalAlpha = 1;
}

// ═══ ACTIVE SLASH EFFECT ═══
function spawnSlashEffect(x, y, angle, color) {
  if (!G) return;
  G.slashEffects.push({
    x,
    y,
    angle,
    color,
    life: 250,
    maxLife: 250,
    radius: 55,
  });
}

function updateSlashEffects(dt) {
  if (!G) return;
  G.slashEffects.forEach((s) => {
    s.life -= dt;
  });
  G.slashEffects = G.slashEffects.filter((s) => s.life > 0);
}

function drawSlashEffects() {
  if (!G) return;
  G.slashEffects.forEach((s) => {
    const progress = 1 - s.life / s.maxLife;
    drawSlashArc(s.x, s.y, s.angle, s.radius, s.color, progress);
  });
}

// ═══ SKILL CAST RING ═══
function spawnCastRing(x, y, color, maxRadius) {
  if (!G) return;
  G.castRings.push({
    x,
    y,
    color,
    maxRadius: maxRadius || 80,
    life: 500,
    maxLife: 500,
  });
}

function updateCastRings(dt) {
  if (!G) return;
  G.castRings.forEach((r) => {
    r.life -= dt;
  });
  G.castRings = G.castRings.filter((r) => r.life > 0);
}

function drawCastRings() {
  if (!G) return;
  G.castRings.forEach((r) => {
    const progress = 1 - r.life / r.maxLife;
    const radius = r.maxRadius * progress;
    const alpha = (1 - progress) * 0.5;

    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2 * (1 - progress) + 1;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner sparkle dots
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = alpha * 0.6;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + progress * 4;
      ctx.fillRect(
        r.x + Math.cos(a) * radius - 1,
        r.y + Math.sin(a) * radius - 1,
        2,
        2,
      );
    }
  });
  ctx.globalAlpha = 1;
}
