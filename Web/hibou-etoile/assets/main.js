const languageSwitchers = document.querySelectorAll(".language-switcher");
const compactHeader = document.querySelector(".compact-header");
const hero = document.querySelector(".hero");
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav");
const isContactPage = location.pathname.includes("contact");
const urlLanguage = location.pathname.startsWith("/en") || new URLSearchParams(location.search).get("lang") === "en" ? "en" : null;
let language = urlLanguage || "fr";

function routeFor(next, contact = isContactPage) {
  const local = location.hostname === "127.0.0.1" || location.hostname === "localhost";
  if (local) return `${contact ? "contact.html" : "index.html"}${next === "en" ? "?lang=en" : ""}`;
  return next === "en" ? `/en${contact ? "/contact" : ""}` : contact ? "/contact" : "/";
}

function valueAt(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function applyLanguage(next) {
  language = next;
  document.documentElement.lang = next;
  document.title = isContactPage
    ? "Contact | L'hibou Étoilé"
    : next === "en" ? "HOME | Hibou Etoile" : "L'Hibou étoilé | holiday rental";
  const canonical = document.querySelector('link[rel="canonical"]');
  canonical.href = `https://www.hibou-etoile.com${next === "en" ? `/en${isContactPage ? "/contact" : ""}` : isContactPage ? "/contact" : "/"}`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = next === "en"
    ? "Swiss chalet holiday rentals in Morgins and Troistorrents, in the heart of the Valais Alps."
    : "L'Hibou étoilé vous propose des locations de chalets suisses hors du commun à des prix raisonnables afin que vous puissiez profiter de ce que notre magnifique région peut offrir.";
  document.querySelectorAll('a[data-i18n="nav.home"]').forEach((link) => link.href = routeFor(next, false));
  document.querySelectorAll('a[data-i18n="nav.contact"]').forEach((link) => link.href = routeFor(next, true));
  document.querySelectorAll(".logo-card, .compact-brand").forEach((link) => link.href = routeFor(next, false));
  document.querySelectorAll('a[data-i18n="direct.cta"]').forEach((link) => link.href = routeFor(next, true));
  document.querySelectorAll(".mobile-book").forEach((link) => link.href = `${routeFor(next, false)}#booking`);
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = valueAt(window.translations[next], element.dataset.i18n);
    if (value) element.innerHTML = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const value = valueAt(
      window.translations[next],
      element.dataset.i18nPlaceholder,
    );
    if (value) element.placeholder = value;
  });
  document
    .querySelectorAll('[data-i18n="booking.mobile"]')
    .forEach((element) => {
      element.textContent = next === "fr" ? "RÉSERVER" : "BOOK NOW";
    });
  document.querySelectorAll('[data-i18n="footer.credit"]').forEach((element) => {
    element.innerHTML = next === "fr"
      ? '© 2026 L\'Hibou Étoilé — Site créé par <a href="https://mwm-project.ch" target="_blank" rel="noopener">MWM Project</a>'
      : '© 2026 L\'Hibou Étoilé — Website created by <a href="https://mwm-project.ch" target="_blank" rel="noopener">MWM Project</a>';
  });
  const bookingLabel = document.querySelector("[data-booking-label]");
  if (bookingLabel) {
    bookingLabel.textContent = next === "fr" ? "Exceptionnel" : "Exceptional";
    document.querySelector("[data-booking-reviews]").textContent = next === "fr" ? "140 avis" : "140 reviews";
    document.querySelector("[data-booking-title]").textContent = next === "fr" ? "Voir sur Booking.com" : "View on Booking.com";
    document.querySelector("[data-booking-grand]").textContent = next === "fr" ? "Chalet grand luxe" : "Luxury chalet";
    document.querySelector("[data-booking-small]").textContent = next === "fr" ? "Petit chalet familial" : "Small family chalet";
  }
  languageSwitchers.forEach((switcher) => {
    const trigger = switcher.querySelector(".language-select");
    trigger.querySelector(".language-flag").src = next === "fr"
      ? "assets/img/flag-ch.svg"
      : "assets/img/flag-gb.svg";
    trigger.querySelector("b").textContent = next.toUpperCase();
    trigger.setAttribute("aria-label", next === "fr" ? "Choisir la langue. Français sélectionné" : "Choose language. English selected");
    switcher.querySelectorAll("[data-language]").forEach((option) => {
      option.classList.toggle("selected", option.dataset.language === next);
      option.setAttribute("aria-current", option.dataset.language === next ? "true" : "false");
    });
  });
  localStorage.setItem("hibou-language", next);
}

function closeLanguageMenus(exception) {
  languageSwitchers.forEach((switcher) => {
    if (switcher === exception) return;
    switcher.classList.remove("open");
    switcher.querySelector(".language-select").setAttribute("aria-expanded", "false");
  });
}

languageSwitchers.forEach((switcher) => {
  const trigger = switcher.querySelector(".language-select");
  trigger.addEventListener("click", () => {
    const willOpen = !switcher.classList.contains("open");
    closeLanguageMenus(switcher);
    switcher.classList.toggle("open", willOpen);
    trigger.setAttribute("aria-expanded", String(willOpen));
  });
  switcher.querySelectorAll("[data-language]").forEach((option) => {
    option.addEventListener("click", () => {
      history.pushState({}, "", routeFor(option.dataset.language));
      applyLanguage(option.dataset.language);
      closeLanguageMenus();
    });
  });
});

window.addEventListener("popstate", () => location.reload());

document.addEventListener("click", (event) => {
  if (!event.target.closest(".language-switcher")) closeLanguageMenus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLanguageMenus();
    closeBookingLinks();
  }
});

const bookingBadge = document.querySelector(".booking-badge");
const bookingLinks = document.querySelector(".booking-links");

function closeBookingLinks() {
  if (!bookingLinks) return;
  bookingLinks.hidden = true;
  bookingBadge.setAttribute("aria-expanded", "false");
}

if (bookingBadge) {
  bookingBadge.addEventListener("click", () => {
    const willOpen = bookingLinks.hidden;
    bookingLinks.hidden = !willOpen;
    bookingBadge.setAttribute("aria-expanded", String(willOpen));
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".booking-widget")) closeBookingLinks();
  });
}
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
});

const headerObserver = new IntersectionObserver(
  ([entry]) => {
    compactHeader.classList.toggle("visible", !entry.isIntersecting);
    compactHeader.setAttribute("aria-hidden", String(entry.isIntersecting));
    compactHeader.inert = entry.isIntersecting;
  },
  { threshold: 0.08 },
);
headerObserver.observe(hero);

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 },
);
document.querySelectorAll(".white-panel, .mosaic, .map").forEach((element) => {
  element.classList.add("scroll-reveal");
  revealObserver.observe(element);
});

const form = document.querySelector("#contact-form");
if (form)
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const subject = encodeURIComponent("Demande depuis le site L'Hibou Étoilé");
    const body = encodeURIComponent(
      `${data.get("name")} (${data.get("email")})\n\n${data.get("message")}`,
    );
    location.href = `mailto:info@hibou-etoile.com?subject=${subject}&body=${body}`;
  });

applyLanguage(language);
