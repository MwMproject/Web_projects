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
   HERO — ANIMATION DU LETTRAGE
========================================================= */

const heroAnimatedTitle = document.getElementById("heroAnimatedTitle");
// Conservé pour une future série de phrases. Passer à true pour réactiver l'animation.
const heroTitleAnimationEnabled = false;

if (heroAnimatedTitle) {
  const heroPhrases = {
    fr: ["Pour une qualité d’eau maîtrisée"],
    de: ["Für eine kontrollierte Wasserqualität"],
    en: ["For controlled water quality"],
  };
  const scrambleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZÀÄÉÈÖÜ0123456789";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let phraseIndex = 0;
  let animationFrame = 0;
  let changeTimer = 0;

  function scrambleTo(target) {
    window.cancelAnimationFrame(animationFrame);
    const source = heroAnimatedTitle.textContent;
    const startedAt = performance.now();
    const eraseCharacterDuration = 28;
    const writeCharacterDuration = 48;
    const pauseDuration = 180;
    const eraseDuration = source.length * eraseCharacterDuration;
    const writeDuration = target.length * writeCharacterDuration;
    const duration = eraseDuration + pauseDuration + writeDuration;

    function render(now) {
      const elapsed = now - startedAt;

      if (elapsed < eraseDuration) {
        const removedCharacters = Math.floor(elapsed / eraseCharacterDuration);
        heroAnimatedTitle.textContent = source.slice(0, Math.max(source.length - removedCharacters, 0));
      } else if (elapsed < eraseDuration + pauseDuration) {
        heroAnimatedTitle.textContent = "";
      } else if (elapsed < duration) {
        const writingElapsed = elapsed - eraseDuration - pauseDuration;
        const writtenCharacters = Math.floor(writingElapsed / writeCharacterDuration);
        const settledText = target.slice(0, writtenCharacters);
        const activeCharacter = target[writtenCharacters];

        if (!activeCharacter || activeCharacter === " ") {
          heroAnimatedTitle.textContent = target.slice(0, writtenCharacters + 1);
        } else {
          const scrambledCharacter = scrambleCharacters[Math.floor(Math.random() * scrambleCharacters.length)];
          heroAnimatedTitle.textContent = `${settledText}${scrambledCharacter}`;
        }
      } else {
        heroAnimatedTitle.textContent = target;
      }

      if (elapsed < duration) animationFrame = window.requestAnimationFrame(render);
    }

    animationFrame = window.requestAnimationFrame(render);
    return duration;
  }

  function scheduleNextPhrase(delay = 6000) {
    window.clearTimeout(changeTimer);
    changeTimer = window.setTimeout(() => {
      const lang = document.documentElement.lang || "fr";
      const phrases = heroPhrases[lang] || heroPhrases.fr;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      const transitionDuration = scrambleTo(phrases[phraseIndex]);
      scheduleNextPhrase(transitionDuration + 6000);
    }, delay);
  }

  function startHeroTitleAnimation(lang = document.documentElement.lang || "fr") {
    window.clearTimeout(changeTimer);
    window.cancelAnimationFrame(animationFrame);
    phraseIndex = 0;
    const phrases = heroPhrases[lang] || heroPhrases.fr;
    heroAnimatedTitle.textContent = phrases[0];

    if (heroTitleAnimationEnabled && !reducedMotion.matches && phrases.length > 1) {
      scheduleNextPhrase(6000);
    }
  }

  window.addEventListener("languagechange", (event) => {
    startHeroTitleAnimation(event.detail?.lang);
  });

  reducedMotion.addEventListener("change", () => startHeroTitleAnimation());
}

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
    anchor: "sanitaire",
  },
  piscineAquarium: {
    title: "Piscine – Aquarium",
    description: "Planification générale des installations aquatiques, du traitement d’eau aux équipements de loisirs et de sécurité.",
    items: ["Traitement d’eau", "Bassins et fonds mobiles", "Attractions, pataugeoires et spray-parks", "Plongeoirs", "Mise aux normes", "Installations de ventilation"],
    image: "assets/img/competences/competence-piscine-aquarium.webp",
    anchor: "piscine-aquarium",
  },
  medical: {
    title: "Médical",
    description: "Conception et réalisation de réseaux médicaux fiables, avec une attention particulière portée à la sécurité et à la continuité de service.",
    items: ["Gaz médicaux", "Analyse de risques", "Production et distribution", "Eau ultrapure", "Planification générale", "Stérilisation centrale"],
    image: "assets/img/competences/competence-medical.webp",
    anchor: "medical",
  },
  industriel: {
    title: "Industriel",
    description: "Planification de systèmes de production et de distribution adaptés aux contraintes des environnements industriels.",
    items: ["Gaz et air comprimé", "Fluides et produits chimiques, zones EX", "Encres d’imprimerie", "Processus de production industrielle"],
    image: "assets/img/competences/competence-industriel.webp",
    anchor: "industriel",
  },
  expertise: {
    title: "Expertise",
    description: "Un accompagnement indépendant pour analyser, sécuriser et évaluer les installations techniques complexes.",
    items: ["Expertises devant les tribunaux", "Installations sanitaires", "Conception de piscines", "Traitement d’eau de piscine", "Fluides et gaz"],
    image: "assets/img/competences/competence-expertise.webp",
    anchor: "expertise",
  },
};

