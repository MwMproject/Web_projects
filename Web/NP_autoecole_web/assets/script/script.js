// MENU MOBILE
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav-links");

burger?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("active");

  burger.classList.toggle("active", isOpen);
  burger.setAttribute("aria-expanded", isOpen);
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("active");
    burger.classList.remove("active");
    burger.setAttribute("aria-expanded", "false");
  });
});

// MODAL SERVICES
const modal = document.querySelector(".service-modal");
const modalBody = document.querySelector(".modal-body");
const closeBtn = document.querySelector(".modal-close");

function openModal(content) {
  modalBody.innerHTML = content;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll(".service-item").forEach((item) => {
  item.addEventListener("click", () => {
    const details = item.querySelector(".card-details");
    if (!details) return;

    openModal(details.innerHTML);
  });
});

closeBtn?.addEventListener("click", closeModal);

modal?.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal?.classList.contains("active")) {
    closeModal();
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
  if (!slides.length) return;

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
  if (interval || slides.length <= 1) return;

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
  if (!slides.length) return;

  stopCarousel();

  if (touchEndX < touchStartX - 50) {
    index = (index + 1) % slides.length;
  }

  if (touchEndX > touchStartX + 50) {
    index = (index - 1 + slides.length) % slides.length;
  }

  updateCarousel();
  startCarousel();
}

// INIT CAROUSEL
updateCarousel();
startCarousel();

// FORM SUBMISSION
const form = document.querySelector(".contact-form");
const formSuccess = document.querySelector(".form-success");

form?.addEventListener("submit", function (e) {
  e.preventDefault();

  form.reset();

  if (formSuccess) {
    formSuccess.hidden = false;

    setTimeout(() => {
      formSuccess.hidden = true;
    }, 4000);
  }
});
