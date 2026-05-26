const state = {
  projectName: "Projet client",
  view: "desktop",
  selectedId: null,
  theme: {
    primary: "#2563eb",
    secondary: "#f97316",
    background: "#f8fafc",
    font: "Inter, system-ui, sans-serif",
  },
  sections: [],
};

const sectionDefaults = {
  navbar: () => ({
    type: "navbar",
    title: "MWM Studio",
    menu: "Accueil, Services, Réalisations, Contact",
    variant: "classic",
    behavior: "static",
  }),
  hero: () => ({
    type: "hero",
    variant: "split",
    kicker: "Site vitrine",
    title: "Un titre fort pour présenter l’activité",
    text: "Un paragraphe court pour expliquer la promesse, rassurer le visiteur et poser le ton de la page.",
    button: "Demander un devis",
    image: "Emplacement image",
  }),
  text: () => ({
    type: "text",
    title: "Une section de contenu claire",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere permet de valider rapidement les volumes de texte avec le client.",
  }),
  imageText: () => ({
    type: "imageText",
    title: "Image et texte côte à côte",
    text: "Idéal pour expliquer une méthode, présenter une offre ou montrer un avant-après avec un visuel prévu.",
    image: "Image prévue",
  }),
  features: () => ({
    type: "features",
    variant: "cards",
    title: "Services principaux",
    item1: "Création de site",
    item2: "Référencement",
    item3: "Maintenance",
  }),
  gallery: () => ({
    type: "gallery",
    title: "Aperçu visuel",
  }),
  contact: () => ({
    type: "contact",
    title: "Prêt à démarrer ?",
    text: "Une zone de contact simple pour terminer la page et guider le visiteur vers l’action.",
  }),
};

const pagePreview = document.querySelector("#pagePreview");
const emptyState = document.querySelector("#emptyState");
const canvas = document.querySelector("#canvas");
const inspector = document.querySelector("#inspector");
const projectList = document.querySelector("#projectList");
const projectNameInput = document.querySelector("#projectName");

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => addSection(button.dataset.add));
});

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("is-active", item === button));
    canvas.classList.toggle("mobile", state.view === "mobile");
    canvas.classList.toggle("desktop", state.view === "desktop");
  });
});

document.querySelector("#primaryColor").addEventListener("input", (event) => updateTheme("primary", event.target.value));
document.querySelector("#secondaryColor").addEventListener("input", (event) => updateTheme("secondary", event.target.value));
document.querySelector("#backgroundColor").addEventListener("input", (event) => updateTheme("background", event.target.value));
document.querySelector("#fontFamily").addEventListener("change", (event) => updateTheme("font", event.target.value));
projectNameInput.addEventListener("input", (event) => {
  state.projectName = event.target.value || "Projet client";
});
document.querySelector("#saveProject").addEventListener("click", saveProject);
document.querySelector("#newProject").addEventListener("click", newProject);
document.querySelector("#clearPage").addEventListener("click", clearPage);
document.querySelector("#exportSite").addEventListener("click", openExport);
document.querySelector("#closeExport").addEventListener("click", () => document.querySelector("#exportDialog").close());
document.querySelector("#copyExport").addEventListener("click", copyExport);

function addSection(type) {
  const section = {
    id: crypto.randomUUID(),
    ...sectionDefaults[type](),
  };
  state.sections.push(section);
  state.selectedId = section.id;
  render();
}

function updateTheme(key, value) {
  state.theme[key] = value;
  render();
}

function clearPage() {
  state.sections = [];
  state.selectedId = null;
  render();
}

function render() {
  projectNameInput.value = state.projectName;
  document.documentElement.style.setProperty("--primary", state.theme.primary);
  document.documentElement.style.setProperty("--secondary", state.theme.secondary);
  canvas.style.setProperty("--background", state.theme.background);
  canvas.style.fontFamily = state.theme.font;
  emptyState.hidden = state.sections.length > 0;
  pagePreview.innerHTML = state.sections.map(renderSection).join("");
  bindSectionEvents();
  renderInspector();
  renderProjectList();
}

function renderSection(section) {
  return `
    <section class="site-section ${section.id === state.selectedId ? "is-selected" : ""}" data-id="${section.id}" draggable="true">
      <div class="section-tools">
        <button data-action="up" title="Monter">↑</button>
        <button data-action="down" title="Descendre">↓</button>
        <button data-action="delete" title="Supprimer">×</button>
      </div>
      ${renderBlock(section)}
    </section>
  `;
}

