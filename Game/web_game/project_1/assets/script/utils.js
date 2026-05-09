// ═══════════════════════════════════════════════════
//  WaveBorn — utils.js
//  Utility functions: distance, angles, level calc, particles
// ═══════════════════════════════════════════════════
"use strict";

function vdist(a, b) {
  const dx = a.x - b.x,
    dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function calcLevel(xp) {
  let l = 1,
    req = 1000;
  while (xp >= req) {
    xp -= req;
    l++;
    req = l * 1000;
  }
  return l;
}

function getLevelTitle(l) {
  const t = [
    "",
    "ROOKIE",
    "SCAVENGER",
    "MARAUDEUR",
    "VETERAN",
    "ELITE",
    "CHAMPION",
    "LÉGENDE",
  ];
  return t[Math.min(l, t.length - 1)] || "LÉGENDE";
}

// ── NOTIFICATIONS ──
let notifTimer;
function showNotif(msg, isError = false) {
  const el = document.getElementById("notif");
  el.textContent = msg;
  el.className = "notif" + (isError ? " error" : "");
  el.classList.add("show");
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => el.classList.remove("show"), 3500);
}

// ── BACKGROUND PARTICLES ──
function initBgParticles() {
  const c = document.getElementById("particles");
  for (let i = 0; i < 28; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "vw";
    p.style.animationDuration = 8 + Math.random() * 15 + "s";
    p.style.animationDelay = Math.random() * 12 + "s";
    p.style.background = Math.random() > 0.5 ? "var(--teal)" : "var(--accent)";
    c.appendChild(p);
  }
}

// ── GAME PARTICLES ──
function spawnFX(x, y, color, n) {
  if (!G) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2,
      s = 1 + Math.random() * 3;
    G.particles.push({
      x,
      y,
      dx: Math.cos(a) * s,
      dy: Math.sin(a) * s - 1,
      color,
      life: 350 + Math.random() * 300,
      maxLife: 650,
      r: 1 + Math.random() * 3,
    });
  }
}

// ── DAMAGE NUMBERS ──
function spawnDmgNumber(x, y, text, color, isCrit) {
  if (!G) return;
  G.dmgNumbers.push({
    x: x + (Math.random() - 0.5) * 16,
    y: y - 10,
    text: String(text),
    color,
    life: 900,
    maxLife: 900,
    vy: -2.2 - Math.random() * 0.8,
    vx: (Math.random() - 0.5) * 1.5,
    size: isCrit ? 13 : 9,
    isCrit,
  });
}

function updateDmgNumbers(dt) {
  if (!G) return;
  G.dmgNumbers.forEach((d) => {
    d.life -= dt;
    d.x += d.vx;
    d.y += d.vy;
    d.vy += 0.04; // gravity
    d.vx *= 0.98;
  });
  G.dmgNumbers = G.dmgNumbers.filter((d) => d.life > 0);
}

function drawDmgNumbers() {
  if (!G) return;
  G.dmgNumbers.forEach((d) => {
    const alpha = Math.min(1, d.life / (d.maxLife * 0.3));
    const scale = d.isCrit
      ? 1 +
        Math.max(
          0,
          d.maxLife - d.life < 150
            ? ((150 - (d.maxLife - d.life)) / 150) * 0.4
            : 0,
        )
      : 1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = d.color;
    ctx.font =
      "bold " + ((d.size * scale) | 0) + 'px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    // Shadow for readability
    ctx.fillStyle = "#000";
    ctx.fillText(d.text, d.x + 1, d.y + 1);
    ctx.fillStyle = d.color;
    ctx.fillText(d.text, d.x, d.y);
    // Crit glow
    if (d.isCrit) {
      ctx.fillStyle = d.color + "66";
      ctx.fillText(d.text, d.x, d.y);
    }
  });
  ctx.globalAlpha = 1;
}

// ── SCREEN SHAKE ──
function screenShake(intensity, duration) {
  if (!G) return;
  // Only override if new shake is stronger
  if (intensity > (G.shake?.intensity || 0)) {
    G.shake = { intensity, duration, timer: duration };
  }
}

