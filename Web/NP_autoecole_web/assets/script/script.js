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

// AVIS GOOGLE CAROUSEL
const reviewCards = document.querySelectorAll(".review-card");
const reviewPrev = document.querySelector(".review-prev");
const reviewNext = document.querySelector(".review-next");

let reviewIndex = 0;

function updateReviews() {
  reviewCards.forEach((card, i) => {
    card.classList.toggle("active", i === reviewIndex);
  });
}

reviewNext?.addEventListener("click", () => {
  reviewIndex = (reviewIndex + 1) % reviewCards.length;
  updateReviews();
});

reviewPrev?.addEventListener("click", () => {
  reviewIndex = (reviewIndex - 1 + reviewCards.length) % reviewCards.length;
  updateReviews();
});

updateReviews();

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
