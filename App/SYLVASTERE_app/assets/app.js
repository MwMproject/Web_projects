// ── ETAT GLOBAL ────────────────────────────────────────
window.chantier = { nom: "", date: "", mandant: "" };
window.billes = [];
window.gpsData = null;

let selectedQ = "";
let volCourant = 0;
let compteur = 1;

// ── INIT ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initChantier();
  initCubage();
  initExport();
  initServiceWorker();
});
// ── TABS ───────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".section")
        .forEach((s) => s.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById("tab-" + target).classList.add("active");

      if (target === "export") buildExportSummary();
    });
  });
}

// ── CHANTIER ───────────────────────────────────────────
function initChantier() {
  const overlay = document.getElementById("modal-overlay");
  const btnOpen = document.getElementById("btn-nouveau-chantier");
  const btnClose = document.getElementById("btn-modal-annuler");
  const btnOk = document.getElementById("btn-modal-valider");

  btnOpen.addEventListener("click", () => {
    if (!document.getElementById("date-chantier").value) {
      document.getElementById("date-chantier").value = new Date()
        .toISOString()
        .split("T")[0];
    }
    overlay.classList.add("visible");
  });

  btnClose.addEventListener("click", () => {
    overlay.classList.remove("visible");
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("visible");
  });

  btnOk.addEventListener("click", () => {
    const nom = document.getElementById("nom-chantier").value.trim();
    if (!nom) {
      showToast("Entrez un nom de chantier");
      return;
    }

    window.chantier = {
      nom: nom,
      date: document.getElementById("date-chantier").value,
      mandant: document.getElementById("mandant").value.trim(),
    };

    document.getElementById("chantier-display").textContent = nom;
    overlay.classList.remove("visible");
    showToast('Chantier "' + nom + '" cree');
  });
}

// ── CUBAGE ─────────────────────────────────────────────
function initCubage() {
  // Calcul en temps reel
  document.getElementById("diametre").addEventListener("input", calcHuber);
  document.getElementById("longueur").addEventListener("input", calcHuber);

  // Boutons qualite
  document.querySelectorAll(".q-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedQ = btn.dataset.q;
      document.querySelectorAll(".q-btn").forEach((b) => {
        b.className = "q-btn";
      });
      btn.classList.add("active-" + selectedQ);
    });
  });

  // Ajouter bille
  document
    .getElementById("btn-ajouter")
    .addEventListener("click", ajouterBille);
}

function calcHuber() {
  const d = parseFloat(document.getElementById("diametre").value);
  const l = parseFloat(document.getElementById("longueur").value);

  if (d > 0 && l > 0) {
    const r = d / 100 / 2;
    volCourant = Math.PI * r * r * l;
    document.getElementById("result-vol").textContent = volCourant.toFixed(4);
    document.getElementById("result-box").classList.add("visible");
  } else {
    document.getElementById("result-box").classList.remove("visible");
    volCourant = 0;
  }
}

function ajouterBille() {
  const d = parseFloat(document.getElementById("diametre").value);
  const l = parseFloat(document.getElementById("longueur").value);
  const ess = document.getElementById("essence").value;

  if (!ess) {
    showToast("Choisissez une essence");
    return;
  }
  if (!d || d <= 0) {
    showToast("Entrez un diametre valide");
    return;
  }
  if (!l || l <= 0) {
    showToast("Entrez une longueur valide");
    return;
  }
  if (!selectedQ) {
    showToast("Choisissez une qualite");
    return;
  }

  const bille = {
    id: compteur++,
    essence: ess,
    diametre: d,
    longueur: l,
    qualite: selectedQ,
    defauts: document.getElementById("defauts").value.trim() || "—",
    volume: volCourant,
  };

  window.billes.push(bille);
  renderListe();
  resetCubageForm();
  showToast(
    "Bille #" + bille.id + " ajoutee — " + bille.volume.toFixed(4) + " m³",
  );
}

function resetCubageForm() {
  document.getElementById("diametre").value = "";
  document.getElementById("longueur").value = "";
  document.getElementById("defauts").value = "";
  document.getElementById("essence").value = "";
  document.getElementById("result-box").classList.remove("visible");
  document.querySelectorAll(".q-btn").forEach((b) => (b.className = "q-btn"));
  selectedQ = "";
  volCourant = 0;
}

