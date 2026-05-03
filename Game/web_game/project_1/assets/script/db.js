// ═══════════════════════════════════════════════════
//  NEXUS ZERO — db.js
//  localStorage database layer
// ═══════════════════════════════════════════════════
'use strict';

const DB = {
  getUsers()    { return JSON.parse(localStorage.getItem('nz2_users') || '{}'); },
  save(u)       { localStorage.setItem('nz2_users', JSON.stringify(u)); },
  getSession()  { return JSON.parse(localStorage.getItem('nz2_session') || 'null'); },
  saveSession(s){ localStorage.setItem('nz2_session', JSON.stringify(s)); },
  clearSession(){ localStorage.removeItem('nz2_session'); },

  get(email) {
    return this.getUsers()[email] || null;
  },

  update(email, data) {
    const u = this.getUsers();
    u[email] = { ...u[email], ...data };
    this.save(u);
    const s = this.getSession();
    if (s?.email === email) this.saveSession({ ...s, ...data });
  }
};

// Default demo account
(function initDemoAccount() {
  const u = DB.getUsers();
  if (!u['demo@nexus.gg']) {
    u['demo@nexus.gg'] = {
      email: 'demo@nexus.gg',
      name: 'GHOST-X7',
      pwd: 'demo123',
      class: 'archer',
      coins: 1250,
      level: 3,
      xp: 720,
      games: 12,
      kills: 347,
      waves: 38,
      best: 4820,
      inventory: ['skin_neon_archer', 'emote_taunt']
    };
    DB.save(u);
  }
})();
