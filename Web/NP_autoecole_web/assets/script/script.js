// MENU MOBILE

const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav-links");

burger.addEventListener("click", () => {
  nav.classList.toggle("nav-active");
});

// TOGGLE CARD
const buttons = document.querySelectorAll(".toggle-card");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".card");

    document.querySelectorAll(".card").forEach((c) => {
      if (c !== card) {
        c.classList.remove("open");

        const otherButton = c.querySelector(".toggle-card");
        if (otherButton) otherButton.textContent = "Découvrir";
      }
    });

    card.classList.toggle("open");

    button.textContent = card.classList.contains("open")
      ? "Réduire"
      : "Découvrir";
  });
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
