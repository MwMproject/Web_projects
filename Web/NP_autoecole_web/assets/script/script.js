// MENU MOBILE

const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav-links");

burger.addEventListener("click", () => {
  nav.classList.toggle("nav-active");
});

// CAROUSEL AUTO

const track = document.querySelector(".carousel-track");

let position = 0;

setInterval(() => {
  position -= 320;

  if (position < -640) {
    position = 0;
  }

  track.style.transform = `translateX(${position}px)`;
}, 3000);

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
