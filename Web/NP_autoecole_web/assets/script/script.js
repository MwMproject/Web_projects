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

document.querySelectorAll(".service-item").forEach((item) => {
  item.addEventListener("click", () => {
    const details = item.querySelector(".card-details");
    if (!details) return;

    modalBody.innerHTML = details.innerHTML;
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

function startCarousel() {
  if (interval) return;
  interval = setInterval(() => {
    index = (index + 1) % slides.length;
    updateCarousel();
  }, delay);
}

function stopCarousel() {
  clearInterval(interval);
  interval = null;
}

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

// INIT CAROUSEL
updateCarousel();
startCarousel();

// FORM SUBMISSION
const form = document.querySelector(".contact-form");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  form.reset();
});

// SCROLL EFFECT
const sections = [...document.querySelectorAll("section")];
let currentSection = 0;
let isScrolling = false;

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        currentSection = sections.indexOf(entry.target);
      }
    });
  },
  { threshold: 0.6 },
);

sections.forEach((section) => observer.observe(section));

function scrollToSection(idx) {
  if (idx < 0 || idx >= sections.length) return;
  isScrolling = true;
  sections[idx].scrollIntoView({ behavior: "smooth" });
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
