// ═══════════════════════════════════════════════════
//  NEXUS ZERO — icons.js
//  Pixel art SVG icons — post-apo style
//  Usage: ICON.sword, ICON.skull, etc. — returns SVG string
//  Sizes: s=16, m=24, l=34, xl=48
// ═══════════════════════════════════════════════════
'use strict';

const ICON = {

  // ── HUB TILES ──

  // Crossed swords — JOUER
  swords: (size=34, color='currentColor') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="2" y="2" width="2" height="2" fill="${color}"/>
    <rect x="4" y="4" width="2" height="2" fill="${color}"/>
    <rect x="6" y="6" width="2" height="2" fill="${color}"/>
    <rect x="8" y="8" width="2" height="2" fill="${color}"/>
    <rect x="10" y="10" width="2" height="2" fill="${color}"/>
    <rect x="4" y="2" width="2" height="2" fill="${color}" opacity=".5"/>
    <rect x="2" y="4" width="2" height="2" fill="${color}" opacity=".5"/>
    <rect x="12" y="2" width="2" height="2" fill="${color}"/>
    <rect x="10" y="4" width="2" height="2" fill="${color}"/>
    <rect x="8" y="6" width="2" height="2" fill="${color}"/>
    <rect x="6" y="8" width="2" height="2" fill="${color}"/>
    <rect x="4" y="10" width="2" height="2" fill="${color}"/>
    <rect x="10" y="2" width="2" height="2" fill="${color}" opacity=".5"/>
    <rect x="12" y="4" width="2" height="2" fill="${color}" opacity=".5"/>
    <rect x="6" y="12" width="4" height="2" fill="${color}" opacity=".6"/>
  </svg>`,

  // Cart/crate — BOUTIQUE
  crate: (size=34, color='currentColor') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="2" y="4" width="12" height="10" fill="${color}" opacity=".3"/>
    <rect x="2" y="4" width="12" height="2" fill="${color}"/>
    <rect x="2" y="4" width="2" height="10" fill="${color}"/>
    <rect x="12" y="4" width="2" height="10" fill="${color}"/>
    <rect x="2" y="12" width="12" height="2" fill="${color}"/>
    <rect x="7" y="6" width="2" height="6" fill="${color}" opacity=".7"/>
    <rect x="4" y="8" width="8" height="2" fill="${color}" opacity=".7"/>
    <rect x="4" y="2" width="8" height="2" fill="${color}" opacity=".5"/>
  </svg>`,

  // Helmet/skull — PROFIL
  helmet: (size=34, color='currentColor') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="4" y="2" width="8" height="2" fill="${color}"/>
    <rect x="2" y="4" width="2" height="6" fill="${color}"/>
    <rect x="12" y="4" width="2" height="6" fill="${color}"/>
    <rect x="4" y="2" width="2" height="2" fill="${color}"/>
    <rect x="10" y="2" width="2" height="2" fill="${color}"/>
    <rect x="4" y="4" width="8" height="6" fill="${color}" opacity=".25"/>
    <rect x="4" y="6" width="3" height="2" fill="${color}" opacity=".8"/>
    <rect x="9" y="6" width="3" height="2" fill="${color}" opacity=".8"/>
    <rect x="5" y="7" width="1" height="1" fill="${color}"/>
    <rect x="10" y="7" width="1" height="1" fill="${color}"/>
    <rect x="4" y="10" width="8" height="2" fill="${color}"/>
    <rect x="6" y="12" width="4" height="2" fill="${color}" opacity=".5"/>
  </svg>`,

  // Arrows cycle — CLASSE
  cycle: (size=34, color='currentColor') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="6" y="2" width="6" height="2" fill="${color}"/>
    <rect x="12" y="4" width="2" height="2" fill="${color}"/>
    <rect x="10" y="2" width="2" height="2" fill="${color}"/>
    <rect x="12" y="2" width="2" height="2" fill="${color}" opacity=".5"/>
    <rect x="12" y="6" width="2" height="4" fill="${color}" opacity=".5"/>
    <rect x="4" y="12" width="6" height="2" fill="${color}"/>
    <rect x="2" y="10" width="2" height="2" fill="${color}"/>
    <rect x="2" y="12" width="2" height="2" fill="${color}" opacity=".5"/>
    <rect x="4" y="12" width="2" height="2" fill="${color}"/>
    <rect x="2" y="6" width="2" height="4" fill="${color}" opacity=".5"/>
  </svg>`,

  // ── BOTTOM NAV ──

  // House/bunker — HUB
  bunker: (size=18, color='currentColor') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="7" y="2" width="2" height="2" fill="${color}"/>
    <rect x="5" y="4" width="6" height="2" fill="${color}"/>
    <rect x="3" y="6" width="10" height="2" fill="${color}"/>
    <rect x="3" y="8" width="2" height="6" fill="${color}"/>
    <rect x="11" y="8" width="2" height="6" fill="${color}"/>
    <rect x="3" y="12" width="10" height="2" fill="${color}"/>
    <rect x="6" y="9" width="4" height="3" fill="${color}" opacity=".5"/>
    <rect x="7" y="10" width="2" height="4" fill="${color}" opacity=".8"/>
  </svg>`,

  // Small cart — nav boutique
  cart: (size=18, color='currentColor') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="2" y="4" width="2" height="2" fill="${color}"/>
    <rect x="4" y="4" width="10" height="2" fill="${color}" opacity=".7"/>
    <rect x="4" y="6" width="8" height="4" fill="${color}" opacity=".4"/>
    <rect x="4" y="6" width="2" height="4" fill="${color}"/>
    <rect x="10" y="6" width="2" height="4" fill="${color}"/>
    <rect x="4" y="10" width="8" height="2" fill="${color}"/>
    <rect x="5" y="12" width="2" height="2" fill="${color}"/>
    <rect x="9" y="12" width="2" height="2" fill="${color}"/>
  </svg>`,

  // Small profile
  survivor: (size=18, color='currentColor') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="6" y="2" width="4" height="4" fill="${color}"/>
    <rect x="7" y="4" width="1" height="1" fill="${color}" opacity=".3"/>
    <rect x="9" y="4" width="0" height="1" fill="${color}" opacity=".3"/>
    <rect x="4" y="7" width="8" height="2" fill="${color}"/>
    <rect x="5" y="9" width="6" height="3" fill="${color}" opacity=".6"/>
    <rect x="5" y="12" width="2" height="2" fill="${color}"/>
    <rect x="9" y="12" width="2" height="2" fill="${color}"/>
    <rect x="3" y="7" width="2" height="4" fill="${color}" opacity=".5"/>
    <rect x="11" y="7" width="2" height="4" fill="${color}" opacity=".5"/>
  </svg>`,

  // ── CLASS BANNERS ──

  // War axe — WARRIOR
  axe: (size=52, color='#ff6b35') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="7" y="1" width="2" height="14" fill="${color}" opacity=".6"/>
    <rect x="3" y="2" width="4" height="2" fill="${color}"/>
    <rect x="2" y="4" width="4" height="2" fill="${color}"/>
    <rect x="2" y="6" width="4" height="2" fill="${color}"/>
    <rect x="3" y="8" width="4" height="2" fill="${color}"/>
    <rect x="9" y="2" width="4" height="2" fill="${color}"/>
    <rect x="10" y="4" width="4" height="2" fill="${color}"/>
    <rect x="10" y="6" width="4" height="2" fill="${color}"/>
    <rect x="9" y="8" width="4" height="2" fill="${color}"/>
    <rect x="6" y="13" width="4" height="2" fill="${color}" opacity=".8"/>
  </svg>`,

  // Crystal orb — MAGE
  orb: (size=52, color='#9b59b6') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="5" y="2" width="6" height="2" fill="${color}"/>
    <rect x="3" y="4" width="2" height="2" fill="${color}"/>
    <rect x="11" y="4" width="2" height="2" fill="${color}"/>
    <rect x="3" y="6" width="2" height="4" fill="${color}"/>
    <rect x="11" y="6" width="2" height="4" fill="${color}"/>
    <rect x="5" y="10" width="6" height="2" fill="${color}"/>
    <rect x="5" y="4" width="6" height="6" fill="${color}" opacity=".2"/>
    <rect x="5" y="4" width="2" height="2" fill="#fff" opacity=".4"/>
    <rect x="6" y="5" width="1" height="1" fill="#fff" opacity=".7"/>
    <rect x="7" y="12" width="2" height="2" fill="${color}" opacity=".5"/>
    <rect x="5" y="14" width="6" height="1" fill="${color}" opacity=".4"/>
  </svg>`,

  // Crosshair/scope — ARCHER
  scope: (size=52, color='#00d4aa') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="7" y="1" width="2" height="4" fill="${color}"/>
    <rect x="7" y="11" width="2" height="4" fill="${color}"/>
    <rect x="1" y="7" width="4" height="2" fill="${color}"/>
    <rect x="11" y="7" width="4" height="2" fill="${color}"/>
    <rect x="5" y="4" width="6" height="2" fill="${color}" opacity=".4"/>
    <rect x="4" y="5" width="2" height="6" fill="${color}" opacity=".4"/>
    <rect x="10" y="5" width="2" height="6" fill="${color}" opacity=".4"/>
    <rect x="5" y="10" width="6" height="2" fill="${color}" opacity=".4"/>
    <rect x="7" y="7" width="2" height="2" fill="${color}"/>
  </svg>`,

  // ── MISC ──

  // Star — LEVEL
  star: (size=14, color='#ffd700') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="7" y="1" width="2" height="2" fill="${color}"/>
    <rect x="6" y="3" width="4" height="2" fill="${color}"/>
    <rect x="2" y="5" width="12" height="2" fill="${color}"/>
    <rect x="4" y="7" width="8" height="2" fill="${color}"/>
    <rect x="3" y="9" width="4" height="2" fill="${color}"/>
    <rect x="9" y="9" width="4" height="2" fill="${color}"/>
    <rect x="2" y="11" width="2" height="2" fill="${color}"/>
    <rect x="12" y="11" width="2" height="2" fill="${color}"/>
  </svg>`,

  // Skull — GAME OVER
  skull: (size=34, color='#e74c3c') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="4" y="2" width="8" height="2" fill="${color}"/>
    <rect x="2" y="4" width="2" height="6" fill="${color}"/>
    <rect x="12" y="4" width="2" height="6" fill="${color}"/>
    <rect x="4" y="4" width="8" height="6" fill="${color}" opacity=".2"/>
    <rect x="4" y="5" width="3" height="3" fill="${color}" opacity=".7"/>
    <rect x="9" y="5" width="3" height="3" fill="${color}" opacity=".7"/>
    <rect x="5" y="6" width="1" height="1" fill="${color}"/>
    <rect x="10" y="6" width="1" height="1" fill="${color}"/>
    <rect x="7" y="8" width="2" height="2" fill="${color}" opacity=".6"/>
    <rect x="4" y="10" width="8" height="2" fill="${color}"/>
    <rect x="5" y="12" width="2" height="2" fill="${color}" opacity=".6"/>
    <rect x="9" y="12" width="2" height="2" fill="${color}" opacity=".6"/>
  </svg>`,

  // Pause bars
  pause: (size=14, color='currentColor') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="3" y="2" width="4" height="12" fill="${color}"/>
    <rect x="9" y="2" width="4" height="12" fill="${color}"/>
  </svg>`,

  // Play arrow
  play: (size=14, color='currentColor') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="4" y="2" width="2" height="12" fill="${color}"/>
    <rect x="6" y="3" width="2" height="10" fill="${color}"/>
    <rect x="8" y="4" width="2" height="8" fill="${color}"/>
    <rect x="10" y="5" width="2" height="6" fill="${color}"/>
    <rect x="12" y="6" width="2" height="4" fill="${color}"/>
  </svg>`,

  // Coin/credit
  coin: (size=14, color='#ffd700') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="5" y="2" width="6" height="2" fill="${color}"/>
    <rect x="3" y="4" width="2" height="2" fill="${color}"/>
    <rect x="11" y="4" width="2" height="2" fill="${color}"/>
    <rect x="3" y="6" width="2" height="4" fill="${color}"/>
    <rect x="11" y="6" width="2" height="4" fill="${color}"/>
    <rect x="5" y="10" width="6" height="2" fill="${color}"/>
    <rect x="5" y="4" width="6" height="6" fill="${color}" opacity=".3"/>
    <rect x="7" y="4" width="2" height="8" fill="${color}" opacity=".6"/>
    <rect x="6" y="6" width="4" height="4" fill="${color}" opacity=".4"/>
  </svg>`,

  // Retry / reload
  retry: (size=14, color='currentColor') => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <rect x="6" y="2" width="6" height="2" fill="${color}"/>
    <rect x="12" y="4" width="2" height="4" fill="${color}"/>
    <rect x="10" y="2" width="2" height="2" fill="${color}" opacity=".5"/>
    <rect x="12" y="2" width="2" height="2" fill="${color}"/>
    <rect x="10" y="8" width="4" height="2" fill="${color}"/>
    <rect x="4" y="10" width="6" height="2" fill="${color}"/>
    <rect x="2" y="6" width="2" height="4" fill="${color}"/>
    <rect x="2" y="10" width="2" height="2" fill="${color}"/>
    <rect x="4" y="12" width="2" height="2" fill="${color}" opacity=".5"/>
  </svg>`,

};
