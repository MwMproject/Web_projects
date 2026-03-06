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
