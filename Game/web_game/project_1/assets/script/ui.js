// ═══════════════════════════════════════════════════
//  NEXUS ZERO — ui.js
//  Screens, Hub, Shop, Profile, Class selection
// ═══════════════════════════════════════════════════
'use strict';

let currentScreen = 's-auth';
let selectedClass = null;
let shopFilter = 'all';
let pendingItem = null;

// ── SHOP DATA ──
const ITEMS = [
  { id:'skin_neon_warrior', name:'SKIN NÉON RAVAGER',   type:'skin',  rarity:'epic',   price:800,  icon:'🟠', filter:'skin' },
  { id:'skin_ghost_mage',   name:'SKIN SPECTRAL HEXO',  type:'skin',  rarity:'epic',   price:800,  icon:'🟣', filter:'skin' },
  { id:'skin_neon_archer',  name:'SKIN CYBER DRIFTER',  type:'skin',  rarity:'epic',   price:800,  icon:'🟢', filter:'skin' },
  { id:'skin_gold_warrior', name:'SKIN DORÉ RAVAGER',   type:'skin',  rarity:'legend', price:1500, icon:'🌟', filter:'skin' },
  { id:'skin_void_mage',    name:'SKIN VOID HEXO',      type:'skin',  rarity:'legend', price:1500, icon:'💀', filter:'skin' },
  { id:'skin_phantom',      name:'SKIN PHANTOM DRIFTER',type:'skin',  rarity:'legend', price:1500, icon:'👻', filter:'skin' },
  { id:'effect_fire',       name:'TRAÎNÉE DE FEU',      type:'Effet', rarity:'rare',   price:400,  icon:'🔥', filter:'effect' },
  { id:'effect_ice',        name:'TRAÎNÉE DE GLACE',    type:'Effet', rarity:'rare',   price:400,  icon:'❄️', filter:'effect' },
  { id:'effect_lightning',  name:'AURA FOUDRE',         type:'Aura',  rarity:'epic',   price:900,  icon:'⚡', filter:'effect' },
  { id:'emote_taunt',       name:'EMOTE PROVOC',        type:'Emote', rarity:'common', price:200,  icon:'😈', filter:'emote' },
  { id:'emote_victory',     name:'EMOTE VICTOIRE',      type:'Emote', rarity:'rare',   price:350,  icon:'🎉', filter:'emote' },
  { id:'emote_flex',        name:'EMOTE MUSCLES',       type:'Emote', rarity:'common', price:200,  icon:'💪', filter:'emote' },
];

// ═══ SCREEN MANAGEMENT ═══
function showRaw(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  currentScreen = id;
}

function showScreen(id) {
  showRaw(id);
  const navScreens = ['s-hub', 's-shop', 's-profile'];
  const nav = document.getElementById('bottom-nav');
  if (navScreens.includes(id)) {
    nav.classList.add('visible');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const map = { 's-hub': 'nav-hub', 's-shop': 'nav-shop', 's-profile': 'nav-profile' };
    if (map[id]) document.getElementById(map[id]).classList.add('active');
  } else {
    nav.classList.remove('visible');
  }
  if (id === 's-hub') refreshHub();
  if (id === 's-shop') renderShop();
  if (id === 's-profile') refreshProfile();
}

// ═══ CLASS SELECTION ═══
function pickClass(cls) {
  selectedClass = cls;
  document.querySelectorAll('.cc').forEach(c => c.classList.remove('sel'));
  document.querySelector('.cc.' + cls).classList.add('sel');
  const btn = document.getElementById('btn-confirm');
  btn.classList.add('rdy');
  btn.textContent = '► JOUER EN TANT QUE ' + { warrior: 'RAVAGER', mage: 'HEXOMANCER', archer: 'DRIFTER' }[cls];
}

function confirmClass() {
  if (!selectedClass) return;
  DB.update(CU.email, { class: selectedClass });
  CU = DB.get(CU.email);
  showNotif('✓ Classe confirmée — bonne chasse dans la zone...');
  showScreen('s-hub');
  refreshHub();
}

function pickDifferentClass() {
  selectedClass = null;
  document.querySelectorAll('.cc').forEach(c => c.classList.remove('sel'));
  document.getElementById('btn-confirm').classList.remove('rdy');
  document.getElementById('btn-confirm').textContent = '► CONFIRMER LA CLASSE';
  showRaw('s-class');
}

