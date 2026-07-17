/* =========================================================
   GLOBAL ELEMENTS
========================================================= */

const header = document.getElementById("header");
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
const toTopBtn = document.getElementById("toTop");
const revealElements = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll(".nav a");

/* =========================================================
   HEADER SCROLL + TOP BUTTON
========================================================= */

function handleScroll() {
  const scrollY = window.scrollY;

  if (header) {
    if (scrollY > 30) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }

  if (toTopBtn) {
    if (scrollY > 500) toTopBtn.classList.add("show");
    else toTopBtn.classList.remove("show");
  }
}

window.addEventListener("scroll", handleScroll);
handleScroll();

/* =========================================================
   MOBILE MENU
========================================================= */

if (burger && nav) {
  burger.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (e) => {
    const clickedInsideNav = nav.contains(e.target);
    const clickedBurger = burger.contains(e.target);

    if (!clickedInsideNav && !clickedBurger) {
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    }
  });
}

/* =========================================================
   SCROLL TO TOP
========================================================= */

if (toTopBtn) {
  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* =========================================================
   SCROLL REVEAL
========================================================= */

if (revealElements.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  revealElements.forEach((el) => observer.observe(el));
}

/* =========================================================
   COMPÉTENCES — ACCUEIL
========================================================= */

const competenceContent = {
  sanitaire: {
    title: "Sanitaire",
    description: "Conception et réalisation d’installations sanitaires performantes, de la distribution à la gestion durable de l’eau.",
    items: ["Distribution et évacuation", "Gestion et revalorisation des eaux météorologiques", "STEP", "Pisciculture"],
    image: "assets/img/competences/competence-sanitaire.webp",
    alt: "Installations sanitaires",
  },
  piscineAquarium: {
    title: "Piscine – Aquarium",
    description: "Planification générale des installations aquatiques, du traitement d’eau aux équipements de loisirs et de sécurité.",
    items: ["Traitement d’eau", "Bassins et fonds mobiles", "Attractions, pataugeoires et spray-parks", "Plongeoirs", "Mise aux normes", "Installations de ventilation"],
    image: "assets/img/competences/competence-piscine-aquarium.webp",
    alt: "Piscine et installations aquatiques",
  },
  medical: {
    title: "Médical",
    description: "Conception et réalisation de réseaux médicaux fiables, avec une attention particulière portée à la sécurité et à la continuité de service.",
    items: ["Gaz médicaux", "Analyse de risques", "Production et distribution", "Eau ultrapure", "Planification générale", "Stérilisation centrale"],
    image: "assets/img/competences/competence-medical.webp",
    alt: "Installations techniques médicales",
  },
  industriel: {
    title: "Industriel",
    description: "Planification de systèmes de production et de distribution adaptés aux contraintes des environnements industriels.",
    items: ["Gaz et air comprimé", "Fluides et produits chimiques, zones EX", "Encres d’imprimerie", "Processus de production industrielle"],
    image: "assets/img/competences/competence-industriel.webp",
    alt: "Installations techniques industrielles",
  },
  expertise: {
    title: "Expertise",
    description: "Un accompagnement indépendant pour analyser, sécuriser et évaluer les installations techniques complexes.",
    items: ["Expertises devant les tribunaux", "Installations sanitaires", "Conception de piscines", "Traitement d’eau de piscine", "Fluides et gaz"],
    image: "assets/img/competences/competence-expertise.webp",
    alt: "Expertise technique",
  },
};

const competenceButtons = document.querySelectorAll(".competence-thumb");
const competenceTitle = document.getElementById("competenceTitle");
const competenceDescription = document.getElementById("competenceDescription");
const competenceList = document.getElementById("competenceList");
const competenceMainImage = document.getElementById("competenceMainImage");

if (competenceButtons.length && competenceTitle && competenceDescription && competenceList && competenceMainImage) {
  competenceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const content = competenceContent[button.dataset.competence];
      if (!content || button.classList.contains("active")) return;

      competenceButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });

      competenceMainImage.classList.add("switching");
      window.setTimeout(() => {
        competenceTitle.textContent = content.title;
        competenceDescription.textContent = content.description;
        competenceList.innerHTML = content.items.map((item) => `<li>${item}</li>`).join("");
        competenceMainImage.onload = () => competenceMainImage.classList.remove("switching");
        competenceMainImage.onerror = () => competenceMainImage.classList.remove("switching");
        competenceMainImage.alt = content.alt;
        competenceMainImage.src = content.image;
      }, 180);
    });
  });
}

/* =========================================================
   PARTNERS CAROUSEL (SAFE)
========================================================= */

