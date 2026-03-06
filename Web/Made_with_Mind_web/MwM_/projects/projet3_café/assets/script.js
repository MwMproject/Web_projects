// ============== REVEAL AU SCROLL ==============
const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target); // une fois visible, on n'y touche plus
      }
    });
  },
  { threshold: 0.2 }
);

revealElements.forEach((el) => {
  revealObserver.observe(el);
});

// ============== PARALLAX HERO ==============
const parallaxEls = document.querySelectorAll("[data-parallax]");
let ticking = false;

function handleParallax() {
  const scrollY = window.scrollY || window.pageYOffset;

  parallaxEls.forEach((el) => {
    const speed = parseFloat(el.getAttribute("data-parallax-speed")) || 0.3;
    const offset = scrollY * speed;
    el.style.transform = `translateY(${offset * -1}px) scale(1.05)`; // léger mouvement inverse
  });

  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(handleParallax);
    ticking = true;
  }
});
