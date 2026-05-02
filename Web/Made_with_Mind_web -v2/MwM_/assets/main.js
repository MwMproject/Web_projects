/* ==========================================================
   MwM_ — main.js
   Objectif: même rendu, moins de doublons (particules unifiées)
   ========================================================== */

/* =========================
   FOOTER YEAR
========================= */
const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = String(new Date().getFullYear());

/* =========================
   SMOOTH SCROLL
========================= */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (evt) => {
    const id = (link.getAttribute("href") || "").slice(1);
    if (!id) return;

    const target = document.getElementById(id);
    if (!target) return;

    evt.preventDefault();
    const headerOffset = 70;
    const y = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  });
});

/* =========================
   SCROLL REVEAL
========================= */
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in-view");
        sectionObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".will-animate, .reveal").forEach((el) => {
  sectionObserver.observe(el);
});

/* =========================
   BURGER MENU
========================= */
const burger = document.getElementById("burger-btn");
const mobileNav = document.getElementById("mobile-nav");

if (burger && mobileNav) {
  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    mobileNav.classList.toggle("open");
  });

  mobileNav.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      burger.classList.remove("open");
      mobileNav.classList.remove("open");
    })
  );
}

/* =========================
   THEME TOGGLE
========================= */
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

// Charger le thème sauvegardé
if (localStorage.getItem("theme") === "light") root.classList.add("light-theme");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    root.classList.toggle("light-theme");
    localStorage.setItem("theme", root.classList.contains("light-theme") ? "light" : "dark");
  });
}

/* =========================
   PORTFOLIO — ZOOM OVERLAY
========================= */
const overlay = document.getElementById("zoomOverlay");
const zoomImg = document.getElementById("zoomImage");
const zoomLink = document.getElementById("zoomLink");

if (overlay && zoomImg && zoomLink) {
  document.querySelectorAll(".project-thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const imgSrc = thumb.dataset.img;
      const link = thumb.dataset.link;

      if (imgSrc) zoomImg.src = imgSrc;
      zoomLink.href = link || "#";

      overlay.classList.add("active");

      // Empêcher le scroll du body
      document.body.style.position = "fixed";
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = "100%";
      document.body.dataset.scrollY = String(window.scrollY);
    });

    thumb.addEventListener("keydown", (e) => {
      if (e.key === "Enter") thumb.click();
    });
  });

  overlay.addEventListener("click", (e) => {
    if (!e.target.closest(".zoom-content")) {
      overlay.classList.remove("active");
      zoomImg.src = "";
      zoomLink.href = "#";

      // Restaurer le scroll du body
      const y = Number(document.body.dataset.scrollY || "0");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, y);
    }
  });
}

/* =========================
   PARTICLES (UNIFIÉ)
   - Hero:    #hero-particles
   - Offres:  #offers-particles
   - Autres sections alt: .section-particles
   Objectif: même rendu que tes versions précédentes.
========================= */

/**
 * Crée un fond de particules sur un canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {{count:number, radiusMin:number, radiusMax:number, alphaMin:number, alphaMax:number, speedMin:number, speedMax:number}} cfg
 */
function startParticles(canvas, cfg) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const parent = canvas.parentElement;
  if (!parent) return;

  let particles = [];
  let rafId = 0;

  const resize = () => {
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
  };

  // Resize initial + on resize
  resize();
  window.addEventListener("resize", resize);

  class Particle {
    constructor() {
      this.reset();
    }

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
      ctx.fillStyle = `rgba(0,255,123,${this.alpha})`;
      ctx.fill();
    }
  }

  const init = () => {
    particles = Array.from({ length: cfg.count }, () => new Particle());
  };

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.update();
      p.draw();
    }
    rafId = window.requestAnimationFrame(animate);
  };

  init();
  animate();

  // (Optionnel) Retourne un cleanup si un jour tu veux désactiver.
  return () => {
    window.cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
  };
}

function initAllParticles() {
  // Hero
  startParticles(document.getElementById("hero-particles"), {
    count: 60,
    radiusMin: 1,
    radiusMax: 3,
    alphaMin: 0.1,
    alphaMax: 0.45,
    speedMin: 0.1,
    speedMax: 0.4,
  });

  // Offres
  startParticles(document.getElementById("offers-particles"), {
    count: 40,
    radiusMin: 1,
    radiusMax: 3,
    alphaMin: 0.1,
    alphaMax: 0.5,
    speedMin: 0.1,
    speedMax: 0.4,
  });

  // Sections alt additionnelles (About, FAQ, etc.)
  document.querySelectorAll(".section-particles").forEach((c) => {
    startParticles(c, {
      count: 30,
      radiusMin: 0.5,
      radiusMax: 2.5,
      alphaMin: 0.05,
      alphaMax: 0.3,
      speedMin: 0.1,
      speedMax: 0.4,
    });
  });
}

initAllParticles();
