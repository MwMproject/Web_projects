// ═══════════════════════════════════════════════════
//  WaveBorn — levelup.js
//  In-game leveling: XP, level-up choices, upgrade pool
// ═══════════════════════════════════════════════════
"use strict";

// ═══ XP CONFIG ═══
function xpForLevel(level) {
  return 40 + level * 25; // 65, 90, 115, 140...
}

// ═══ UPGRADE POOL ═══
const UPGRADES = [
  // ── OFFENSIVE ──
  {
    id: "atk_up",
    name: "DÉGÂTS +15%",
    icon: "⚔",
    color: "#e74c3c",
    cat: "offense",
    apply(p, def) {
      def.attackDmg *= 1.15;
    },
  },
  {
    id: "atk_speed",
    name: "CADENCE +12%",
    icon: "⚡",
    color: "#f39c12",
    cat: "offense",
    apply(p, def) {
      def.attackRate *= 0.88;
    },
  },
  {
    id: "crit_dmg",
    name: "CRIT CHANCE",
    icon: "💥",
    color: "#ff6b35",
    cat: "offense",
    apply(p) {
      p.critChance = Math.min(0.6, (p.critChance || 0.05) + 0.1);
    },
  },
  {
    id: "range_up",
    name: "PORTÉE +20%",
    icon: "🎯",
    color: "#3498db",
    cat: "offense",
    apply(p, def) {
      def.attackRange *= 1.2;
    },
  },
  {
    id: "proj_speed",
    name: "VIT. PROJECTILE +20%",
    icon: "→",
    color: "#00d4aa",
    cat: "offense",
    apply(p, def) {
      if (def.projSpeed > 0) def.projSpeed *= 1.2;
    },
  },

  // ── DEFENSIVE ──
  {
    id: "hp_up",
    name: "VIE MAX +25",
    icon: "❤",
    color: "#2ecc71",
    cat: "defense",
    apply(p) {
      p.maxHp += 25;
      p.hp += 25;
    },
  },
  {
    id: "armor_up",
    name: "ARMURE +8%",
    icon: "🛡",
    color: "#7f8c8d",
    cat: "defense",
    apply(p, def) {
      def.armor = Math.min(0.6, (def.armor || 0) + 0.08);
    },
  },
  {
    id: "regen_up",
    name: "RÉGÉNÉRATION +",
    icon: "💚",
    color: "#27ae60",
    cat: "defense",
    apply(p, def) {
      def.regen = (def.regen || 0) + 0.015;
    },
  },
  {
    id: "heal_now",
    name: "SOIN COMPLET",
    icon: "✚",
    color: "#2ecc71",
    cat: "defense",
    apply(p) {
      p.hp = p.maxHp;
    },
  },

  // ── UTILITY ──
  {
    id: "speed_up",
    name: "VITESSE +10%",
    icon: "💨",
    color: "#3498db",
    cat: "utility",
    apply(p, def) {
      def.speed = (def.speed || p.speed) * 1.1;
      p.speed = def.speed;
    },
  },
  {
    id: "cd_reduce",
    name: "COOLDOWNS -15%",
    icon: "⏱",
    color: "#9b59b6",
    cat: "utility",
    apply(p, def) {
      G.skills.forEach((sk) => (sk.cd *= 0.85));
    },
  },
  {
    id: "magnet_up",
    name: "AIMANT PERMANENT",
    icon: "🧲",
    color: "#9b59b6",
    cat: "utility",
    apply(p) {
      p.magnetRange = (p.magnetRange || 50) + 60;
    },
  },
  {
    id: "xp_up",
    name: "XP BONUS +30%",
    icon: "⭐",
    color: "#ffd700",
    cat: "utility",
    apply(p) {
      p.xpMult = (p.xpMult || 1) + 0.3;
    },
  },

  // ── SPECIAL (rarer, powerful) ──
  {
    id: "lifesteal",
    name: "VOL DE VIE +5%",
    icon: "🩸",
    color: "#c0392b",
    cat: "special",
    apply(p) {
      p.lifesteal = Math.min(0.2, (p.lifesteal || 0) + 0.05);
    },
  },
  {
    id: "thorns",
    name: "ÉPINES (riposte)",
    icon: "🌵",
    color: "#e67e22",
    cat: "special",
    apply(p) {
      p.thorns = (p.thorns || 0) + 8;
    },
  },
  {
    id: "explode",
    name: "KILLS EXPLOSIFS",
    icon: "💣",
    color: "#ff3366",
    cat: "special",
    apply(p) {
      p.explodeOnKill = true;
      p.explodeRadius = (p.explodeRadius || 50) + 15;
      p.explodeDmg = (p.explodeDmg || 15) + 10;
    },
  },
];

