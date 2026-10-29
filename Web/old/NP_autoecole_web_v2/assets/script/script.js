// MENU MOBILE
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav-links");

burger?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("active");

  burger.classList.toggle("active", Boolean(isOpen));
  burger.setAttribute("aria-expanded", Boolean(isOpen));
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("active");
    burger?.classList.remove("active");
    burger?.setAttribute("aria-expanded", "false");
  });
});

// MODAL SERVICES
const modal = document.querySelector(".service-modal");
const modalBody = document.querySelector(".modal-body");
const closeBtn = document.querySelector(".modal-close");

function openModal(content) {
  if (!modal || !modalBody) return;

  modalBody.innerHTML = content;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modal) return;

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
  if (e.target === modal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal?.classList.contains("active")) closeModal();
});

// DATES SENSIBILISATION
function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function parseCourseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatCourseDate(value) {
  const date = parseCourseDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat("fr-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getCourseLabel(course) {
  return course.label || formatCourseDate(course.date);
}

function renderSensibilisationDates() {
  const containers = document.querySelectorAll("[data-sensi-dates]");
  const sourceDates = Array.isArray(window.sensibilisationDates)
    ? window.sensibilisationDates
    : [];
  const today = getTodayStart();
  const upcomingDates = sourceDates
    .filter((course) => course && typeof course === "object")
    .map((course) => ({
      ...course,
      parsedDate: parseCourseDate(course.date),
      parsedEndDate: parseCourseDate(course.endDate || course.date),
    }))
    .filter((course) => course.parsedDate && course.parsedEndDate >= today)
    .sort((a, b) => a.parsedDate - b.parsedDate);

  containers.forEach((container) => {
    container.innerHTML = "";

    const title = document.createElement("h4");
    title.textContent = "Prochaines dates";
    container.append(title);

    if (!upcomingDates.length) {
      const empty = document.createElement("p");
      empty.className = "sensi-dates-empty";
      empty.textContent = "Dates à venir prochainement.";
      container.append(empty);
      return;
    }

    const list = document.createElement("ul");
    list.className = "sensi-dates-list";

    upcomingDates.forEach((course) => {
      const item = document.createElement("li");
      const date = document.createElement("strong");
      date.textContent = getCourseLabel(course);
      item.append(date);

      if (course.time) {
        const time = document.createElement("span");
        time.textContent = course.time;
        item.append(time);
      }

      if (course.note) {
        const note = document.createElement("small");
        note.textContent = course.note;
        item.append(note);
      }

      list.append(item);
    });

    container.append(list);
  });
}

renderSensibilisationDates();

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

if (reviewCards.length) {
  reviewNext?.addEventListener("click", () => {
    reviewIndex = (reviewIndex + 1) % reviewCards.length;
    updateReviews();
  });

  reviewPrev?.addEventListener("click", () => {
    reviewIndex = (reviewIndex - 1 + reviewCards.length) % reviewCards.length;
    updateReviews();
  });

  updateReviews();
}

// ANIMATION LÉGÈRE AU SCROLL
const revealItems = document.querySelectorAll(
  ".about-container, .service-item, .instagram-card, .step, .contact-info-bar, .contact-form",
);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

// FORMULAIRE CONTACT + RESERVATION
const form = document.querySelector(".contact-form");
const formSuccess = document.querySelector(".form-success");
const serviceSelect = document.querySelector("#service");
const bookingFields = document.querySelector(".booking-fields");
const dateCours = document.querySelector("#date-cours");
const heureCours = document.querySelector("#heure-cours");

const servicesAvecCreneau = [
  "Cours Cat B",
  "Cours Cat BE",
  "Reprise de confiance",
];

function formatDateForInput(date) {
  return date.toISOString().split("T")[0];
}

function updateBookingVisibility() {
  const needsBooking = servicesAvecCreneau.includes(serviceSelect?.value);
  if (!bookingFields) return;
  bookingFields.hidden = !needsBooking;
  if (dateCours && heureCours) {
    dateCours.required = needsBooking;
    heureCours.required = needsBooking;
    if (!needsBooking) {
      dateCours.value = "";
      heureCours.value = "";
    }
  }
}

function isWeekend(value) {
  if (!value) return false;
  const date = new Date(`${value}T12:00:00`);
  const day = date.getDay();
  return day === 0 || day === 6;
}

if (dateCours) {
  dateCours.min = formatDateForInput(new Date());
  dateCours.addEventListener("change", () => {
    if (isWeekend(dateCours.value)) {
      alert("Merci de choisir une date du lundi au vendredi.");
      dateCours.value = "";
    }
  });
}

serviceSelect?.addEventListener("change", updateBookingVisibility);
updateBookingVisibility();

// Email submit — native form POST to contact.php
form?.addEventListener("submit", function (e) {
  const needsBooking = servicesAvecCreneau.includes(serviceSelect?.value);
  if (needsBooking && isWeekend(dateCours?.value)) {
    e.preventDefault();
    alert("Merci de choisir une date du lundi au vendredi.");
  }
  // Let the form POST natively to contact.php
});

// WHATSAPP FLOTTANT — masquer sur section contact
const waFloat = document.querySelector(".whatsapp-float");
const contactSection = document.querySelector("#contact");

if (waFloat && contactSection) {
  const waObserver = new IntersectionObserver(
    ([entry]) => {
      waFloat.classList.toggle("hidden", entry.isIntersecting);
    },
    { threshold: 0.2 }
  );
  waObserver.observe(contactSection);
}
