// ═══════════════════════════════════════════════════
//  WaveBorn — inventory-ui.js
//  Character screen: equipment slots, stats, inventory grid
// ═══════════════════════════════════════════════════
"use strict";

let invSelectedItem = null;
let invSelectedSlot = null;

// ═══ RENDER CHARACTER SCREEN ═══
function renderCharacterScreen() {
  if (!CU) return;
  const u = DB.get(CU.email);
  const cls = u.class || "warrior";
  const equip = getEquipment(CU.email);
  const inv = getInventory(CU.email);
  const eqStats = calcEquipStats(CU.email);
  const def = { ...CLASS_DEF[cls] };

  // ── Equipment slots ──
  const slotsLeft = ["helmet", "armor", "boots", "weapon"];
  const slotsRight = ["ring1", "ring2"];

  document.getElementById("eq-slots-left").innerHTML = slotsLeft
    .map((slot) => renderEquipSlot(slot, equip[slot]))
    .join("");

  document.getElementById("eq-slots-right").innerHTML = slotsRight
    .map((slot) => renderEquipSlot(slot, equip[slot]))
    .join("");

  // ── Character preview ──
  const charCanvas = document.getElementById("char-preview-canvas");
  if (charCanvas) {
    const charCtx = charCanvas.getContext("2d");
    charCtx.clearRect(0, 0, 64, 64);
    // Draw bigger character
    drawCharPreview(charCtx, cls, equip);
  }
  document.getElementById("char-class-label").textContent =
    { warrior: "⚔ RAVAGER", mage: "🔮 HEXOMANCER", archer: "🎯 DRIFTER" }[
      cls
    ] || "";
  document.getElementById("char-class-label").style.color = def.color;

  // ── Stats panel ──
  const baseHp = def.hp;
  const totalHp = baseHp + eqStats.maxHp;
  const baseAtk = def.attackDmg;
  const totalAtk = baseAtk + eqStats.atkDmg;
  const armor = ((def.armor || 0) + eqStats.armor) * 100;
  const crit = (0.05 + eqStats.critChance) * 100;
  const spd = def.speed + eqStats.speed;
  const atkSpd = (
    1000 / Math.max(100, def.attackRate - eqStats.atkSpeed)
  ).toFixed(1);

  document.getElementById("stat-health").innerHTML =
    `<span class="cs-stat-icon" style="color:#e74c3c">❤</span> Vie` +
    `<div class="cs-stat-bar"><div class="cs-stat-fill" style="width:${Math.min(100, totalHp / 3)}%;background:#e74c3c"></div></div>` +
    `<span class="cs-stat-val">${totalHp}</span>`;

  document.getElementById("stat-attack").innerHTML =
    `<span class="cs-stat-icon" style="color:#ff6b35">⚔</span> Attaque` +
    `<span class="cs-stat-val">${totalAtk}</span>`;

  document.getElementById("stat-armor").innerHTML =
    `<span class="cs-stat-icon" style="color:#7f8c8d">🛡</span> Armure` +
    `<span class="cs-stat-val">${armor.toFixed(0)}%</span>`;

  document.getElementById("stat-crit").innerHTML =
    `<span class="cs-stat-icon" style="color:#f39c12">💥</span> Critique` +
    `<span class="cs-stat-val">${crit.toFixed(0)}%</span>`;

  document.getElementById("stat-speed").innerHTML =
    `<span class="cs-stat-icon" style="color:#3498db">💨</span> Vitesse` +
    `<span class="cs-stat-val">${spd.toFixed(1)}</span>`;

  document.getElementById("stat-atkspd").innerHTML =
    `<span class="cs-stat-icon" style="color:#ffd700">⚡</span> Cadence` +
    `<span class="cs-stat-val">${atkSpd}/s</span>`;

  // ── Inventory grid ──
  renderInventoryGrid(inv, cls);

  // ── Clear tooltip ──
  hideItemTooltip();
}