// ═══ GAIN XP ═══
function gainXP(amount) {
  if (!G || G.gameOver) return;
  const p = G.player;
  const mult = p.xpMult || 1;
  G.inGameXP += amount * mult;

  // Check level up
  const needed = xpForLevel(G.inGameLevel);
  if (G.inGameXP >= needed) {
    G.inGameXP -= needed;
    G.inGameLevel++;
    triggerLevelUp();
  }
}

// ═══ TRIGGER LEVEL UP ═══
function triggerLevelUp() {
  G.levelUpPending = true;
  G.paused = true;

  // Pick 3 random upgrades (no duplicates this round)
  const pool = [...UPGRADES];
  const choices = [];
  while (choices.length < 3 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    choices.push(pool.splice(idx, 1)[0]);
  }
  G.levelUpChoices = choices;

  // Show level-up UI
  showLevelUpUI(choices);
}

// ═══ SHOW LEVEL-UP UI ═══
function showLevelUpUI(choices) {
  const overlay = document.getElementById("levelup-overlay");
  const grid = document.getElementById("levelup-grid");
  const lvlText = document.getElementById("levelup-level");

  lvlText.textContent = "NIVEAU " + G.inGameLevel;

  grid.innerHTML = choices
    .map(
      (c, i) => `
    <div class="lu-card" onclick="pickUpgrade(${i})" style="border-color:${c.color}">
      <div class="lu-icon" style="color:${c.color}">${c.icon}</div>
      <div class="lu-name" style="color:${c.color}">${c.name}</div>
      <div class="lu-cat">${c.cat.toUpperCase()}</div>
      <div class="lu-key">${i + 1}</div>
    </div>
  `,
    )
    .join("");

  overlay.classList.add("open");

  // Pause game HUD
  document.getElementById("game-hud").classList.remove("visible");
  document.getElementById("skills-bar").classList.remove("visible");
}

// ═══ PICK UPGRADE ═══
function pickUpgrade(index) {
  if (!G || !G.levelUpPending) return;
  const choice = G.levelUpChoices[index];
  if (!choice) return;

  // Apply upgrade
  choice.apply(G.player, G.def);

  // Track applied upgrades
  G.appliedUpgrades.push(choice.id);

  // FX
  spawnFX(G.player.x, G.player.y, choice.color, 30);
  screenShake(4, 200);
  G.levelUpFlash = 800;
  announceWave("⬆ " + choice.name);

  // Close UI, resume
  document.getElementById("levelup-overlay").classList.remove("open");
  document.getElementById("game-hud").classList.add("visible");
  document.getElementById("skills-bar").classList.add("visible");

  G.levelUpPending = false;
  G.paused = false;
}

// ═══ XP BAR (in-game HUD) ═══
function updateXPBar() {
  if (!G) return;
  const needed = xpForLevel(G.inGameLevel);
  const pct = Math.min(100, (G.inGameXP / needed) * 100);
  const bar = document.getElementById("xp-game-fill");
  const txt = document.getElementById("xp-game-txt");
  if (bar) bar.style.width = pct + "%";
  if (txt) txt.textContent = "LV" + G.inGameLevel;
}

// ═══ KEYBOARD SHORTCUT for level-up choices ═══
document.addEventListener("keydown", (e) => {
  if (G && G.levelUpPending) {
    if (e.key === "1") pickUpgrade(0);
    if (e.key === "2") pickUpgrade(1);
    if (e.key === "3") pickUpgrade(2);
  }
});
