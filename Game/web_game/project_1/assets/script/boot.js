// ═══════════════════════════════════════════════════
//  NEXUS ZERO — boot.js
//  App initialization: inject icons, start particles, auto-login
// ═══════════════════════════════════════════════════
'use strict';

function injectIcons() {
  // Class select banners
  document.getElementById('cc-icon-warrior').innerHTML = ICON.axe(52, '#ff6b35');
  document.getElementById('cc-icon-mage').innerHTML = ICON.orb(52, '#9b59b6');
  document.getElementById('cc-icon-archer').innerHTML = ICON.scope(52, '#00d4aa');

  // Hub tiles
  document.getElementById('hub-icon-play').innerHTML = ICON.swords(38, 'var(--accent)');
  document.getElementById('hub-icon-shop').innerHTML = ICON.crate(38, 'var(--teal)');
  document.getElementById('hub-icon-profile').innerHTML = ICON.helmet(38, 'var(--teal)');
  document.getElementById('hub-icon-class').innerHTML = ICON.cycle(38, 'var(--muted)');

  // Level star
  document.getElementById('level-star').innerHTML = ICON.star(14, '#ffd700');

  // HUD coins
  document.getElementById('hud-coins-icon').innerHTML = ICON.coin(14, '#ffd700');
  document.getElementById('profile-coin-icon').innerHTML = ICON.coin(18, '#ffd700');

  // Bottom nav
  document.getElementById('nav-icon-hub').innerHTML = ICON.bunker(18, 'currentColor');
  document.getElementById('nav-icon-shop').innerHTML = ICON.cart(18, 'currentColor');
  document.getElementById('nav-icon-profile').innerHTML = ICON.survivor(18, 'currentColor');

  // Pause
  document.getElementById('pause-icon').innerHTML = ICON.pause(12, 'currentColor');

  // Game over
  document.getElementById('over-skull').innerHTML = ICON.skull(42, '#e74c3c');

  // Buttons
  document.getElementById('btn-resume-icon').innerHTML = ICON.play(12, 'currentColor');
  document.getElementById('btn-hub-icon').innerHTML = ICON.bunker(12, 'currentColor');
  document.getElementById('btn-retry-icon').innerHTML = ICON.retry(12, 'currentColor');
  document.getElementById('btn-hub-icon2').innerHTML = ICON.bunker(12, 'currentColor');
}

// ── Boot sequence ──
injectIcons();
initBgParticles();
bootAuth();
