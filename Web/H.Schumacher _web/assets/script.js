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
