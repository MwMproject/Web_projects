// MENU MOBILE

const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav-links");

burger.addEventListener("click", () => {
  nav.classList.toggle("nav-active");
});

// MODAL SERVICES
const modal = document.querySelector(".service-modal");
const modalBody = document.querySelector(".modal-body");
const closeBtn = document.querySelector(".modal-close");

document.querySelectorAll(".toggle-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    const details = card.querySelector(".card-details").innerHTML;

    modalBody.innerHTML = details;
    modal.classList.add("active");

    document.body.style.overflow = "hidden";
  });
});

closeBtn.addEventListener("click", () => {
  modal.classList.remove("active");
  document.body.style.overflow = "";
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
});
// CAROUSEL
const slides = document.querySelectorAll(".slide");
const carousel = document.querySelector(".carousel");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

let index = 0;
let interval = null;
const delay = 3500;

// UPDATE
function updateCarousel() {
  slides.forEach((slide) => {
    slide.classList.remove("left", "center", "right", "hidden");
  });

  const prev = (index - 1 + slides.length) % slides.length;
  const next = (index + 1) % slides.length;

  slides[index].classList.add("center");
  slides[prev].classList.add("left");
  slides[next].classList.add("right");

  slides.forEach((slide, i) => {
    if (i !== index && i !== prev && i !== next) {
      slide.classList.add("hidden");
    }
  });
}

// AUTOPLAY
function startCarousel() {
  if (interval) return; // évite double interval

  interval = setInterval(() => {
    index = (index + 1) % slides.length;
    updateCarousel();
  }, delay);
}

function stopCarousel() {
  clearInterval(interval);
  interval = null;
}

// NAVIGATION
nextBtn?.addEventListener("click", () => {
  stopCarousel();
  index = (index + 1) % slides.length;
  updateCarousel();
  startCarousel();
});

prevBtn?.addEventListener("click", () => {
  stopCarousel();
  index = (index - 1 + slides.length) % slides.length;
  updateCarousel();
  startCarousel();
});

// HOVER PAUSE
carousel?.addEventListener("mouseenter", stopCarousel);
carousel?.addEventListener("mouseleave", startCarousel);

// SWIPE MOBILE
let touchStartX = 0;
let touchEndX = 0;

carousel?.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

carousel?.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  if (touchEndX < touchStartX - 50) {
    index = (index + 1) % slides.length;
  }

  if (touchEndX > touchStartX + 50) {
    index = (index - 1 + slides.length) % slides.length;
  }

  updateCarousel();
}

// INIT
updateCarousel();
startCarousel();

// FORM SUBMISSION
const form = document.querySelector(".contact-form");
const success = document.querySelector(".form-success");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  success.style.display = "block";

  form.reset();
});

//SCROLL EFFECT
const sections = [...document.querySelectorAll("section")];
let currentSection = 0;
let isScrolling = false;

// observer pour savoir quelle section est visible
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        currentSection = sections.indexOf(entry.target);
      }
    });
  },
  {
    threshold: 0.6,
  },
);

sections.forEach((section) => observer.observe(section));

// scroll vers la section suivante ou précédente
function scrollToSection(index) {
  if (index < 0 || index >= sections.length) return;

  isScrolling = true;

  sections[index].scrollIntoView({
    behavior: "smooth",
  });

  setTimeout(() => {
    isScrolling = false;
  }, 700);
}

window.addEventListener(
  "wheel",
  (e) => {
    if (isScrolling) {
      e.preventDefault();
      return;
    }

    if (e.deltaY > 0) {
      if (currentSection < sections.length - 1) {
        e.preventDefault();
        scrollToSection(currentSection + 1);
      }
    } else {
      if (currentSection > 0) {
        e.preventDefault();
        scrollToSection(currentSection - 1);
      }
    }
  },
  { passive: false },
);