function renderBlock(section) {
  if (section.type === "navbar") {
    const menu = section.menu.split(",").map((item) => `<span>${escapeHtml(item.trim())}</span>`).join("");
    return `
      <nav class="preview-navbar ${navbarClass(section)}">
        <div class="preview-logo">${escapeHtml(section.title)}</div>
        <div class="preview-menu">${menu}</div>
        <div class="burger" aria-label="Menu mobile"></div>
      </nav>
    `;
  }

  if (section.type === "hero") {
    return `
      <div class="preview-hero ${heroClass(section.variant)}">
        <div>
          <div class="preview-kicker">${escapeHtml(section.kicker)}</div>
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.text)}</p>
          <a class="preview-cta" href="#">${escapeHtml(section.button)}</a>
        </div>
        <div class="image-placeholder">${escapeHtml(section.image)}</div>
      </div>
    `;
  }

  if (section.type === "text") {
    return `
      <div class="preview-text">
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.text)}</p>
      </div>
    `;
  }

  if (section.type === "imageText") {
    return `
      <div class="preview-image-text">
        <div class="image-placeholder">${escapeHtml(section.image)}</div>
        <div>
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.text)}</p>
        </div>
      </div>
    `;
  }

  if (section.type === "features") {
    return `
      <div class="preview-features">
        <h2>${escapeHtml(section.title)}</h2>
        <div class="feature-grid ${featuresClass(section.variant)}">
          ${[section.item1, section.item2, section.item3].map((item) => `
            <article class="feature-card">
              <strong>${escapeHtml(item)}</strong>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </article>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (section.type === "gallery") {
    return `
      <div class="preview-gallery">
        <h2>${escapeHtml(section.title)}</h2>
        <div class="gallery-grid">
          <div class="image-placeholder gallery-tile">Image 1</div>
          <div class="image-placeholder gallery-tile">Image 2</div>
          <div class="image-placeholder gallery-tile">Image 3</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="preview-contact">
      <div>
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.text)}</p>
      </div>
      <div class="contact-box">
        <input placeholder="Nom" />
        <input placeholder="Email" />
        <textarea placeholder="Message"></textarea>
        <a class="preview-cta" href="#">Envoyer</a>
      </div>
    </div>
  `;
}

function bindSectionEvents() {
  document.querySelectorAll(".site-section").forEach((sectionNode) => {
    sectionNode.addEventListener("click", (event) => {
      const action = event.target.dataset.action;
      const id = sectionNode.dataset.id;
      if (action) {
        event.stopPropagation();
        runAction(action, id);
        return;
      }
      state.selectedId = id;
      render();
    });

    sectionNode.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", sectionNode.dataset.id);
    });

    sectionNode.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    sectionNode.addEventListener("drop", (event) => {
      event.preventDefault();
      const draggedId = event.dataTransfer.getData("text/plain");
      moveSection(draggedId, sectionNode.dataset.id);
    });
  });
}

function moveSection(draggedId, targetId) {
  if (!draggedId || draggedId === targetId) return;
  const draggedIndex = state.sections.findIndex((section) => section.id === draggedId);
  const targetIndex = state.sections.findIndex((section) => section.id === targetId);
  const [dragged] = state.sections.splice(draggedIndex, 1);
  state.sections.splice(targetIndex, 0, dragged);
  state.selectedId = draggedId;
  render();
}

function runAction(action, id) {
  const index = state.sections.findIndex((section) => section.id === id);
  if (action === "delete") {
    state.sections.splice(index, 1);
    state.selectedId = state.sections[index]?.id || state.sections[index - 1]?.id || null;
  }
  if (action === "up" && index > 0) {
    [state.sections[index - 1], state.sections[index]] = [state.sections[index], state.sections[index - 1]];
  }
  if (action === "down" && index < state.sections.length - 1) {
    [state.sections[index + 1], state.sections[index]] = [state.sections[index], state.sections[index + 1]];
  }
  render();
}

