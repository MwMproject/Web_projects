/* ==========================================================
   MwM 2.0 — main.js
========================================================== */

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
    // Close mobile nav if open
    burger?.classList.remove('open');
    mobileNav?.classList.remove('open');
  });
});

// Reveal on scroll
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal-el').forEach(el => revealObserver.observe(el));

// Burger menu
const burger = document.getElementById('burger-btn');
const mobileNav = document.getElementById('mobile-nav');

if (burger && mobileNav) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });
}

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
if (localStorage.getItem('theme') === 'light') document.documentElement.classList.add('light-theme');

themeToggle?.addEventListener('click', () => {
  document.documentElement.classList.toggle('light-theme');
  localStorage.setItem('theme', document.documentElement.classList.contains('light-theme') ? 'light' : 'dark');
});

// Portfolio filtering
const tabBtns = document.querySelectorAll('.tab-btn');
const projectCards = document.querySelectorAll('.project-card');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;

    projectCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.classList.remove('hidden');
        card.style.animation = 'fadeInUp 0.5s var(--ease-out) both';
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// Zoom overlay
const overlay = document.getElementById('zoomOverlay');
const zoomImg = document.getElementById('zoomImage');
const zoomLink = document.getElementById('zoomLink');

if (overlay && zoomImg && zoomLink) {
  document.querySelectorAll('.project-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const imgSrc = thumb.dataset.img;
      const link = thumb.dataset.link;
      if (imgSrc) zoomImg.src = imgSrc;
      zoomLink.href = link || '#';
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  overlay.addEventListener('click', e => {
    if (!e.target.closest('.zoom-content')) {
      overlay.classList.remove('active');
      zoomImg.src = '';
      zoomLink.href = '#';
      document.body.style.overflow = '';
    }
  });
}

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    // Close all
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    // Toggle clicked
    if (!wasOpen) item.classList.add('open');
  });
});

/* =========================
   PARTICLES
========================= */
function startParticles(canvas, cfg) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const parent = canvas.parentElement;
  if (!parent) return;

  let particles = [];

  const resize = () => {
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.radius = Math.random() * (cfg.radiusMax - cfg.radiusMin) + cfg.radiusMin;
      this.speedY = Math.random() * (cfg.speedMax - cfg.speedMin) + cfg.speedMin;
      this.alpha = Math.random() * (cfg.alphaMax - cfg.alphaMin) + cfg.alphaMin;
    }
    update() {
      this.y -= this.speedY;
      if (this.y < -10) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,232,123,${this.alpha})`;
      ctx.fill();
    }
  }

  particles = Array.from({ length: cfg.count }, () => new Particle());

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) { p.update(); p.draw(); }
    requestAnimationFrame(animate);
  };
  animate();
}

// Hero particles
startParticles(document.getElementById('hero-particles'), {
  count: 60, radiusMin: 1, radiusMax: 3,
  alphaMin: 0.1, alphaMax: 0.45,
  speedMin: 0.1, speedMax: 0.4,
});

// Offers particles
startParticles(document.getElementById('offers-particles'), {
  count: 40, radiusMin: 1, radiusMax: 3,
  alphaMin: 0.1, alphaMax: 0.5,
  speedMin: 0.1, speedMax: 0.4,
});