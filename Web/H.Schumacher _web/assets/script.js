/* =========================================================
   GLOBAL ELEMENTS
========================================================= */

const header = document.getElementById("header");
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
const toTopBtn = document.getElementById("toTop");
const revealElements = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll(".nav a");

/* =========================================================
   HEADER SCROLL + TOP BUTTON
========================================================= */

function handleScroll() {
  const scrollY = window.scrollY;

  if (header) {
    if (scrollY > 30) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }

  if (toTopBtn) {
    if (scrollY > 500) toTopBtn.classList.add("show");
    else toTopBtn.classList.remove("show");
  }
}

window.addEventListener("scroll", handleScroll);
handleScroll();

/* =========================================================
   MOBILE MENU
========================================================= */

if (burger && nav) {
  burger.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (e) => {
    const clickedInsideNav = nav.contains(e.target);
    const clickedBurger = burger.contains(e.target);

    if (!clickedInsideNav && !clickedBurger) {
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    }
  });
}

/* =========================================================
   SCROLL TO TOP
========================================================= */

if (toTopBtn) {
  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* =========================================================
   SCROLL REVEAL
========================================================= */

if (revealElements.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  revealElements.forEach((el) => observer.observe(el));
}

/* =========================================================
   PARTNERS CAROUSEL (SAFE)
========================================================= */

const track = document.getElementById("partnersTrack");

if (track) {
  let speed = 0.4;
  let position = 0;

  track.innerHTML += track.innerHTML;

  function animatePartners() {
    position -= speed;

    if (position <= -track.scrollWidth / 2) position = 0;

    if (window.innerWidth < 768) speed = 0.2;

    track.style.transform = `translateX(${position}px)`;

    requestAnimationFrame(animatePartners);
  }

  animatePartners();
}

/* =========================================================
   REFERENCES PAGE
========================================================= */

const modal = document.getElementById("refModal");
const closeBtn = document.getElementById("refClose");
const cards = document.querySelectorAll(".ref-card");
const filters = document.querySelectorAll(".filter");

/* ===== FILTERS ===== */

if (filters.length && cards.length) {
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const type = btn.dataset.filter;

      cards.forEach((card) => {
        if (type === "all" || card.dataset.type === type) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

/* ===== MODAL ===== */

if (cards.length && modal) {
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      document.getElementById("modalTitle").textContent = card.dataset.title;
      document.getElementById("modalContext").textContent =
        card.dataset.context;
      document.getElementById("modalSolution").textContent =
        card.dataset.solution;
      document.getElementById("modalRole").textContent = card.dataset.role;
      document.getElementById("modalResult").textContent = card.dataset.result;

      const gallery = document.getElementById("modalGallery");
      const mainImage = document.getElementById("modalMainImage");

      gallery.innerHTML = "";

      if (card.dataset.img1) {
        mainImage.src = card.dataset.img1;
        gallery.innerHTML += `<img src="${card.dataset.img1}" class="thumb">`;
      }

      if (card.dataset.img2) {
        gallery.innerHTML += `<img src="${card.dataset.img2}" class="thumb">`;
      }

      if (card.dataset.img3) {
        gallery.innerHTML += `<img src="${card.dataset.img3}" class="thumb">`;
      }

      document.querySelectorAll(".thumb").forEach((img) => {
        img.addEventListener("click", () => {
          mainImage.src = img.src;
        });
      });

      modal.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("open");
      document.body.style.overflow = "auto";
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("open");
      document.body.style.overflow = "auto";
    }
  });
}