const competenceButtons = document.querySelectorAll(".competence-thumb");
const competenceTitle = document.getElementById("competenceTitle");
const competenceDescription = document.getElementById("competenceDescription");
const competenceList = document.getElementById("competenceList");
const competenceFeature = document.getElementById("competenceFeature");
const competenceLink = document.getElementById("competenceLink");
if (competenceButtons.length && competenceTitle && competenceDescription && competenceList) {
  competenceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const content = competenceContent[button.dataset.competence];
      if (!content || button.classList.contains("active")) return;

      competenceButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });

      competenceTitle.textContent = content.title;
      competenceDescription.textContent = content.description;
      competenceList.innerHTML = content.items.map((item) => `<li>${item}</li>`).join("");
      if (competenceLink) {
        competenceLink.href = `competences.html#${content.anchor}`;
      }
      if (competenceFeature) {
        const backgroundImage = content.image.replace("assets/", "../");
        competenceFeature.style.setProperty("--competence-background", `url("${backgroundImage}")`);
      }
    });
  });
}

/* =========================================================
   REFERENCES PAGE
========================================================= */

const modal = document.getElementById("refModal");
const closeBtn = document.getElementById("refClose");
const filters = document.querySelectorAll(".filter");
const referencesGrid = document.getElementById("referencesGrid");

const modalTitle = document.getElementById("modalTitle");
const modalType = document.getElementById("modalType");
const modalClient = document.getElementById("modalClient");
const modalArchitect = document.getElementById("modalArchitect");
const modalPeriod = document.getElementById("modalPeriod");
const modalDescription = document.getElementById("modalDescription");
const modalServicesSection = document.getElementById("modalServicesSection");
const modalServices = document.getElementById("modalServices");
const gallery = document.getElementById("modalGallery");
const mainImage = document.getElementById("modalMainImage");
const suppliedReferenceDetails = Array.isArray(window.REFERENCE_DETAILS) ? window.REFERENCE_DETAILS : [];
const suppliedReferenceImages = Array.isArray(window.REFERENCE_IMAGES) ? window.REFERENCE_IMAGES : [];
const referenceProjects = Array.isArray(window.REFERENCE_CATALOG)
  ? window.REFERENCE_CATALOG.map((entry, index) => {
      const suppliedDetails = suppliedReferenceDetails[index] || {};
      return {
        ...entry,
        ...suppliedDetails,
        id: `client-reference-${index + 1}`,
        order: index,
        category: entry.tags[0],
        // Les références publiées utilisent exclusivement les images validées dans 02-Photos.
        images: Array.isArray(suppliedReferenceImages[index]) ? suppliedReferenceImages[index] : [],
      };
    })
  : [];

const referenceTagLabels = {
  Aquariums: "Aquariums",
  Logement: "Logement",
  Formation: "Formation",
  Piscine: "Techniques piscine",
  Administratif: "Administratif",
  Hôtellerie: "Hôtel",
  Industrie: "Industrie",
  EMS: "EMS",
  Santé: "Médical",
  Commerce: "Commerce",
  Restauration: "Cuisine professionnelle",
  Culture: "Divertissement",
};

const getReferenceTagLabel = (tag) => referenceTagLabels[tag] || tag;

/* =========================================================
   FILTERS
========================================================= */

