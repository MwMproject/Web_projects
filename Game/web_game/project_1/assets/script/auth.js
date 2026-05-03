// ═══════════════════════════════════════════════════
//  NEXUS ZERO — auth.js
//  Login, registration, session management
// ═══════════════════════════════════════════════════
'use strict';

let CU = null; // current user

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) =>
    t.classList.toggle('active', (tab === 'login' ? 0 : 1) === i)
  );
  document.getElementById('form-login').classList.toggle('active', tab === 'login');
  document.getElementById('form-register').classList.toggle('active', tab === 'register');
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pwd   = document.getElementById('login-pwd').value;
  const err   = document.getElementById('login-err');
  err.textContent = '';

  if (!email || !pwd) { err.textContent = '▸ REMPLIS TOUS LES CHAMPS'; return; }
  const user = DB.get(email);
  if (!user || user.pwd !== pwd) { err.textContent = '▸ EMAIL OU MOT DE PASSE INCORRECT'; return; }

  DB.saveSession(user);
  CU = user;
  afterLogin();
}

function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const pwd   = document.getElementById('reg-pwd').value;
  const err   = document.getElementById('reg-err');
  err.textContent = '';

  if (!name || !email || !pwd) { err.textContent = '▸ REMPLIS TOUS LES CHAMPS'; return; }
  if (pwd.length < 6) { err.textContent = '▸ MOT DE PASSE TROP COURT (6 MIN)'; return; }
  if (!/\S+@\S+\.\S+/.test(email)) { err.textContent = '▸ EMAIL INVALIDE'; return; }
  if (DB.get(email)) { err.textContent = '▸ EMAIL DÉJÀ UTILISÉ'; return; }

  const newUser = {
    email, name: name.toUpperCase(), pwd, class: null,
    coins: 500, level: 1, xp: 0,
    games: 0, kills: 0, waves: 0, best: 0,
    inventory: []
  };
  const users = DB.getUsers();
  users[email] = newUser;
  DB.save(users);
  DB.saveSession(newUser);
  CU = newUser;
  afterLogin();
  showNotif('🎉 Bienvenue ' + newUser.name + ' ! +500 crédits de départ !');
}

function afterLogin() {
  document.getElementById('hud').style.display = 'flex';
  refreshHudTop();
  if (!CU.class) showScreen('s-class');
  else { showScreen('s-hub'); refreshHub(); }
}

function doLogout() {
  DB.clearSession();
  CU = null;
  selectedClass = null;
  document.getElementById('hud').style.display = 'none';
  document.getElementById('bottom-nav').classList.remove('visible');
  stopGame();
  showRaw('s-auth');
}

function refreshHudTop() {
  const u = DB.get(CU.email);
  document.getElementById('hud-user').textContent = u.name;
  document.getElementById('hud-coins').textContent = u.coins;
}

// ── BOOT: auto-login if session exists ──
function bootAuth() {
  const session = DB.getSession();
  if (session) { CU = session; afterLogin(); }
}