function renderInspector() {
  const section = state.sections.find((item) => item.id === state.selectedId);
  if (!section) {
    inspector.innerHTML = `<h2>Bloc sélectionné</h2><p class="muted">Sélectionne un bloc dans l’aperçu.</p>`;
    return;
  }

  const fields = getFields(section).map((field) => {
    if (field.type === "select") {
      return `
        <label>
          ${field.label}
          <select data-field="${field.key}">
            ${field.options.map((option) => `<option value="${option.value}" ${section[field.key] === option.value ? "selected" : ""}>${option.label}</option>`).join("")}
          </select>
        </label>
      `;
    }
    if (field.type === "textarea") {
      return `
        <label>
          ${field.label}
          <textarea data-field="${field.key}">${escapeHtml(section[field.key])}</textarea>
        </label>
      `;
    }
    return `
      <label>
        ${field.label}
        <input data-field="${field.key}" value="${escapeAttribute(section[field.key])}" />
      </label>
    `;
  }).join("");

  inspector.innerHTML = `<h2>Bloc sélectionné</h2>${fields}`;
  inspector.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("change", () => {
      section[input.dataset.field] = input.value;
      render();
    });
  });
}

function getFields(section) {
  const common = {
    navbar: [
      {
        key: "variant",
        label: "Style navbar",
        type: "select",
        options: [
          { value: "classic", label: "Classique" },
          { value: "centered", label: "Menu centré" },
          { value: "cta", label: "Avec bouton CTA" },
          { value: "split", label: "Logo au centre" },
          { value: "dark", label: "Fond sombre" },
        ],
      },
      { key: "title", label: "Nom / logo" },
      { key: "menu", label: "Liens séparés par virgules" },
      {
        key: "behavior",
        label: "Comportement",
        type: "select",
        options: [
          { value: "static", label: "Normale" },
          { value: "fixed", label: "Fixe au scroll" },
          { value: "hide", label: "Disparaît au scroll" },
        ],
      },
    ],
    hero: [
      {
        key: "variant",
        label: "Style hero",
        type: "select",
        options: [
          { value: "split", label: "Texte + image" },
          { value: "centered", label: "Centré" },
          { value: "leftImage", label: "Image à gauche" },
          { value: "band", label: "Bande sombre" },
          { value: "compact", label: "Compact" },
          { value: "editorial", label: "Editorial" },
        ],
      },
      { key: "kicker", label: "Petit titre" },
      { key: "title", label: "Titre" },
      { key: "text", label: "Texte", type: "textarea" },
      { key: "button", label: "Bouton" },
      { key: "image", label: "Label image" },
    ],
    text: [
      { key: "title", label: "Titre" },
      { key: "text", label: "Texte", type: "textarea" },
    ],
    imageText: [
      { key: "title", label: "Titre" },
      { key: "text", label: "Texte", type: "textarea" },
      { key: "image", label: "Label image" },
    ],
    features: [
      {
        key: "variant",
        label: "Style services",
        type: "select",
        options: [
          { value: "cards", label: "Cartes" },
          { value: "list", label: "Liste verticale" },
          { value: "highlight", label: "Premier service mis en avant" },
          { value: "steps", label: "Étapes numérotées" },
        ],
      },
      { key: "title", label: "Titre" },
      { key: "item1", label: "Service 1" },
      { key: "item2", label: "Service 2" },
      { key: "item3", label: "Service 3" },
    ],
    gallery: [{ key: "title", label: "Titre" }],
    contact: [
      { key: "title", label: "Titre" },
      { key: "text", label: "Texte", type: "textarea" },
    ],
  };
  return common[section.type].map((field) => ({ type: "text", ...field }));
}

function navbarClass(section) {
  const variants = {
    classic: "",
    centered: "nav-centered",
    cta: "nav-cta",
    split: "nav-split",
    dark: "nav-dark",
  };
  const behavior = {
    static: "",
    fixed: "fixed",
    hide: "hide-on-scroll",
  };
  return `${variants[section.variant] || ""} ${behavior[section.behavior] || ""}`.trim();
}

function heroClass(variant) {
  return {
    split: "",
    centered: "hero-centered",
    leftImage: "hero-left-image",
    band: "hero-band",
    compact: "hero-compact",
    editorial: "hero-editorial",
  }[variant] || "";
}

function featuresClass(variant) {
  return {
    cards: "",
    list: "features-list",
    highlight: "features-highlight",
    steps: "features-steps",
  }[variant] || "";
}

function saveProject() {
  const projects = getProjects();
  const id = slugify(state.projectName);
  projects[id] = {
    savedAt: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(state)),
  };
  localStorage.setItem("mwm-builder-projects", JSON.stringify(projects));
  renderProjectList();
}

function newProject() {
  state.projectName = "Projet client";
  state.selectedId = null;
  state.sections = [];
  state.theme = {
    primary: "#2563eb",
    secondary: "#f97316",
    background: "#f8fafc",
    font: "Inter, system-ui, sans-serif",
  };
  document.querySelector("#primaryColor").value = state.theme.primary;
  document.querySelector("#secondaryColor").value = state.theme.secondary;
  document.querySelector("#backgroundColor").value = state.theme.background;
  document.querySelector("#fontFamily").value = state.theme.font;
  render();
}

