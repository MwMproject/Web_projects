// ═══════════════════════════════════════════════════
//  WaveBorn — loot.js
//  Loot drops, pickup logic, buff management
// ═══════════════════════════════════════════════════
"use strict";

// ═══ LOOT TYPES ═══
const LOOT_TYPES = {
  heal: {
    icon: "+",
    color: "#2ecc71",
    glowColor: "#2ecc7155",
    size: 8,
    duration: 0, // instant
    rarity: 0.35, // 35% drop chance
    apply(p) {
      const amount = p.maxHp * 0.2;
      p.hp = Math.min(p.maxHp, p.hp + amount);
      spawnFX(p.x, p.y, "#2ecc71", 12);
      showLootText(p.x, p.y - 20, "+" + (amount | 0) + " HP", "#2ecc71");
    },
  },
  speed: {
    icon: "»",
    color: "#3498db",
    glowColor: "#3498db55",
    size: 7,
    duration: 8000,
    rarity: 0.15,
    apply(p) {
      p.buffSpeed = true;
      p.buffSpeedTimer = 8000;
      spawnFX(p.x, p.y, "#3498db", 10);
      showLootText(p.x, p.y - 20, "VITESSE +50%", "#3498db");
    },
  },
  damage: {
    icon: "!",
    color: "#e74c3c",
    glowColor: "#e74c3c55",
    size: 7,
    duration: 6000,
    rarity: 0.12,
    apply(p) {
      p.buffDamage = true;
      p.buffDamageTimer = 6000;
      spawnFX(p.x, p.y, "#e74c3c", 10);
      showLootText(p.x, p.y - 20, "DÉGÂTS x2", "#e74c3c");
    },
  },
  magnet: {
    icon: "@",
    color: "#9b59b6",
    glowColor: "#9b59b655",
    size: 7,
    duration: 10000,
    rarity: 0.08,
    apply(p) {
      p.buffMagnet = true;
      p.buffMagnetTimer = 10000;
      spawnFX(p.x, p.y, "#9b59b6", 10);
      showLootText(p.x, p.y - 20, "AIMANT", "#9b59b6");
    },
  },
  xp: {
    icon: "★",
    color: "#ffd700",
    glowColor: "#ffd70044",
    size: 5,
    duration: 0,
    rarity: 0.8, // very common — most enemies drop this
    apply(p) {
      const pts = 5 + G.wave * 2;
      G.score += pts;
      showLootText(p.x, p.y - 20, "+" + pts, "#ffd700");
    },
  },
  credit: {
    icon: "◆",
    color: "#f1c40f",
    glowColor: "#f1c40f55",
    size: 6,
    duration: 0,
    rarity: 0.05, // rare
    apply(p) {
      G.bonusCredits = (G.bonusCredits || 0) + 10;
      spawnFX(p.x, p.y, "#f1c40f", 15);
      showLootText(p.x, p.y - 20, "+10 ◆", "#f1c40f");
    },
  },
};

// ═══ DROP LOOT FROM ENEMY ═══
function dropLoot(x, y, isBoss) {
  if (!G) return;

  // XP orb — almost always drops
  if (Math.random() < LOOT_TYPES.xp.rarity) {
    spawnLootItem(x, y, "xp");
  }

  // Other drops — roll each type
  const types = ["heal", "speed", "damage", "magnet", "credit"];
  const bonusMult = isBoss ? 3 : 1; // boss drops 3x more

  types.forEach((type) => {
    const chance = LOOT_TYPES[type].rarity * bonusMult;
    if (Math.random() < chance) {
      // Slight random offset so items don't stack
      const ox = (Math.random() - 0.5) * 30;
      const oy = (Math.random() - 0.5) * 30;
      spawnLootItem(x + ox, y + oy, type);
    }
  });

  // Boss guaranteed drops: 1 heal + 1 random power + 2 credits
  if (isBoss) {
    spawnLootItem(x - 20, y, "heal");
    spawnLootItem(x + 20, y, "credit");
    spawnLootItem(x, y - 20, "credit");
    const powers = ["speed", "damage", "magnet"];
    spawnLootItem(x, y + 20, powers[Math.floor(Math.random() * powers.length)]);
  }
}

function spawnLootItem(x, y, type) {
  G.loots.push({
    x,
    y,
    type,
    life: 12000, // despawn after 12s
    bobOffset: Math.random() * Math.PI * 2, // for floating animation
    pickupDelay: 300, // can't pick up immediately (avoids instant grab)
  });
}