const track = document.getElementById("partnersTrack");

if (track) {
  let speed = 0.4;
  let position = 0;

  track.innerHTML += track.innerHTML;

  function animatePartners() {
    position -= speed;

    if (position <= -track.scrollWidth / 2) position = 0;

    if (window.innerWidth < 768) speed = 0.2;

    track.style.transform = `translateX(${position}px)`;

    requestAnimationFrame(animatePartners);
  }

  animatePartners();
}

/* =========================================================
   REFERENCES CAROUSEL (ACCUEIL)
========================================================= */

const refsTrack = document.getElementById("refsTrack");

if (refsTrack) {
  const refsCarousel = refsTrack.parentElement;
  let refsSpeed = 0.5;
  let refsPosition = 0;
  let refsPaused = false;

  refsTrack.innerHTML += refsTrack.innerHTML;

  refsCarousel.addEventListener("mouseenter", () => (refsPaused = true));
  refsCarousel.addEventListener("mouseleave", () => (refsPaused = false));

  function animateRefs() {
    if (!refsPaused) {
      refsPosition -= refsSpeed;
      if (refsPosition <= -refsTrack.scrollWidth / 2) refsPosition = 0;
    }

    refsTrack.style.transform = `translateX(${refsPosition}px)`;

    requestAnimationFrame(animateRefs);
  }

  animateRefs();
}

/* =========================================================
   REFERENCES PAGE
========================================================= */

const modal = document.getElementById("refModal");
const closeBtn = document.getElementById("refClose");
const filters = document.querySelectorAll(".filter");
const referencesGrid = document.getElementById("referencesGrid");

const modalTitle = document.getElementById("modalTitle");
const modalClient = document.getElementById("modalClient");
const modalArchitect = document.getElementById("modalArchitect");
const modalPeriod = document.getElementById("modalPeriod");
const modalCost = document.getElementById("modalCost");
const modalDescription = document.getElementById("modalDescription");
const gallery = document.getElementById("modalGallery");
const mainImage = document.getElementById("modalMainImage");
const referenceProjects = Array.isArray(window.REFERENCES_DATA)
  ? window.REFERENCES_DATA
  : [];

/* =========================================================
   FILTERS
========================================================= */

if (referencesGrid && referenceProjects.length) {
  renderReferences(referenceProjects);
}

if (filters.length && referenceProjects.length) {
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const type = btn.dataset.filter;
      const projects = type === "all"
        ? referenceProjects
        : referenceProjects.filter((project) => project.category === type);
      renderReferences(projects);
    });
  });
}

function renderReferences(projects) {
  referencesGrid.innerHTML = "";
  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "ref-card";
    card.tabIndex = 0;
    const image = project.images[0] || "assets/img/Logo_HS.png";
    card.innerHTML = `
      <div class="ref-img">
        <img src="${image}" alt="${escapeHtml(project.title)}" loading="lazy" />
        <span class="ref-tag">${escapeHtml(project.category)}</span>
      </div>
      <div class="ref-info">
        <h3>${escapeHtml(project.title)}</h3>
        ${project.period ? `<p>${escapeHtml(project.period)}</p>` : ""}
      </div>`;
    card.addEventListener("click", () => openReference(project));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openReference(project);
      }
    });
    referencesGrid.appendChild(card);
  });
}

function escapeHtml(value) {
  const node = document.createElement("span");
  node.textContent = value || "";
  return node.innerHTML;
}

/* =========================================================
   MODAL
========================================================= */

if (modal && gallery && mainImage) {
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function setMetaValue(id, element, value) {
  const row = document.getElementById(id);
  if (!row || !element) return;
  row.hidden = !value;
  element.textContent = value || "";
}

function openReference(project) {
  if (!modal || !gallery || !mainImage) return;
  modalTitle.textContent = project.title || "";
  setMetaValue("modalClientRow", modalClient, project.client);
  setMetaValue("modalArchitectRow", modalArchitect, project.architect);
  setMetaValue("modalPeriodRow", modalPeriod, project.period);
  setMetaValue("modalCostRow", modalCost, project.cost);
  modalDescription.textContent = project.description || "";
  gallery.innerHTML = "";
  const images = project.images.length ? project.images : ["assets/img/Logo_HS.png"];
  mainImage.src = images[0];
  mainImage.alt = project.title || "";
  images.forEach((image) => {
    const thumb = document.createElement("img");
    thumb.src = image;
    thumb.alt = "";
    thumb.loading = "lazy";
    thumb.addEventListener("click", () => { mainImage.src = image; });
    gallery.appendChild(thumb);
  });
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("open");
  document.body.style.overflow = "auto";
}