// ═══ RENDER EQUIP SLOT ═══
function renderEquipSlot(slot, item) {
  const slotInfo = SLOT_TYPES[slot] ||
    SLOT_TYPES[slot.replace(/\d/, "")] || { label: slot, icon: "?" };
  const isEmpty = !item;
  const rarityColor = isEmpty
    ? "#2a2a4a"
    : RARITY[item.rarity]?.color || "#888";

  return `<div class="eq-slot ${isEmpty ? "empty" : "filled"}" style="border-color:${rarityColor}"
    onclick="${isEmpty ? "" : "unequipSlot('" + slot + "')"}"
    onmouseenter="${isEmpty ? "" : "showSlotTooltip(event, '" + slot + "')"}"
    onmouseleave="hideItemTooltip()">
    <div class="eq-slot-icon">${isEmpty ? slotInfo.icon : item.icon}</div>
    ${isEmpty ? '<div class="eq-slot-label">' + slotInfo.label + "</div>" : '<div class="eq-slot-name" style="color:' + rarityColor + '">' + item.name + "</div>"}
    ${!isEmpty ? '<div class="eq-slot-rarity" style="background:' + rarityColor + '">' + RARITY[item.rarity]?.label + "</div>" : ""}
  </div>`;
}

// ═══ RENDER INVENTORY GRID ═══
function renderInventoryGrid(inv, playerClass) {
  const grid = document.getElementById("inv-items-grid");
  if (inv.length === 0) {
    grid.innerHTML =
      '<div class="inv-empty">Pas d\'objets. Tue des ennemis pour en obtenir !</div>';
    return;
  }

  // Sort by rarity (best first)
  const sorted = [...inv].sort(
    (a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity),
  );

  grid.innerHTML = sorted
    .map((item) => {
      const rc = RARITY[item.rarity]?.color || "#888";
      const canEquip = item.classes.includes(playerClass);
      return `<div class="inv-item ${canEquip ? "" : "wrong-class"}" style="border-color:${rc}"
      onclick="${canEquip ? "equipFromInv('" + item.id + "')" : ""}"
      onmouseenter="showItemTooltip(event, '${item.id}')"
      onmouseleave="hideItemTooltip()">
      <div class="inv-item-icon">${item.icon}</div>
      <div class="inv-item-rarity" style="background:${rc}"></div>
      ${!canEquip ? '<div class="inv-item-lock">✕</div>' : ""}
    </div>`;
    })
    .join("");
}

// ═══ EQUIP FROM INVENTORY ═══
function equipFromInv(itemId) {
  if (!CU) return;
  const inv = getInventory(CU.email);
  const item = inv.find((i) => i.id === itemId);
  if (!item) return;
  equipItem(CU.email, item);
  renderCharacterScreen();
  showNotif("✓ " + item.name + " équipé !");
}

// ═══ UNEQUIP SLOT ═══
function unequipSlot(slot) {
  if (!CU) return;
  const equip = getEquipment(CU.email);
  if (!equip[slot]) return;
  const name = equip[slot].name;
  unequipItem(CU.email, slot);
  renderCharacterScreen();
  showNotif("↩ " + name + " déséquipé");
}

// ═══ SELL ITEM ═══
function sellItem(itemId) {
  if (!CU) return;
  const inv = getInventory(CU.email);
  const item = inv.find((i) => i.id === itemId);
  if (!item) return;

  const prices = {
    common: 5,
    uncommon: 15,
    rare: 40,
    epic: 100,
    legendary: 300,
  };
  const price = prices[item.rarity] || 5;

  removeFromInventory(CU.email, itemId);
  const u = DB.get(CU.email);
  DB.update(CU.email, { coins: (u.coins || 0) + price });
  refreshHudTop();
  renderCharacterScreen();
  showNotif("💰 " + item.name + " vendu pour " + price + " ◆");
}

// ═══ TOOLTIPS ═══
function showItemTooltip(event, itemId) {
  const inv = getInventory(CU.email);
  const item = inv.find((i) => i.id === itemId);
  if (!item) return;
  showTooltipForItem(event, item);
}

function showSlotTooltip(event, slot) {
  const equip = getEquipment(CU.email);
  const item = equip[slot];
  if (!item) return;
  showTooltipForItem(event, item, true);
}