// ── LISTE BILLES ───────────────────────────────────────
function renderListe() {
  const container = document.getElementById("liste-billes");

  if (!window.billes.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-ico">🪵</div>
        <p>Aucune bille enregistree.<br>Commencez par l'onglet Cubage.</p>
      </div>`;
    return;
  }

  const total = window.billes.reduce((s, b) => s + b.volume, 0);

  const header = `
    <div class="liste-header">
      <span class="liste-count">${window.billes.length} bille(s)</span>
      <span class="liste-total">${total.toFixed(4)} m³</span>
    </div>`;

  const cards = window.billes
    .map(
      (b) => `
    <div class="bille-card">
      <div>
        <div class="bille-main">#${b.id} — ${b.essence}</div>
        <div class="bille-sub">
          ∅ ${b.diametre} cm &times; ${b.longueur} m
          &nbsp;<span class="badge badge-${b.qualite}">${b.qualite}</span>
        </div>
        ${
          b.defauts !== "—"
            ? `<div class="bille-defaut">⚠ ${b.defauts}</div>`
            : ""
        }
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="bille-vol">
          ${b.volume.toFixed(4)}
          <span>m³</span>
        </div>
        <button class="del-btn" onclick="supprimerBille(${b.id})">✕</button>
      </div>
    </div>`,
    )
    .join("");

  container.innerHTML = header + cards;
}

function supprimerBille(id) {
  window.billes = window.billes.filter((b) => b.id !== id);
  renderListe();
  showToast("Bille supprimee");
}

// ── EXPORT ─────────────────────────────────────────────
function initExport() {
  document.getElementById("btn-export").addEventListener("click", exporterPDF);
  document
    .getElementById("btn-export-securite")
    .addEventListener("click", exporterPDFSecurite);
  document
    .getElementById("btn-export-billes")
    .addEventListener("click", exporterPDFBilles);
  document
    .getElementById("btn-reset")
    .addEventListener("click", nouvelleJournee);
}

function buildExportSummary() {
  const container = document.getElementById("export-summary");
  const billes = window.billes;
  const chantier = window.chantier;
  const total = billes.reduce((s, b) => s + b.volume, 0);

  const byEssence = {};
  const byQualite = { A: 0, B: 0, C: 0, D: 0 };
  billes.forEach((b) => {
    byEssence[b.essence] = (byEssence[b.essence] || 0) + b.volume;
    byQualite[b.qualite] = (byQualite[b.qualite] || 0) + b.volume;
  });

  const rowsEssence =
    Object.entries(byEssence)
      .map(
        ([e, v]) => `
      <div class="summary-row">
        <span>${e}</span>
        <span>${v.toFixed(4)} m³</span>
      </div>`,
      )
      .join("") ||
    '<div class="summary-row"><span style="color:var(--text-hint)">Aucune donnee</span></div>';

  const rowsQualite =
    ["A", "B", "C", "D"]
      .filter((q) => byQualite[q] > 0)
      .map(
        (q) => `
      <div class="summary-row">
        <span><span class="badge badge-${q}">${q}</span></span>
        <span>${byQualite[q].toFixed(4)} m³</span>
      </div>`,
      )
      .join("") ||
    '<div class="summary-row"><span style="color:var(--text-hint)">Aucune donnee</span></div>';

  container.innerHTML = `
    <div class="summary-card">
      <div class="summary-title">Chantier</div>
      <div class="summary-row"><span>Nom</span><span>${chantier.nom || "—"}</span></div>
      <div class="summary-row"><span>Date</span><span>${chantier.date || "—"}</span></div>
      <div class="summary-row"><span>Mandant</span><span>${chantier.mandant || "—"}</span></div>
      <div class="summary-row"><span>Billes</span><span>${billes.length}</span></div>
      <div class="summary-total"><span>Volume total</span><span>${total.toFixed(4)} m³</span></div>
    </div>
    <div class="summary-card">
      <div class="summary-title">Par essence</div>
      ${rowsEssence}
    </div>
    <div class="summary-card">
      <div class="summary-title">Par qualite</div>
      ${rowsQualite}
    </div>`;
}

function nouvelleJournee() {
  if (!confirm("Nouvelle journee ? Toutes les billes seront effacees.")) return;
  window.billes = [];
  window.chantier = { nom: "", date: "", mandant: "" };
  window.gpsData = null;
  compteur = 1;
  selectedQ = "";
  volCourant = 0;
  document.getElementById("chantier-display").textContent = "Aucun chantier";
  document.getElementById("nom-chantier").value = "";
  document.getElementById("date-chantier").value = "";
  document.getElementById("mandant").value = "";
  renderListe();
  showToast("Nouvelle journee prete");
}

// ── TOAST ──────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2500);
}

// ── SERVICE WORKER ─────────────────────────────────────
function initServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("assets/sw.js", { scope: "/" })
      .then(() => console.log("Sylvastere — SW enregistre"))
      .catch((err) => console.warn("SW erreur :", err));
  }
}