function updateScreenShake(dt) {
  if (!G || !G.shake) return;
  G.shake.timer -= dt;
  if (G.shake.timer <= 0) {
    G.shake = null;
  }
}

function getShakeOffset() {
  if (!G || !G.shake) return { x: 0, y: 0 };
  const progress = G.shake.timer / G.shake.duration;
  const intensity = G.shake.intensity * progress;
  return {
    x: (Math.random() - 0.5) * intensity * 2,
    y: (Math.random() - 0.5) * intensity * 2,
  };
}

// ── PIXEL CHARACTER DRAWING ──
const CHAR_DATA = {
  warrior: [
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 3, 3, 3, 1, 0, 0, 0],
    [0, 0, 1, 3, 2, 3, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
    [0, 4, 1, 1, 1, 1, 1, 4, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
  ],
  mage: [
    [0, 0, 5, 5, 5, 5, 0, 0, 0, 0],
    [0, 5, 1, 1, 1, 1, 5, 0, 0, 0],
    [0, 0, 1, 2, 1, 2, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
    [5, 0, 1, 1, 1, 1, 1, 0, 5, 0],
    [0, 5, 1, 1, 1, 1, 1, 5, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
    [5, 0, 0, 1, 0, 1, 0, 0, 5, 0],
    [0, 5, 0, 1, 0, 1, 0, 5, 0, 0],
  ],
  archer: [
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 3, 3, 3, 1, 0, 0, 0],
    [0, 0, 1, 3, 2, 3, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0, 6],
    [0, 0, 1, 1, 1, 1, 1, 0, 6, 0],
    [0, 0, 1, 1, 1, 1, 1, 6, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
  ],
};

function getCharPixels(cls) {
  return CHAR_DATA[cls] || CHAR_DATA.warrior;
}

function getCharColors(cls) {
  return (
    {
      warrior: [
        "t",
        "#ff6b35",
        "#cc4410",
        "#ffccaa",
        "#ffd700",
        "#888",
        "#555",
      ],
      mage: [
        "t",
        "#9b59b6",
        "#6c3483",
        "#f0d9f7",
        "#ffd700",
        "#00d4aa",
        "#ffd700",
      ],
      archer: [
        "t",
        "#00d4aa",
        "#007a60",
        "#ffccaa",
        "#ffd700",
        "#c8a87a",
        "#c8a87a",
      ],
    }[cls] || []
  );
}

function drawChar(canvasId, cls) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 32, 32);
  const C = {
    warrior: {
      body: "#ff6b35",
      dark: "#cc4410",
      head: "#ffccaa",
      acc: "#ffd700",
    },
    mage: { body: "#9b59b6", dark: "#6c3483", head: "#f0d9f7", acc: "#00d4aa" },
    archer: {
      body: "#00d4aa",
      dark: "#007a60",
      head: "#ffccaa",
      acc: "#c8a87a",
    },
  }[cls] || { body: "#888", dark: "#555", head: "#ccc", acc: "#fff" };
  ctx.fillStyle = C.head;
  ctx.fillRect(12, 2, 8, 8);
  ctx.fillStyle = "#333";
  ctx.fillRect(14, 5, 2, 2);
  ctx.fillRect(18, 5, 2, 2);
  ctx.fillStyle = C.body;
  ctx.fillRect(10, 10, 12, 10);
  ctx.fillStyle = C.dark;
  ctx.fillRect(10, 20, 5, 8);
  ctx.fillRect(17, 20, 5, 8);
  ctx.fillStyle = C.body;
  ctx.fillRect(6, 10, 4, 8);
  ctx.fillRect(22, 10, 4, 8);
  if (cls === "warrior") {
    ctx.fillStyle = C.acc;
    ctx.fillRect(3, 8, 3, 12);
    ctx.fillRect(2, 8, 5, 2);
  } else if (cls === "mage") {
    ctx.fillStyle = C.acc;
    ctx.fillRect(3, 5, 2, 18);
    ctx.fillRect(2, 4, 4, 4);
    ctx.fillStyle = "#fff";
    ctx.fillRect(3, 5, 2, 2);
  } else {
    ctx.fillStyle = C.acc;
    ctx.fillRect(22, 6, 2, 16);
    ctx.fillRect(24, 12, 5, 2);
  }
}