function showTooltipForItem(event, item, isEquipped) {
  const tip = document.getElementById("item-tooltip");
  const rc = RARITY[item.rarity]?.color || "#888";

  let statsHtml = Object.entries(item.stats)
    .map(([k, v]) => {
      const f = formatStat(k, v);
      return `<div class="tt-stat ${f.isGood ? "good" : "bad"}">${f.label}: <strong>${f.display}</strong></div>`;
    })
    .join("");

  tip.innerHTML = `
    <div class="tt-name" style="color:${rc}">${item.icon} ${item.name}</div>
    <div class="tt-rarity" style="color:${rc}">${RARITY[item.rarity]?.label}</div>
    <div class="tt-slot">${SLOT_TYPES[item.slot]?.label || (item.slot === "ring" ? "ANNEAU" : item.slot)}</div>
    <div class="tt-stats">${statsHtml}</div>
    <div class="tt-action">${isEquipped ? "Clic pour déséquiper" : "Clic pour équiper · Clic droit pour vendre"}</div>
  `;
  tip.style.display = "block";

  // Position
  const rect = tip.getBoundingClientRect();
  const x = Math.min(event.clientX + 10, window.innerWidth - rect.width - 10);
  const y = Math.min(event.clientY - 10, window.innerHeight - rect.height - 10);
  tip.style.left = x + "px";
  tip.style.top = y + "px";
}

function hideItemTooltip() {
  document.getElementById("item-tooltip").style.display = "none";
}

// ═══ RIGHT-CLICK TO SELL ═══
document.addEventListener("contextmenu", (e) => {
  const invItem = e.target.closest(".inv-item");
  if (invItem && currentScreen === "s-character") {
    e.preventDefault();
    const id = invItem.getAttribute("onmouseenter")?.match(/'([^']+)'/)?.[1];
    if (id) sellItem(id);
  }
});

// ═══ DRAW CHARACTER PREVIEW ═══
function drawCharPreview(ctx, cls, equip) {
  ctx.imageSmoothingEnabled = false;
  // Base character (bigger version)
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

  const s = 4; // pixel size

  // Head
  ctx.fillStyle = C.head;
  ctx.fillRect(5 * s, 1 * s, 6 * s, 5 * s);
  // Eyes
  ctx.fillStyle = "#333";
  ctx.fillRect(6 * s, 3 * s, s, s);
  ctx.fillRect(9 * s, 3 * s, s, s);
  // Body
  ctx.fillStyle = equip.armor
    ? RARITY[equip.armor.rarity]?.color || C.body
    : C.body;
  ctx.fillRect(4 * s, 6 * s, 8 * s, 5 * s);
  // Arms
  ctx.fillStyle = C.body;
  ctx.fillRect(2 * s, 6 * s, 2 * s, 5 * s);
  ctx.fillRect(12 * s, 6 * s, 2 * s, 5 * s);
  // Legs
  ctx.fillStyle = equip.boots
    ? RARITY[equip.boots.rarity]?.color || C.dark
    : C.dark;
  ctx.fillRect(5 * s, 11 * s, 3 * s, 4 * s);
  ctx.fillRect(9 * s, 11 * s, 3 * s, 4 * s);
  // Helmet
  if (equip.helmet) {
    ctx.fillStyle = RARITY[equip.helmet.rarity]?.color || "#888";
    ctx.fillRect(4 * s, 0, 8 * s, 2 * s);
    ctx.fillRect(4 * s, 1 * s, s, 3 * s);
    ctx.fillRect(11 * s, 1 * s, s, 3 * s);
  }
  // Weapon
  if (equip.weapon) {
    ctx.fillStyle = RARITY[equip.weapon.rarity]?.color || C.acc;
    ctx.fillRect(1 * s, 4 * s, s, 9 * s);
    ctx.fillRect(0, 4 * s, 3 * s, s);
  } else {
    ctx.fillStyle = C.acc;
    ctx.fillRect(1 * s, 6 * s, s, 6 * s);
  }
  // Rings glow
  if (equip.ring1) {
    ctx.fillStyle = RARITY[equip.ring1.rarity]?.color + "88" || "#88888888";
    ctx.fillRect(2 * s, 10 * s, 2 * s, s);
  }
  if (equip.ring2) {
    ctx.fillStyle = RARITY[equip.ring2.rarity]?.color + "88" || "#88888888";
    ctx.fillRect(12 * s, 10 * s, 2 * s, s);
  }
}
