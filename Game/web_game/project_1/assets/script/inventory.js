// ═══════════════════════════════════════════════════
//  WaveBorn — inventory.js
//  Items database, equipment system, stats calculation
//  5 rarities: common, uncommon, rare, epic, legendary
//  6 slots: helmet, armor, boots, weapon, ring1, ring2
// ═══════════════════════════════════════════════════
"use strict";

// ═══ RARITY CONFIG ═══
const RARITY = {
  common: {
    label: "COMMUN",
    color: "#888888",
    bg: "#88888822",
    dropWeight: 50,
  },
  uncommon: {
    label: "PEU COMMUN",
    color: "#2ecc71",
    bg: "#2ecc7122",
    dropWeight: 30,
  },
  rare: { label: "RARE", color: "#3498db", bg: "#3498db22", dropWeight: 13 },
  epic: { label: "ÉPIQUE", color: "#9b59b6", bg: "#9b59b622", dropWeight: 5 },
  legendary: {
    label: "LÉGENDAIRE",
    color: "#ff9800",
    bg: "#ff980022",
    dropWeight: 2,
  },
};

const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];

// ═══ SLOT TYPES ═══
const SLOT_TYPES = {
  helmet: { label: "CASQUE", icon: "⛑" },
  armor: { label: "ARMURE", icon: "🛡" },
  boots: { label: "BOTTES", icon: "👢" },
  weapon: { label: "ARME", icon: "⚔" },
  ring1: { label: "ANNEAU", icon: "💍" },
  ring2: { label: "ANNEAU", icon: "💍" },
};

// ═══ STAT MULTIPLIERS BY RARITY ═══
const RARITY_MULT = {
  common: 1,
  uncommon: 1.4,
  rare: 1.9,
  epic: 2.6,
  legendary: 3.5,
};

