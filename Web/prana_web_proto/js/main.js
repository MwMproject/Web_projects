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
    toggleButtons.forEach((b) => b.setAttribute('aria-selected', b === btn ? 'true' : 'false'));

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

// Avis : 3 visibles sur ordinateur, 2 sur tablette et 1 sur mobile
const reviewCarousel = document.querySelector('.review-carousel');

if (reviewCarousel) {
  const reviewTrack = reviewCarousel.querySelector('.review-track');
  const reviewSlides = [...reviewCarousel.querySelectorAll('[data-review-slide]')];
  const reviewPrev = reviewCarousel.querySelector('[data-review-prev]');
  const reviewNext = reviewCarousel.querySelector('[data-review-next]');
  const reviewDots = reviewCarousel.querySelector('.review-dots');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reviewIndex = 0;
  let reviewTimer;

  const visibleReviews = () => {
    if (window.innerWidth <= 480) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  };

  const reviewPageCount = () => Math.ceil(reviewSlides.length / visibleReviews());

  const renderReviewDots = () => {
    reviewDots.replaceChildren();
    for (let i = 0; i < reviewPageCount(); i += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'review-dot';
      dot.setAttribute('aria-label', `Afficher le groupe d'avis ${i + 1}`);
      dot.addEventListener('click', () => {
        reviewIndex = i;
        updateReviews();
        restartReviews();
      });
      reviewDots.append(dot);
    }
  };

  const updateReviews = () => {
    const pages = reviewPageCount();
    reviewIndex = (reviewIndex + pages) % pages;
    reviewTrack.style.transform = `translateX(calc(${-reviewIndex * 100}% - ${reviewIndex * 24}px))`;
    [...reviewDots.children].forEach((dot, index) => {
      const active = index === reviewIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  };

  const stopReviews = () => clearInterval(reviewTimer);
  const startReviews = () => {
    if (reducedMotion.matches || reviewPageCount() < 2) return;
    reviewTimer = setInterval(() => {
      reviewIndex += 1;
      updateReviews();
    }, 6000);
  };
  const restartReviews = () => {
    stopReviews();
    startReviews();
  };

  reviewPrev.addEventListener('click', () => {
    reviewIndex -= 1;
    updateReviews();
    restartReviews();
  });
  reviewNext.addEventListener('click', () => {
    reviewIndex += 1;
    updateReviews();
    restartReviews();
  });
  reviewCarousel.addEventListener('mouseenter', stopReviews);
  reviewCarousel.addEventListener('mouseleave', startReviews);
  reviewCarousel.addEventListener('focusin', stopReviews);
  reviewCarousel.addEventListener('focusout', startReviews);

  window.addEventListener('resize', () => {
    reviewIndex = 0;
    renderReviewDots();
    updateReviews();
    restartReviews();
  });

  renderReviewDots();
  updateReviews();
  startReviews();
}