// ═══ HUB ═══
function refreshHub() {
  if (!CU) return;
  const u = DB.get(CU.email);
  document.getElementById('pcard-name').textContent = u.name;
  const cls = u.class || 'warrior';
  const labels = { warrior: '⚔ RAVAGER', mage: '🔮 HEXOMANCER', archer: '🎯 DRIFTER' };
  const colors = { warrior: 'var(--warrior)', mage: 'var(--mage)', archer: 'var(--archer)' };
  const el = document.getElementById('pcard-cls');
  el.textContent = labels[cls];
  el.style.background = colors[cls];
  el.style.color = cls === 'archer' ? '#000' : '#fff';
  const lvl = u.level || 1;
  document.getElementById('pcard-level').textContent = '⭐ NIVEAU ' + lvl + ' — ' + getLevelTitle(lvl);
  const xpForNext = lvl * 1000;
  const xpPct = Math.min(100, ((u.xp || 0) / xpForNext) * 100);
  document.getElementById('xp-fill').style.width = xpPct + '%';
  document.getElementById('xp-lbl').textContent = (u.xp || 0) + ' / ' + xpForNext + ' XP';
  refreshHudTop();
  setTimeout(() => drawChar('hub-char', cls), 50);
}

function launchGame() {
  const u = DB.get(CU.email);
  if (!u.class) { showNotif('Choisis une classe d\'abord !', true); showRaw('s-class'); return; }
  startGame(u.class);
}

// ═══ SHOP ═══
function filterShop(f, el) {
  shopFilter = f;
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderShop();
}

function renderShop() {
  const u = DB.get(CU.email);
  const inv = u.inventory || [];
  const items = ITEMS.filter(i => shopFilter === 'all' || i.filter === shopFilter);
  document.getElementById('shop-grid').innerHTML = items.map(item => {
    const owned = inv.includes(item.id);
    return `<div class="shop-item${owned ? ' owned' : ''}" onclick="${owned ? '' : 'openBuyModal(\'' + item.id + '\')'}">
      <div class="item-prev">
        <span class="item-rarity r-${item.rarity}">${item.rarity.toUpperCase()}</span>
        ${item.icon}${owned ? '<span class="owned-check">✓</span>' : ''}
      </div>
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-type">${item.type}</div>
        <div class="item-price">${owned ? '✓ POSSÉDÉ' : '◆ ' + item.price}</div>
      </div>
    </div>`;
  }).join('');
}

function openBuyModal(id) {
  pendingItem = ITEMS.find(i => i.id === id);
  if (!pendingItem) return;
  document.getElementById('modal-body').textContent = pendingItem.name + ' — ' + pendingItem.type;
  document.getElementById('modal-price').textContent = '◆ ' + pendingItem.price + ' crédits';
  document.getElementById('modal-buy').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-buy').classList.remove('open');
  pendingItem = null;
}

function confirmBuy() {
  if (!pendingItem) return;
  const u = DB.get(CU.email);
  if (u.coins < pendingItem.price) { showNotif('❌ Pas assez de crédits !', true); closeModal(); return; }
  const inv = [...(u.inventory || [])];
  if (inv.includes(pendingItem.id)) { showNotif('⚠️ Déjà possédé !', true); closeModal(); return; }
  inv.push(pendingItem.id);
  DB.update(CU.email, { coins: u.coins - pendingItem.price, inventory: inv });
  CU = DB.get(CU.email);
  refreshHudTop();
  closeModal();
  renderShop();
  showNotif('✓ ' + pendingItem.name + ' acheté !');
}

// ═══ PROFILE ═══
function refreshProfile() {
  const u = DB.get(CU.email);
  document.getElementById('st-games').textContent = u.games || 0;
  document.getElementById('st-kills').textContent = u.kills || 0;
  document.getElementById('st-waves').textContent = u.waves || 0;
  document.getElementById('st-best').textContent = u.best || 0;
  document.getElementById('profile-coins').textContent = (u.coins || 0) + ' ◆';
  const inv = u.inventory || [];
  const el = document.getElementById('inv-grid');
  el.innerHTML = inv.length === 0
    ? '<span style="color:var(--muted);font-size:14px">Aucun item — visite la boutique !</span>'
    : inv.map(id => {
        const item = ITEMS.find(i => i.id === id);
        if (!item) return '';
        return `<div style="background:var(--bg);border:1px solid var(--border);padding:9px 12px;display:flex;align-items:center;gap:7px">
          <span style="font-size:20px">${item.icon}</span>
          <span style="font-family:'Press Start 2P',monospace;font-size:6px;color:var(--teal)">${item.name}</span>
        </div>`;
      }).join('');
}
