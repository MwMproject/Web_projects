// ═══════════════════════════════════════════════════
//  WaveBorn — biomes.js
//  Map biomes: visuals, obstacles, props, colors
// ═══════════════════════════════════════════════════
"use strict";

const BIOMES = {
  ruins: {
    name: "RUINES URBAINES",
    icon: "🏚",
    bgColor: "#0d1117",
    gridColor: "rgba(0,212,170,.035)",
    borderColor: "rgba(255,107,53,.25)",
    groundTiles: ["#0d1117", "#0f1319", "#0b0f14"],
    wallColor: "#1a1a2e",
    wallStroke: "#252540",
    ambientParticles: { color1: "#00d4aa22", color2: "#ff6b3522", count: 8 },
    props: [
      // Ruined buildings
      { x: 200, y: 180, w: 80, h: 45, type: "building" },
      { x: 800, y: 300, w: 100, h: 50, type: "building" },
      { x: 1600, y: 400, w: 70, h: 40, type: "building" },
      { x: 2000, y: 600, w: 90, h: 45, type: "building" },
      // Rubble
      { x: 450, y: 620, w: 42, h: 18, type: "rubble" },
      { x: 1200, y: 800, w: 52, h: 22, type: "rubble" },
      { x: 650, y: 1200, w: 72, h: 19, type: "rubble" },
      { x: 1020, y: 1400, w: 60, h: 18, type: "rubble" },
      { x: 320, y: 1000, w: 56, h: 17, type: "rubble" },
      { x: 1830, y: 1220, w: 78, h: 24, type: "rubble" },
      // Cars
      { x: 500, y: 450, w: 50, h: 25, type: "car" },
      { x: 1400, y: 900, w: 50, h: 25, type: "car" },
    ],
  },

  desert: {
    name: "DÉSERT TOXIQUE",
    icon: "☢",
    bgColor: "#1a1408",
    gridColor: "rgba(255,165,0,.03)",
    borderColor: "rgba(255,165,0,.2)",
    groundTiles: ["#1a1408", "#1c160a", "#18120a"],
    wallColor: "#2a2010",
    wallStroke: "#3a3020",
    ambientParticles: { color1: "#ff8c0022", color2: "#ffd70022", count: 12 },
    props: [
      // Rock formations
      { x: 300, y: 200, w: 70, h: 50, type: "rock" },
      { x: 900, y: 400, w: 90, h: 40, type: "rock" },
      { x: 1500, y: 300, w: 60, h: 55, type: "rock" },
      { x: 2100, y: 700, w: 80, h: 45, type: "rock" },
      { x: 600, y: 1100, w: 75, h: 35, type: "rock" },
      { x: 1800, y: 1300, w: 65, h: 50, type: "rock" },
      // Toxic pools
      { x: 500, y: 600, w: 60, h: 60, type: "toxic" },
      { x: 1200, y: 500, w: 45, h: 45, type: "toxic" },
      { x: 1700, y: 1000, w: 55, h: 55, type: "toxic" },
      // Bones/skulls
      { x: 400, y: 900, w: 30, h: 15, type: "bones" },
      { x: 1100, y: 1300, w: 25, h: 12, type: "bones" },
      { x: 2000, y: 400, w: 28, h: 14, type: "bones" },
    ],
  },

  lab: {
    name: "LABO ABANDONNÉ",
    icon: "🧪",
    bgColor: "#080d12",
    gridColor: "rgba(0,150,255,.04)",
    borderColor: "rgba(0,150,255,.25)",
    groundTiles: ["#080d12", "#0a0f14", "#070b10"],
    wallColor: "#141e28",
    wallStroke: "#1e2e3e",
    ambientParticles: { color1: "#0096ff22", color2: "#00ff8822", count: 10 },
    props: [
      // Lab tables
      { x: 250, y: 250, w: 70, h: 30, type: "table" },
      { x: 900, y: 350, w: 80, h: 30, type: "table" },
      { x: 1500, y: 600, w: 70, h: 30, type: "table" },
      { x: 600, y: 1000, w: 75, h: 30, type: "table" },
      // Tanks/vats
      { x: 450, y: 500, w: 40, h: 60, type: "tank" },
      { x: 1200, y: 400, w: 35, h: 55, type: "tank" },
      { x: 1800, y: 800, w: 40, h: 60, type: "tank" },
      { x: 800, y: 1300, w: 38, h: 58, type: "tank" },
      // Server racks
      { x: 300, y: 800, w: 25, h: 50, type: "server" },
      { x: 1600, y: 1100, w: 25, h: 50, type: "server" },
      { x: 2100, y: 500, w: 25, h: 50, type: "server" },
      // Wires
      { x: 700, y: 700, w: 80, h: 8, type: "wire" },
      { x: 1300, y: 1200, w: 90, h: 8, type: "wire" },
    ],
  },

  sewer: {
    name: "ÉGOUTS",
    icon: "🕳",
    bgColor: "#0a0d08",
    gridColor: "rgba(0,255,100,.025)",
    borderColor: "rgba(80,200,80,.2)",
    groundTiles: ["#0a0d08", "#0c0f0a", "#080b06"],
    wallColor: "#1a2018",
    wallStroke: "#2a3028",
    ambientParticles: { color1: "#00ff4422", color2: "#88aa4422", count: 6 },
    props: [
      // Pipes
      { x: 200, y: 300, w: 120, h: 20, type: "pipe" },
      { x: 800, y: 200, w: 100, h: 20, type: "pipe" },
      { x: 1400, y: 700, w: 140, h: 20, type: "pipe" },
      { x: 400, y: 1200, w: 110, h: 20, type: "pipe" },
      // Water pools
      { x: 500, y: 500, w: 70, h: 70, type: "water" },
      { x: 1100, y: 900, w: 55, h: 55, type: "water" },
      { x: 1700, y: 500, w: 60, h: 60, type: "water" },
      { x: 900, y: 1400, w: 65, h: 65, type: "water" },
      // Grates
      { x: 700, y: 400, w: 35, h: 35, type: "grate" },
      { x: 1300, y: 600, w: 35, h: 35, type: "grate" },
      { x: 1900, y: 1100, w: 35, h: 35, type: "grate" },
      // Barrels
      { x: 350, y: 700, w: 25, h: 30, type: "barrel" },
      { x: 1600, y: 300, w: 25, h: 30, type: "barrel" },
      { x: 2000, y: 900, w: 25, h: 30, type: "barrel" },
    ],
  },
};