// ═══ ITEMS DATABASE ═══
// Each item has base stats, rarity scales them
const ITEMS_DB = {
  // ══════════ SHARED (all classes) ══════════
  // Rings
  ring_hp: {
    name: "Anneau de Vie",
    slot: "ring",
    classes: ["warrior", "mage", "archer"],
    stats: { maxHp: 15 },
    icon: "💍",
  },
  ring_speed: {
    name: "Anneau de Vélocité",
    slot: "ring",
    classes: ["warrior", "mage", "archer"],
    stats: { speed: 0.15 },
    icon: "💍",
  },
  ring_crit: {
    name: "Anneau Critique",
    slot: "ring",
    classes: ["warrior", "mage", "archer"],
    stats: { critChance: 0.04 },
    icon: "💍",
  },
  ring_regen: {
    name: "Anneau de Régénération",
    slot: "ring",
    classes: ["warrior", "mage", "archer"],
    stats: { regen: 0.01 },
    icon: "💍",
  },
  ring_xp: {
    name: "Anneau d'Expérience",
    slot: "ring",
    classes: ["warrior", "mage", "archer"],
    stats: { xpMult: 0.1 },
    icon: "💍",
  },

  // ══════════ WARRIOR ══════════
  w_helmet_iron: {
    name: "Casque de Fer",
    slot: "helmet",
    classes: ["warrior"],
    stats: { maxHp: 10, armor: 0.02 },
    icon: "⛑",
  },
  w_helmet_steel: {
    name: "Casque d'Acier",
    slot: "helmet",
    classes: ["warrior"],
    stats: { maxHp: 18, armor: 0.04 },
    icon: "⛑",
  },
  w_helmet_skull: {
    name: "Heaume du Crâne",
    slot: "helmet",
    classes: ["warrior"],
    stats: { maxHp: 25, armor: 0.05, atkDmg: 3 },
    icon: "💀",
  },
  w_armor_leather: {
    name: "Armure de Cuir",
    slot: "armor",
    classes: ["warrior"],
    stats: { maxHp: 15, armor: 0.03 },
    icon: "🛡",
  },
  w_armor_plate: {
    name: "Armure de Plaques",
    slot: "armor",
    classes: ["warrior"],
    stats: { maxHp: 30, armor: 0.06 },
    icon: "🛡",
  },
  w_armor_titan: {
    name: "Plastron du Titan",
    slot: "armor",
    classes: ["warrior"],
    stats: { maxHp: 50, armor: 0.08, speed: -0.1 },
    icon: "🛡",
  },
  w_boots_iron: {
    name: "Bottes Ferrées",
    slot: "boots",
    classes: ["warrior"],
    stats: { speed: 0.1, armor: 0.01 },
    icon: "👢",
  },
  w_boots_charge: {
    name: "Bottes de Charge",
    slot: "boots",
    classes: ["warrior"],
    stats: { speed: 0.2, atkDmg: 2 },
    icon: "👢",
  },
  w_boots_tank: {
    name: "Bottes du Rempart",
    slot: "boots",
    classes: ["warrior"],
    stats: { maxHp: 20, armor: 0.03, speed: -0.05 },
    icon: "👢",
  },
  w_weapon_axe: {
    name: "Hache de Guerre",
    slot: "weapon",
    classes: ["warrior"],
    stats: { atkDmg: 8, atkRange: 5 },
    icon: "🪓",
  },
  w_weapon_sword: {
    name: "Épée Lourde",
    slot: "weapon",
    classes: ["warrior"],
    stats: { atkDmg: 12, atkSpeed: -20 },
    icon: "⚔",
  },
  w_weapon_mace: {
    name: "Masse d'Armes",
    slot: "weapon",
    classes: ["warrior"],
    stats: { atkDmg: 10, critChance: 0.05 },
    icon: "🔨",
  },
  w_weapon_fists: {
    name: "Poings de Fer",
    slot: "weapon",
    classes: ["warrior"],
    stats: { atkDmg: 5, atkSpeed: 50, lifesteal: 0.03 },
    icon: "🥊",
  },

  // ══════════ MAGE ══════════
  m_helmet_hood: {
    name: "Capuche Mystique",
    slot: "helmet",
    classes: ["mage"],
    stats: { maxHp: 5, atkDmg: 3 },
    icon: "🧙",
  },
  m_helmet_crown: {
    name: "Couronne Arcane",
    slot: "helmet",
    classes: ["mage"],
    stats: { atkDmg: 6, critChance: 0.03 },
    icon: "👑",
  },
  m_helmet_void: {
    name: "Masque du Vide",
    slot: "helmet",
    classes: ["mage"],
    stats: { atkDmg: 8, maxHp: -5, cdReduce: 0.05 },
    icon: "🎭",
  },
  m_armor_robe: {
    name: "Robe de Mana",
    slot: "armor",
    classes: ["mage"],
    stats: { maxHp: 10, atkDmg: 2 },
    icon: "👘",
  },
  m_armor_silk: {
    name: "Tunique de Soie",
    slot: "armor",
    classes: ["mage"],
    stats: { maxHp: 8, speed: 0.15, atkDmg: 3 },
    icon: "👘",
  },
  m_armor_arcane: {
    name: "Armure Arcanique",
    slot: "armor",
    classes: ["mage"],
    stats: { maxHp: 20, armor: 0.04, atkDmg: 5 },
    icon: "🛡",
  },
  m_boots_slippers: {
    name: "Chaussons Enchantés",
    slot: "boots",
    classes: ["mage"],
    stats: { speed: 0.25 },
    icon: "👟",
  },
  m_boots_float: {
    name: "Bottes de Lévitation",
    slot: "boots",
    classes: ["mage"],
    stats: { speed: 0.2, cdReduce: 0.03 },
    icon: "👢",
  },
  m_boots_warp: {
    name: "Bottes de Distorsion",
    slot: "boots",
    classes: ["mage"],
    stats: { speed: 0.15, atkDmg: 2, critChance: 0.02 },
    icon: "👢",
  },
  m_weapon_staff: {
    name: "Bâton Élémentaire",
    slot: "weapon",
    classes: ["mage"],
    stats: { atkDmg: 7, atkRange: 15 },
    icon: "🪄",
  },
  m_weapon_orb: {
    name: "Orbe du Chaos",
    slot: "weapon",
    classes: ["mage"],
    stats: { atkDmg: 10, critChance: 0.06 },
    icon: "🔮",
  },
  m_weapon_tome: {
    name: "Grimoire Ancien",
    slot: "weapon",
    classes: ["mage"],
    stats: { atkDmg: 6, cdReduce: 0.08, atkSpeed: 30 },
    icon: "📖",
  },

  // ══════════ ARCHER ══════════
  a_helmet_mask: {
    name: "Masque de Traqueur",
    slot: "helmet",
    classes: ["archer"],
    stats: { critChance: 0.04, speed: 0.05 },
    icon: "🎭",
  },
  a_helmet_visor: {
    name: "Visière Tactique",
    slot: "helmet",
    classes: ["archer"],
    stats: { atkRange: 20, critChance: 0.03 },
    icon: "🥽",
  },
  a_helmet_ghost: {
    name: "Capuche du Spectre",
    slot: "helmet",
    classes: ["archer"],
    stats: { speed: 0.1, atkDmg: 2, critChance: 0.02 },
    icon: "👻",
  },
  a_armor_vest: {
    name: "Gilet de Kevlar",
    slot: "armor",
    classes: ["archer"],
    stats: { maxHp: 12, armor: 0.02, speed: 0.05 },
    icon: "🦺",
  },
  a_armor_stealth: {
    name: "Combinaison Furtive",
    slot: "armor",
    classes: ["archer"],
    stats: { speed: 0.2, critChance: 0.03 },
    icon: "🥷",
  },
  a_armor_ranger: {
    name: "Armure du Ranger",
    slot: "armor",
    classes: ["archer"],
    stats: { maxHp: 20, armor: 0.03, atkDmg: 3 },
    icon: "🛡",
  },
  a_boots_swift: {
    name: "Bottes du Vent",
    slot: "boots",
    classes: ["archer"],
    stats: { speed: 0.3 },
    icon: "💨",
  },
  a_boots_hunter: {
    name: "Bottes du Chasseur",
    slot: "boots",
    classes: ["archer"],
    stats: { speed: 0.15, critChance: 0.03, atkDmg: 1 },
    icon: "👢",
  },
  a_boots_shadow: {
    name: "Bottes d'Ombre",
    slot: "boots",
    classes: ["archer"],
    stats: { speed: 0.2, cdReduce: 0.04 },
    icon: "👢",
  },
  a_weapon_bow: {
    name: "Arc Long",
    slot: "weapon",
    classes: ["archer"],
    stats: { atkDmg: 5, atkRange: 25 },
    icon: "🏹",
  },
  a_weapon_xbow: {
    name: "Arbalète Mécanique",
    slot: "weapon",
    classes: ["archer"],
    stats: { atkDmg: 9, atkSpeed: -30, critChance: 0.05 },
    icon: "🏹",
  },
  a_weapon_dual: {
    name: "Pistolets Jumeaux",
    slot: "weapon",
    classes: ["archer"],
    stats: { atkDmg: 4, atkSpeed: 60, atkRange: -15 },
    icon: "🔫",
  },
};

