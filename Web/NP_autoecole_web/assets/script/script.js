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

let index = 0;

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

updateCarousel();

setInterval(() => {
  index++;

  if (index >= slides.length) {
    index = 0;
  }

  updateCarousel();
}, 3000);

// FORM SUBMISSION
const form = document.querySelector(".contact-form");
const success = document.querySelector(".form-success");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  success.style.display = "block";

  form.reset();
});
