const header = document.getElementById("header");
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
const toTopBtn = document.getElementById("toTop");
const revealElements = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll(".nav a");

/* Header scroll + bouton top */
function handleScroll() {
  const scrollY = window.scrollY;

  if (scrollY > 30) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }

  if (scrollY > 500) {
    toTopBtn.classList.add("show");
  } else {
    toTopBtn.classList.remove("show");
  }
}

window.addEventListener("scroll", handleScroll);
handleScroll();

/* Menu mobile */
burger.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

/* Fermer menu au clic sur un lien */
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  });
});

/* Fermer menu si on clique hors menu */
document.addEventListener("click", (e) => {
  const clickedInsideNav = nav.contains(e.target);
  const clickedBurger = burger.contains(e.target);

  if (!clickedInsideNav && !clickedBurger) {
    nav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }
});

/* Scroll to top */
toTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

/* Animations d'apparition */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
  },
);

revealElements.forEach((element) => {
  observer.observe(element);
});

/* carousel de compétences */
const track = document.getElementById("partnersTrack");

let speed = 0.4; // vitesse scroll
let position = 0;

// duplication pour boucle infinie
track.innerHTML += track.innerHTML;

function animatePartners() {
  position -= speed;

  if (position <= -track.scrollWidth / 2) {
    position = 0;
  }
  if (window.innerWidth < 768) {
    speed = 0.2;
  }

  track.style.transform = `translateX(${position}px)`;

  requestAnimationFrame(animatePartners);
}

animatePartners();

/* filtre de projets */
const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".ref-card");

filters.forEach((btn) => {
  btn.addEventListener("click", () => {
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