function getProjects() {
  try {
    return JSON.parse(localStorage.getItem("mwm-builder-projects")) || {};
  } catch {
    return {};
  }
}

function renderProjectList() {
  const projects = getProjects();
  const entries = Object.entries(projects);
  if (!entries.length) {
    projectList.innerHTML = `<p class="muted">Aucun projet sauvegardé.</p>`;
    return;
  }

  projectList.innerHTML = entries.map(([id, project]) => `
    <div class="project-item">
      <button class="load-project" data-load="${id}">${escapeHtml(project.data.projectName)}</button>
      <button class="delete-project" data-delete="${id}" title="Supprimer">×</button>
    </div>
  `).join("");

  projectList.querySelectorAll("[data-load]").forEach((button) => {
    button.addEventListener("click", () => loadProject(button.dataset.load));
  });
  projectList.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteProject(button.dataset.delete));
  });
}

function loadProject(id) {
  const project = getProjects()[id];
  if (!project) return;
  Object.assign(state, project.data);
  state.selectedId = null;
  document.querySelector("#primaryColor").value = state.theme.primary;
  document.querySelector("#secondaryColor").value = state.theme.secondary;
  document.querySelector("#backgroundColor").value = state.theme.background;
  document.querySelector("#fontFamily").value = state.theme.font;
  render();
}

function deleteProject(id) {
  const projects = getProjects();
  delete projects[id];
  localStorage.setItem("mwm-builder-projects", JSON.stringify(projects));
  renderProjectList();
}

function slugify(value) {
  return String(value || "projet-client")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "projet-client";
}

function openExport() {
  const output = document.querySelector("#exportOutput");
  output.value = buildExport();
  document.querySelector("#exportDialog").showModal();
}

async function copyExport() {
  const output = document.querySelector("#exportOutput");
  output.select();
  await navigator.clipboard.writeText(output.value);
}