// ═══ CREATE ITEM INSTANCE ═══
// An "instance" is a specific item with a rolled rarity
function createItemInstance(itemId, rarity) {
  const base = ITEMS_DB[itemId];
  if (!base) return null;
  const mult = RARITY_MULT[rarity] || 1;
  const scaledStats = {};
  for (const [key, val] of Object.entries(base.stats)) {
    scaledStats[key] = Math.round(val * mult * 100) / 100;
  }
  return {
    id: itemId + "_" + Date.now() + "_" + Math.floor(Math.random() * 9999),
    baseId: itemId,
    name: base.name,
    slot: base.slot,
    classes: base.classes,
    icon: base.icon,
    rarity,
    stats: scaledStats,
  };
}

// ═══ ROLL RARITY ═══
function rollRarity(waveNum) {
  // Higher waves = better drops
  const luckBonus = Math.min(20, waveNum * 1.5);
  const weights = { ...RARITY };
  // Shift weights
  weights.common.dropWeight = Math.max(10, 50 - luckBonus);
  weights.uncommon.dropWeight = 30;
  weights.rare.dropWeight = 13 + luckBonus * 0.3;
  weights.epic.dropWeight = 5 + luckBonus * 0.2;
  weights.legendary.dropWeight = 2 + luckBonus * 0.1;

  const total = RARITY_ORDER.reduce((s, r) => s + weights[r].dropWeight, 0);
  let roll = Math.random() * total;
  for (const r of RARITY_ORDER) {
    roll -= weights[r].dropWeight;
    if (roll <= 0) return r;
  }
  return "common";
}

// ═══ ROLL ITEM DROP ═══
function rollItemDrop(playerClass, waveNum, isBoss) {
  const rarity = isBoss ? rollBossRarity(waveNum) : rollRarity(waveNum);

  // Filter items for this class
  const eligible = Object.entries(ITEMS_DB).filter(([id, item]) =>
    item.classes.includes(playerClass),
  );
  if (eligible.length === 0) return null;

  // Pick random
  const [itemId] = eligible[Math.floor(Math.random() * eligible.length)];
  return createItemInstance(itemId, rarity);
}

function rollBossRarity(waveNum) {
  // Boss always drops at least rare
  const roll = Math.random();
  if (roll < 0.05 + waveNum * 0.01) return "legendary";
  if (roll < 0.25 + waveNum * 0.02) return "epic";
  return "rare";
}