// ═══ UPDATE LOOTS ═══
function updateLoots(dt) {
  const p = G.player;
  const magnetRange = p.buffMagnet ? 250 : p.magnetRange || 50;

  G.loots.forEach((l) => {
    l.life -= dt;
    if (l.pickupDelay > 0) l.pickupDelay -= dt;

    // Magnet pull: attract towards player
    if (l.pickupDelay <= 0) {
      const d = vdist(l, p);
      if (d < magnetRange && d > 5) {
        const pull = p.buffMagnet ? 4 : 1.5;
        const angle = Math.atan2(p.y - l.y, p.x - l.x);
        l.x += Math.cos(angle) * pull;
        l.y += Math.sin(angle) * pull;
      }

      // Pickup
      if (d < 22) {
        const lootDef = LOOT_TYPES[l.type];
        if (lootDef) lootDef.apply(p);
        l.life = 0; // remove
      }
    }
  });

  G.loots = G.loots.filter((l) => l.life > 0);
}

// ═══ UPDATE BUFFS ═══
function updateBuffs(dt) {
  const p = G.player;

  // Speed buff
  if (p.buffSpeed) {
    p.buffSpeedTimer -= dt;
    if (p.buffSpeedTimer <= 0) {
      p.buffSpeed = false;
    }
  }

  // Damage buff
  if (p.buffDamage) {
    p.buffDamageTimer -= dt;
    if (p.buffDamageTimer <= 0) {
      p.buffDamage = false;
    }
  }

  // Magnet buff
  if (p.buffMagnet) {
    p.buffMagnetTimer -= dt;
    if (p.buffMagnetTimer <= 0) {
      p.buffMagnet = false;
    }
  }
}

// ═══ RENDER LOOTS ═══
function drawLoots() {
  const now = Date.now();
  G.loots.forEach((l) => {
    const def = LOOT_TYPES[l.type];
    if (!def) return;

    // Floating bob animation
    const bob = Math.sin(now * 0.004 + l.bobOffset) * 3;
    const lx = l.x,
      ly = l.y + bob;

    // Despawn blink when < 3s left
    if (l.life < 3000 && Math.floor(l.life / 150) % 2 === 0) return;

    // Glow
    ctx.fillStyle = def.glowColor;
    ctx.beginPath();
    ctx.arc(lx, ly, def.size + 6, 0, Math.PI * 2);
    ctx.fill();

    // Item body (pixel square)
    ctx.fillStyle = def.color;
    const s = def.size;
    ctx.fillRect(lx - s, ly - s, s * 2, s * 2);

    // Inner icon
    ctx.fillStyle = "#fff";
    ctx.font = "bold " + (s + 2) + "px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.icon, lx, ly + 1);
  });
}

// ═══ RENDER BUFF INDICATORS ═══
function drawBuffBar() {
  const p = G.player;
  const buffs = [];
  if (p.buffSpeed)
    buffs.push({
      label: "VITESSE",
      color: "#3498db",
      pct: p.buffSpeedTimer / 8000,
    });
  if (p.buffDamage)
    buffs.push({
      label: "DÉGÂTS",
      color: "#e74c3c",
      pct: p.buffDamageTimer / 6000,
    });
  if (p.buffMagnet)
    buffs.push({
      label: "AIMANT",
      color: "#9b59b6",
      pct: p.buffMagnetTimer / 10000,
    });

  if (buffs.length === 0) return;

  // Draw above skills bar, bottom center
  const startX = canvas.width / 2 - (buffs.length * 72) / 2;
  const y = canvas.height - 82;

  buffs.forEach((b, i) => {
    const x = startX + i * 72;
    // Background
    ctx.fillStyle = "rgba(12,12,20,.85)";
    ctx.fillRect(x, y, 66, 14);
    // Timer bar
    ctx.fillStyle = b.color;
    ctx.fillRect(x + 1, y + 1, 64 * b.pct, 12);
    // Label
    ctx.fillStyle = "#fff";
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.fillText(b.label, x + 33, y + 10);
  });
}

// ═══ FLOATING TEXT ═══
function showLootText(x, y, text, color) {
  if (!G) return;
  G.lootTexts.push({
    x,
    y,
    text,
    color,
    life: 1200,
    maxLife: 1200,
    vy: -1.2,
  });
}

function updateLootTexts(dt) {
  G.lootTexts.forEach((t) => {
    t.life -= dt;
    t.y += t.vy;
    t.vy *= 0.98;
  });
  G.lootTexts = G.lootTexts.filter((t) => t.life > 0);
}

function drawLootTexts() {
  G.lootTexts.forEach((t) => {
    const alpha = Math.min(1, t.life / (t.maxLife * 0.4));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.color;
    ctx.font = 'bold 11px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.fillText(t.text, t.x, t.y);
  });
  ctx.globalAlpha = 1;
}