function buildExport() {
  const body = state.sections.map((section) => renderBlock(section)).join("\n");
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Site client</title>
  <style>
    :root {
      --primary: ${state.theme.primary};
      --secondary: ${state.theme.secondary};
      --background: ${state.theme.background};
    }
    body { margin: 0; background: var(--background); font-family: ${state.theme.font}; color: #172033; }
${exportCss()}
  </style>
</head>
<body>
${body}
  <script>
    let lastScroll = window.scrollY;
    document.querySelectorAll(".burger").forEach((burger) => {
      burger.addEventListener("click", () => burger.previousElementSibling.classList.toggle("is-open"));
    });
    window.addEventListener("scroll", () => {
      document.querySelectorAll(".hide-on-scroll").forEach((navbar) => {
        const shouldHide = window.scrollY > lastScroll && window.scrollY > 90;
        navbar.classList.toggle("is-hidden", shouldHide);
      });
      lastScroll = window.scrollY;
    });
  </script>
</body>
</html>`;
}

function exportCss() {
  return `
    .preview-navbar { min-height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 18px 40px; background: #fff; border-bottom: 1px solid #e5e7eb; }
    .preview-navbar.fixed { position: sticky; top: 0; z-index: 3; }
    .preview-navbar.hide-on-scroll { position: sticky; top: 0; z-index: 3; transition: transform .22s ease; }
    .preview-navbar.hide-on-scroll.is-hidden { transform: translateY(-100%); }
    .preview-navbar.nav-centered { justify-content: center; }
    .preview-navbar.nav-centered .preview-logo { position: absolute; left: 40px; }
    .preview-navbar.nav-cta::after { content: "Réserver"; min-height: 38px; display: inline-flex; align-items: center; padding: 0 14px; border-radius: 8px; background: var(--primary); color: #fff; font-weight: 700; }
    .preview-navbar.nav-split .preview-menu span:nth-child(2) { margin-right: 80px; }
    .preview-navbar.nav-dark { background: #111827; color: #fff; border-bottom: 0; }
    .preview-navbar.nav-dark .preview-logo, .preview-navbar.nav-dark .preview-menu { color: #fff; }
    .preview-navbar.nav-dark .burger { filter: invert(1); }
    .preview-logo { font-weight: 800; color: var(--primary); }
    .preview-menu { display: flex; gap: 22px; font-size: 14px; }
    .burger { display: none; width: 32px; height: 24px; background: linear-gradient(#111827,#111827) 0 3px/100% 2px no-repeat, linear-gradient(#111827,#111827) 0 11px/100% 2px no-repeat, linear-gradient(#111827,#111827) 0 19px/100% 2px no-repeat; }
    .preview-hero { display: grid; grid-template-columns: 1.05fr .95fr; gap: 36px; align-items: center; padding: 72px 56px; }
    .preview-hero.hero-centered { grid-template-columns: 1fr; text-align: center; }
    .preview-hero.hero-centered .image-placeholder { max-width: 760px; width: 100%; margin: 8px auto 0; }
    .preview-hero.hero-left-image { grid-template-columns: .9fr 1.1fr; }
    .preview-hero.hero-left-image .image-placeholder { order: -1; }
    .preview-hero.hero-band { grid-template-columns: 1fr; color: #fff; background: #111827; }
    .preview-hero.hero-band p { color: #d0d5dd; }
    .preview-hero.hero-band .image-placeholder { display: none; }
    .preview-hero.hero-compact { grid-template-columns: 1fr .7fr; padding-top: 42px; padding-bottom: 42px; }
    .preview-hero.hero-editorial h2 { font-family: Georgia, serif; font-weight: 500; }
    .preview-kicker { color: var(--secondary); font-weight: 700; text-transform: uppercase; letter-spacing: .08em; font-size: 13px; }
    h2 { margin: 10px 0; font-size: 42px; line-height: 1.05; }
    p { color: #475467; line-height: 1.65; }
    .preview-cta { display: inline-flex; align-items: center; min-height: 42px; margin-top: 14px; padding: 0 18px; border-radius: 8px; background: var(--primary); color: #fff; text-decoration: none; font-weight: 700; }
    .image-placeholder { min-height: 260px; display: grid; place-items: center; background: linear-gradient(135deg, rgba(37,99,235,.18), rgba(249,115,22,.16)), repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(0,0,0,.035) 12px, rgba(0,0,0,.035) 24px); border: 1px dashed #9aa4b2; border-radius: 8px; color: #344054; font-weight: 700; }
    .preview-text, .preview-features, .preview-gallery, .preview-contact { padding: 60px 56px; }
    .preview-image-text { display: grid; grid-template-columns: .9fr 1.1fr; gap: 34px; align-items: center; padding: 64px 56px; background: #fff; }
    .feature-grid, .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px; }
    .feature-card { min-height: 150px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
    .feature-card strong { color: var(--primary); }
    .feature-grid.features-list { grid-template-columns: 1fr; }
    .feature-grid.features-list .feature-card { min-height: 95px; }
    .feature-grid.features-highlight { grid-template-columns: 1.2fr .9fr .9fr; }
    .feature-grid.features-steps { counter-reset: step; }
    .feature-grid.features-steps .feature-card::before { counter-increment: step; content: "0" counter(step); display: block; color: var(--secondary); font-weight: 800; margin-bottom: 12px; }
    .gallery-tile { min-height: 170px; }
    .preview-contact { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: center; background: #111827; color: #fff; }
    .preview-contact p { color: #d0d5dd; }
    .contact-box { display: grid; gap: 10px; }
    .contact-box input, .contact-box textarea { min-height: 39px; border: 1px solid rgba(255,255,255,.22); border-radius: 8px; background: rgba(255,255,255,.1); color: #fff; padding: 8px 10px; }
    .contact-box textarea { min-height: 110px; }
    @media (max-width: 720px) {
      .preview-navbar { padding: 16px 20px; }
      .preview-menu { display: none; }
      .preview-menu.is-open { position: absolute; top: 70px; left: 0; right: 0; display: grid; gap: 0; background: #fff; border-bottom: 1px solid #e5e7eb; }
      .preview-menu.is-open span { padding: 14px 20px; border-top: 1px solid #e5e7eb; }
      .preview-navbar.nav-centered .preview-logo { position: static; }
      .preview-navbar.nav-cta::after { display: none; }
      .burger { display: block; }
      .preview-hero, .preview-image-text, .preview-contact { grid-template-columns: 1fr; padding: 42px 24px; }
      .preview-hero.hero-left-image .image-placeholder { order: 0; }
      .preview-text, .preview-features, .preview-gallery { padding: 42px 24px; }
      h2 { font-size: 31px; }
      .feature-grid, .gallery-grid { grid-template-columns: 1fr; }
    }`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

render();