if (filters.length && referenceProjects.length) {
  filters.forEach((button) => {
    if (button.dataset.filter !== "all") {
      button.textContent = getReferenceTagLabel(button.dataset.filter);
    }
  });

  const availableFilters = new Set(Array.from(filters, (button) => button.dataset.filter));

  const applyReferenceFilters = (selectedFilters, updateUrl = false) => {
    const activeFilters = selectedFilters.filter((filter) => availableFilters.has(filter));
    const showAll = !activeFilters.length || activeFilters.includes("all");
    const normalizedFilters = showAll ? ["all"] : activeFilters;

    filters.forEach((button) => {
      const isActive = normalizedFilters.includes(button.dataset.filter);
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    const projects = showAll
      ? referenceProjects
      : referenceProjects.filter((project) => getProjectTags(project).some((tag) => normalizedFilters.includes(tag)));
    renderReferences(projects);

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete("filter");
      url.searchParams.delete("filters");
      if (!showAll) {
        url.searchParams.set(normalizedFilters.length > 1 ? "filters" : "filter", normalizedFilters.join(","));
      }
      window.history.replaceState({}, "", url);
    }
  };

  const params = new URLSearchParams(window.location.search);
  const requestedFilters = (params.get("filters") || params.get("filter") || "")
    .split(",")
    .map((filter) => filter.trim())
    .filter(Boolean);

  applyReferenceFilters(requestedFilters.length ? requestedFilters : ["all"]);

  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedFilter = btn.dataset.filter;

      if (selectedFilter === "all") {
        applyReferenceFilters(["all"], true);
        return;
      }

      const activeFilters = Array.from(filters)
        .filter((button) => button.classList.contains("active") && button.dataset.filter !== "all")
        .map((button) => button.dataset.filter);
      const nextFilters = activeFilters.includes(selectedFilter)
        ? activeFilters.filter((filter) => filter !== selectedFilter)
        : [...activeFilters, selectedFilter];

      applyReferenceFilters(nextFilters.length ? nextFilters : ["all"], true);
    });
  });
} else if (referencesGrid && referenceProjects.length) {
  renderReferences(referenceProjects);
}

function renderReferences(projects) {
  referencesGrid.innerHTML = "";
  const sortedProjects = [...projects].sort((projectA, projectB) => {
    if (Number.isInteger(projectA.order) && Number.isInteger(projectB.order)) {
      return projectA.order - projectB.order;
    }
    return getReferenceYear(projectB) - getReferenceYear(projectA);
  });

  sortedProjects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "ref-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Voir les détails de la référence");
    const image = project.images[0] || "";
    const imageMarkup = image
      ? `<img src="${image}" alt="${escapeHtml(project.title)}" loading="lazy" />`
      : `<div class="ref-image-placeholder" aria-label="Images à venir"><span>Images à venir</span></div>`;
    const tagMarkup = getProjectTags(project)
      .map((tag) => `<span class="ref-tag">${escapeHtml(getReferenceTagLabel(tag))}</span>`)
      .join("");
    card.innerHTML = `
      <div class="ref-img">
        ${imageMarkup}
        <span class="ref-tags">${tagMarkup}</span>
      </div>
      <div class="ref-info">
        <h3>${escapeHtml(project.title)}</h3>
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

function getReferenceYear(project) {
  const years = String(project.period || "").match(/\b(?:19|20)\d{2}\b/g);
  return years?.length ? Math.max(...years.map(Number)) : Number.NEGATIVE_INFINITY;
}

function getProjectTags(project) {
  return Array.isArray(project.tags) && project.tags.length ? project.tags : [project.category];
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
  setMetaValue("modalTypeRow", modalType, project.type || project.category);
  setMetaValue("modalClientRow", modalClient, project.client);
  setMetaValue("modalArchitectRow", modalArchitect, project.architect);
  setMetaValue("modalPeriodRow", modalPeriod, project.period);
  const descriptionParts = String(project.description || "").split(/\n\nPrestations réalisées\s*:\s*/i);
  modalDescription.textContent = descriptionParts[0] || "";
  const servicesText = descriptionParts.slice(1).join("\n\n").trim();
  if (modalServicesSection && modalServices) {
    modalServicesSection.hidden = !servicesText;
    modalServices.textContent = servicesText;
  }
  gallery.innerHTML = "";
  const images = Array.isArray(project.images) ? project.images : [];
  const mainImageWrap = mainImage.parentElement;
  const hasImages = images.length > 0;
  mainImageWrap.hidden = !hasImages;
  gallery.hidden = images.length <= 1;

  if (hasImages) {
    mainImage.src = images[0];
    mainImage.alt = project.title || "";
  } else {
    mainImage.removeAttribute("src");
    mainImage.alt = "";
  }

  images.slice(1).forEach((image, index) => {
    const thumb = document.createElement("img");
    thumb.src = image;
    thumb.alt = `${project.title || "Référence"} — image ${index + 2}`;
    thumb.loading = "lazy";
    thumb.addEventListener("click", () => {
      mainImage.src = image;
      gallery.querySelectorAll("img").forEach((item) => item.classList.toggle("active", item === thumb));
    });
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

const requestedProjectId = new URLSearchParams(window.location.search).get("project");
if (requestedProjectId && referenceProjects.length) {
  const requestedProject = referenceProjects.find((project) => project.id === requestedProjectId);
  if (requestedProject) openReference(requestedProject);
}

