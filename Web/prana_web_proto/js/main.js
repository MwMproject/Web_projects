// Nav mobile
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('is-open');
  navToggle.classList.toggle('is-active', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    navToggle.classList.remove('is-active');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Toggle mensuel / annuel dans les tarifs
const toggleButtons = document.querySelectorAll('.toggle-btn');
const priceAmounts = document.querySelectorAll('.price .amount[data-mois]');
const priceUnits = document.querySelectorAll('.price .unit[data-mois]');

toggleButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const period = btn.dataset.period;

    toggleButtons.forEach((b) => b.classList.toggle('is-active', b === btn));

    priceAmounts.forEach((el) => {
      el.textContent = el.dataset[period];
    });
    priceUnits.forEach((el) => {
      el.textContent = el.dataset[period];
    });
  });
});

// Année du footer
document.getElementById('year').textContent = new Date().getFullYear();

// Navbar : mise en évidence de la section visible
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });

sections.forEach((section) => sectionObserver.observe(section));

// Bouton retour en haut
const backToTop = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  backToTop.classList.toggle('is-visible', window.scrollY > 600);
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