// ═══ DRAW BIOME MAP ═══
function drawBiomeMap(biomeKey) {
  const b = BIOMES[biomeKey] || BIOMES.ruins;

  // Ground — tiled pattern
  const tileSize = 80;
  for (let x = 0; x < MAP_W; x += tileSize) {
    for (let y = 0; y < MAP_H; y += tileSize) {
      const ti =
        (((x / tileSize) | 0) + ((y / tileSize) | 0)) % b.groundTiles.length;
      ctx.fillStyle = b.groundTiles[ti];
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  // Grid
  ctx.strokeStyle = b.gridColor;
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

  // Props
  b.props.forEach((p) => drawProp(p, b));

  // Border
  ctx.strokeStyle = b.borderColor;
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, MAP_W - 6, MAP_H - 6);

  // Corner marks
  const cc = b.borderColor.replace(/[\d.]+\)/, "0.8)");
  ctx.fillStyle = cc;
  [
    [0, 0],
    [MAP_W - 10, 0],
    [0, MAP_H - 10],
    [MAP_W - 10, MAP_H - 10],
  ].forEach(([x, y]) => ctx.fillRect(x, y, 10, 10));
}

// ═══ DRAW PROPS ═══
function drawProp(p, b) {
  switch (p.type) {
    case "building":
      // Ruined building block
      ctx.fillStyle = b.wallColor;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = b.wallStroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      // Windows
      ctx.fillStyle = "#0008";
      for (let wx = p.x + 8; wx < p.x + p.w - 10; wx += 16) {
        ctx.fillRect(wx, p.y + 8, 8, 10);
      }
      // Damage cracks
      ctx.strokeStyle = b.wallStroke;
      ctx.beginPath();
      ctx.moveTo(p.x + p.w * 0.6, p.y);
      ctx.lineTo(p.x + p.w * 0.4, p.y + p.h);
      ctx.stroke();
      break;

    case "rubble":
      ctx.fillStyle = b.wallColor;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = b.wallColor + "aa";
      ctx.fillRect(p.x + 3, p.y - 4, p.w * 0.6, p.h * 0.5);
      ctx.strokeStyle = b.wallStroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      break;

    case "car":
      ctx.fillStyle = "#2a2530";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = "#35303a";
      ctx.fillRect(p.x + 5, p.y - 6, p.w - 10, 8);
      // Wheels
      ctx.fillStyle = "#111";
      ctx.fillRect(p.x + 4, p.y + p.h - 4, 10, 6);
      ctx.fillRect(p.x + p.w - 14, p.y + p.h - 4, 10, 6);
      break;

    case "rock":
      ctx.fillStyle = "#3a3025";
      ctx.beginPath();
      ctx.moveTo(p.x + p.w * 0.2, p.y + p.h);
      ctx.lineTo(p.x, p.y + p.h * 0.4);
      ctx.lineTo(p.x + p.w * 0.3, p.y);
      ctx.lineTo(p.x + p.w * 0.7, p.y);
      ctx.lineTo(p.x + p.w, p.y + p.h * 0.3);
      ctx.lineTo(p.x + p.w * 0.8, p.y + p.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#4a4035";
      ctx.lineWidth = 1;
      ctx.stroke();
      break;

    case "toxic":
      // Toxic pool — animated glow
      ctx.fillStyle = "#2a4a00";
      ctx.beginPath();
      ctx.ellipse(
        p.x + p.w / 2,
        p.y + p.h / 2,
        p.w / 2,
        p.h / 2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = "#4a8a00";
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.003 + p.x) * 0.2;
      ctx.beginPath();
      ctx.ellipse(
        p.x + p.w / 2,
        p.y + p.h / 2,
        p.w / 3,
        p.h / 3,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
      break;

    case "bones":
      ctx.fillStyle = "#8a8070";
      ctx.fillRect(p.x, p.y + p.h * 0.3, p.w, p.h * 0.4);
      ctx.fillRect(p.x + p.w * 0.3, p.y, p.w * 0.15, p.h);
      ctx.fillRect(p.x + p.w * 0.6, p.y, p.w * 0.15, p.h);
      break;

    case "table":
      ctx.fillStyle = "#1e2830";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "#2e3840";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      // Items on table
      ctx.fillStyle = "#0096ff44";
      ctx.fillRect(p.x + 8, p.y + 6, 12, 8);
      ctx.fillStyle = "#00ff8844";
      ctx.fillRect(p.x + p.w - 20, p.y + 6, 10, 10);
      break;

    case "tank":
      // Containment tank
      ctx.fillStyle = "#142028";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "#1e3040";
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      // Liquid inside
      ctx.fillStyle = "#00ff8822";
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.002 + p.x) * 0.2;
      ctx.fillRect(p.x + 4, p.y + p.h * 0.3, p.w - 8, p.h * 0.65);
      ctx.globalAlpha = 1;
      break;

    case "server":
      ctx.fillStyle = "#101820";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "#1a2830";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      // Blinking lights
      for (let ly = p.y + 6; ly < p.y + p.h - 6; ly += 8) {
        ctx.fillStyle = Math.random() > 0.5 ? "#00ff44" : "#ff4400";
        ctx.fillRect(p.x + 4, ly, 3, 3);
      }
      break;

    case "wire":
      ctx.strokeStyle = "#ffaa0044";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.bezierCurveTo(
        p.x + p.w * 0.3,
        p.y + 15,
        p.x + p.w * 0.7,
        p.y - 10,
        p.x + p.w,
        p.y,
      );
      ctx.stroke();
      // Spark
      if (Math.random() > 0.97) {
        ctx.fillStyle = "#ffff00";
        ctx.fillRect(
          p.x + p.w * 0.5 + Math.random() * 10,
          p.y - 5 + Math.random() * 10,
          3,
          3,
        );
      }
      break;

    case "pipe":
      ctx.fillStyle = "#2a3828";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "#3a4838";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      // Joints
      ctx.fillStyle = "#3a4838";
      ctx.fillRect(p.x, p.y - 3, 6, p.h + 6);
      ctx.fillRect(p.x + p.w - 6, p.y - 3, 6, p.h + 6);
      break;

    case "water":
      ctx.fillStyle = "#0a2a1a";
      ctx.beginPath();
      ctx.ellipse(
        p.x + p.w / 2,
        p.y + p.h / 2,
        p.w / 2,
        p.h / 2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = "#1a4a3a";
      ctx.globalAlpha = 0.35 + Math.sin(Date.now() * 0.002 + p.y) * 0.15;
      ctx.beginPath();
      ctx.ellipse(
        p.x + p.w / 2,
        p.y + p.h / 2,
        p.w / 3,
        p.h / 3,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
      break;

    case "grate":
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      for (let gx = p.x + 5; gx < p.x + p.w; gx += 7) {
        ctx.beginPath();
        ctx.moveTo(gx, p.y);
        ctx.lineTo(gx, p.y + p.h);
        ctx.stroke();
      }
      for (let gy = p.y + 5; gy < p.y + p.h; gy += 7) {
        ctx.beginPath();
        ctx.moveTo(p.x, gy);
        ctx.lineTo(p.x + p.w, gy);
        ctx.stroke();
      }
      break;

    case "barrel":
      ctx.fillStyle = "#3a3020";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "#4a4030";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = "#4a4030";
      ctx.fillRect(p.x, p.y + 4, p.w, 3);
      ctx.fillRect(p.x, p.y + p.h - 7, p.w, 3);
      break;
  }
}

// ═══ AMBIENT PARTICLES per biome ═══
function drawBiomeAmbient(biomeKey) {
  const b = BIOMES[biomeKey] || BIOMES.ruins;
  const t = Date.now();
  for (let i = 0; i < b.ambientParticles.count; i++) {
    const seed = i * 137.5;
    const x = ((Math.sin(t * 0.0003 + seed) + 1) / 2) * MAP_W;
    const y = ((Math.cos(t * 0.0002 + seed * 1.3) + 1) / 2) * MAP_H;
    ctx.fillStyle =
      i % 2 === 0 ? b.ambientParticles.color1 : b.ambientParticles.color2;
    ctx.beginPath();
    ctx.arc(x, y, 15 + Math.sin(t * 0.003 + seed) * 8, 0, Math.PI * 2);
    ctx.fill();
  }
}