// ═══ EQUIPMENT STATE ═══
// Stored in user profile via DB
function getEquipment(email) {
  const u = DB.get(email);
  return (
    u?.equipment || {
      helmet: null,
      armor: null,
      boots: null,
      weapon: null,
      ring1: null,
      ring2: null,
    }
  );
}

function getInventory(email) {
  const u = DB.get(email);
  return u?.items || [];
}

function saveEquipment(email, equipment) {
  DB.update(email, { equipment });
}

function saveInventory(email, items) {
  DB.update(email, { items });
}

// ═══ EQUIP / UNEQUIP ═══
function equipItem(email, item) {
  const equip = getEquipment(email);
  const inv = getInventory(email);

  // Determine slot
  let slot = item.slot;
  if (slot === "ring") {
    slot = equip.ring1 === null ? "ring1" : "ring2";
  }

  // Unequip current item in that slot → back to inventory
  if (equip[slot]) {
    inv.push(equip[slot]);
  }

  // Remove from inventory
  const idx = inv.findIndex((i) => i.id === item.id);
  if (idx >= 0) inv.splice(idx, 1);

  // Equip
  equip[slot] = item;

  saveEquipment(email, equip);
  saveInventory(email, inv);
}

function unequipItem(email, slot) {
  const equip = getEquipment(email);
  const inv = getInventory(email);

  if (equip[slot]) {
    inv.push(equip[slot]);
    equip[slot] = null;
  }

  saveEquipment(email, equip);
  saveInventory(email, inv);
}

function addToInventory(email, item) {
  const inv = getInventory(email);
  inv.push(item);
  saveInventory(email, inv);
}

function removeFromInventory(email, itemId) {
  const inv = getInventory(email);
  const idx = inv.findIndex((i) => i.id === itemId);
  if (idx >= 0) inv.splice(idx, 1);
  saveInventory(email, inv);
}

// ═══ CALCULATE TOTAL EQUIPMENT STATS ═══
function calcEquipStats(email) {
  const equip = getEquipment(email);
  const totals = {
    maxHp: 0,
    armor: 0,
    speed: 0,
    atkDmg: 0,
    atkRange: 0,
    atkSpeed: 0,
    critChance: 0,
    regen: 0,
    lifesteal: 0,
    cdReduce: 0,
    xpMult: 0,
  };

  Object.values(equip).forEach((item) => {
    if (!item) return;
    for (const [key, val] of Object.entries(item.stats)) {
      if (totals[key] !== undefined) totals[key] += val;
    }
  });

  return totals;
}

// ═══ APPLY EQUIP STATS TO GAME ═══
function applyEquipStats(def, player, email) {
  const eq = calcEquipStats(email);
  player.maxHp += eq.maxHp;
  player.hp = player.maxHp;
  def.armor = (def.armor || 0) + eq.armor;
  def.speed = (def.speed || player.speed) + eq.speed;
  player.speed = def.speed;
  def.attackDmg += eq.atkDmg;
  def.attackRange += eq.atkRange;
  def.attackRate = Math.max(100, def.attackRate - eq.atkSpeed);
  player.critChance = (player.critChance || 0.05) + eq.critChance;
  def.regen = (def.regen || 0) + eq.regen;
  player.lifesteal = (player.lifesteal || 0) + eq.lifesteal;
  player.xpMult = (player.xpMult || 1) + eq.xpMult;
  // CD reduce applied to skills
  if (eq.cdReduce > 0 && G) {
    G.skills.forEach((sk) => {
      sk.cd *= 1 - eq.cdReduce;
    });
  }
}

// ═══ FORMAT STAT FOR DISPLAY ═══
function formatStat(key, val) {
  const labels = {
    maxHp: "Vie Max",
    armor: "Armure",
    speed: "Vitesse",
    atkDmg: "Attaque",
    atkRange: "Portée",
    atkSpeed: "Vit. Attaque",
    critChance: "Critique",
    regen: "Régénération",
    lifesteal: "Vol de Vie",
    cdReduce: "Réd. Cooldown",
    xpMult: "Bonus XP",
  };
  const label = labels[key] || key;
  let display;
  if (
    key === "armor" ||
    key === "critChance" ||
    key === "lifesteal" ||
    key === "cdReduce" ||
    key === "xpMult"
  ) {
    display = (val > 0 ? "+" : "") + (val * 100).toFixed(0) + "%";
  } else if (key === "speed" || key === "regen") {
    display = (val > 0 ? "+" : "") + val.toFixed(2);
  } else {
    display = (val > 0 ? "+" : "") + Math.round(val);
  }
  const isGood = val > 0;
  return { label, display, isGood };
}
