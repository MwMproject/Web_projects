// TimberLog CH - core app logic
const STORAGE_KEY = "timberlog_ch_state_v2";

window.chantier = { nom: "", date: "", mandant: "" };
window.billes = [];
window.gpsData = null;

let selectedQ = "";
let volCourant = 0;
let compteur = 1;

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initTabs();
  initChantier();
  initCubage();
  if (typeof initGPS === "function") initGPS();
  initExport();
  initServiceWorker();
  renderListe();
  updateStats();
  document.getElementById("chantier-display").textContent =
    window.chantier.nom || "Aucun chantier";
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    window.chantier = state.chantier || window.chantier;
    window.billes = Array.isArray(state.billes) ? state.billes : [];
    window.gpsData = state.gpsData || null;
    compteur =
      window.billes.reduce((max, bille) => Math.max(max, bille.id || 0), 0) + 1;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      chantier: window.chantier,
      billes: window.billes,
      gpsData: window.gpsData,
    }),
  );
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2500);
}

function updateStats() {
  const total = window.billes.reduce((sum, bille) => sum + bille.volume, 0);
  const last = window.billes[window.billes.length - 1];
  document.getElementById("stat-billes").textContent = String(window.billes.length);
  document.getElementById("stat-volume").textContent = total.toFixed(4);
  document.getElementById("stat-last").textContent = last
    ? last.volume.toFixed(4) + " m3"
    : "-";
}

function initTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      document
        .querySelectorAll(".tab")
        .forEach((item) => item.classList.remove("active"));
      document
        .querySelectorAll(".section")
        .forEach((section) => section.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById("tab-" + target).classList.add("active");

      if (target === "export") buildExportSummary();
    });
  });
}

function initChantier() {
  const overlay = document.getElementById("modal-overlay");
  const btnOpen = document.getElementById("btn-nouveau-chantier");
  const btnClose = document.getElementById("btn-modal-annuler");
  const btnOk = document.getElementById("btn-modal-valider");

  btnOpen.addEventListener("click", () => {
    document.getElementById("nom-chantier").value = window.chantier.nom || "";
    document.getElementById("mandant").value = window.chantier.mandant || "";
    document.getElementById("date-chantier").value =
      window.chantier.date || new Date().toISOString().split("T")[0];
    overlay.classList.add("visible");
  });

  btnClose.addEventListener("click", () => {
    overlay.classList.remove("visible");
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.classList.remove("visible");
  });

  btnOk.addEventListener("click", () => {
    const nom = document.getElementById("nom-chantier").value.trim();
    if (!nom) {
      showToast("Entrez un nom de chantier");
      return;
    }

    window.chantier = {
      nom,
      date: document.getElementById("date-chantier").value,
      mandant: document.getElementById("mandant").value.trim(),
    };

    document.getElementById("chantier-display").textContent = nom;
    overlay.classList.remove("visible");
    saveState();
    showToast('Chantier "' + nom + '" cree');
  });
}

function initCubage() {
  document.getElementById("diametre").addEventListener("input", calcHuber);
  document.getElementById("longueur").addEventListener("input", calcHuber);

  document.querySelectorAll(".q-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedQ = btn.dataset.q;
      document.querySelectorAll(".q-btn").forEach((item) => {
        item.className = "q-btn";
      });
      btn.classList.add("active-" + selectedQ);
    });
  });

  document
    .getElementById("btn-ajouter")
    .addEventListener("click", ajouterBille);
}

function calcHuber() {
  const diametre = parseFloat(document.getElementById("diametre").value);
  const longueur = parseFloat(document.getElementById("longueur").value);

  if (diametre > 0 && longueur > 0) {
    const rayon = diametre / 100 / 2;
    volCourant = Math.PI * rayon * rayon * longueur;
    document.getElementById("result-vol").textContent = volCourant.toFixed(4);
    document.getElementById("result-box").classList.add("visible");
  } else {
    document.getElementById("result-box").classList.remove("visible");
    volCourant = 0;
  }
}

function ajouterBille() {
  const diametre = parseFloat(document.getElementById("diametre").value);
  const longueur = parseFloat(document.getElementById("longueur").value);
  const essence = document.getElementById("essence").value;

  if (!essence) {
    showToast("Choisissez une essence");
    return;
  }
  if (!diametre || diametre <= 0) {
    showToast("Entrez un diametre valide");
    return;
  }
  if (!longueur || longueur <= 0) {
    showToast("Entrez une longueur valide");
    return;
  }
  if (!selectedQ) {
    showToast("Choisissez une qualite");
    return;
  }

  const bille = {
    id: compteur++,
    essence,
    diametre,
    longueur,
    qualite: selectedQ,
    defauts: document.getElementById("defauts").value.trim() || "-",
    volume: volCourant,
  };

  window.billes.push(bille);
  renderListe();
  resetCubageForm();
  updateStats();
  saveState();
  showToast(
    "Bille #" + bille.id + " ajoutee - " + bille.volume.toFixed(4) + " m3",
  );
}

function resetCubageForm() {
  document.getElementById("diametre").value = "";
  document.getElementById("longueur").value = "";
  document.getElementById("defauts").value = "";
  document.getElementById("essence").value = "";
  document.getElementById("result-box").classList.remove("visible");
  document.querySelectorAll(".q-btn").forEach((btn) => (btn.className = "q-btn"));
  selectedQ = "";
  volCourant = 0;
  document.getElementById("diametre").focus();
}

function renderListe() {
  const container = document.getElementById("liste-billes");

  if (!window.billes.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-ico">TL</div>
        <p>Aucune bille enregistree.<br>Commencez par l'onglet Cubage.</p>
      </div>`;
    return;
  }

  const total = window.billes.reduce((sum, bille) => sum + bille.volume, 0);

  const header = `
    <div class="liste-header">
      <span class="liste-count">${window.billes.length} bille(s)</span>
      <span class="liste-total">${total.toFixed(4)} m3</span>
    </div>`;

  const cards = window.billes
    .map(
      (bille) => `
    <div class="bille-card">
      <div>
        <div class="bille-main">#${bille.id} - ${bille.essence}</div>
        <div class="bille-sub">
          diam. ${bille.diametre} cm &times; ${bille.longueur} m
          &nbsp;<span class="badge badge-${bille.qualite}">${bille.qualite}</span>
        </div>
        ${
          bille.defauts !== "-"
            ? `<div class="bille-defaut">! ${bille.defauts}</div>`
            : ""
        }
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="bille-vol">
          ${bille.volume.toFixed(4)}
          <span>m3</span>
        </div>
        <button class="del-btn" onclick="supprimerBille(${bille.id})">x</button>
      </div>
    </div>`,
    )
    .join("");

  container.innerHTML = header + cards;
}

function supprimerBille(id) {
  window.billes = window.billes.filter((bille) => bille.id !== id);
  renderListe();
  updateStats();
  saveState();
  showToast("Bille supprimee");
}

function initExport() {
  document.getElementById("btn-export").addEventListener("click", exporterPDF);
  document
    .getElementById("btn-export-securite")
    .addEventListener("click", exporterPDFSecurite);
  document
    .getElementById("btn-export-billes")
    .addEventListener("click", exporterPDFBilles);
  document
    .getElementById("btn-export-csv")
    .addEventListener("click", exporterCSV);
  document
    .getElementById("btn-reset")
    .addEventListener("click", nouvelleJournee);
}

function buildExportSummary() {
  const container = document.getElementById("export-summary");
  const billes = window.billes;
  const chantier = window.chantier;
  const total = billes.reduce((sum, bille) => sum + bille.volume, 0);

  const byEssence = {};
  const byQualite = { A: 0, B: 0, C: 0, D: 0 };
  billes.forEach((bille) => {
    byEssence[bille.essence] = (byEssence[bille.essence] || 0) + bille.volume;
    byQualite[bille.qualite] = (byQualite[bille.qualite] || 0) + bille.volume;
  });

  const rowsEssence =
    Object.entries(byEssence)
      .map(
        ([essence, volume]) => `
      <div class="summary-row">
        <span>${essence}</span>
        <span>${volume.toFixed(4)} m3</span>
      </div>`,
      )
      .join("") ||
    '<div class="summary-row"><span style="color:var(--text-hint)">Aucune donnee</span></div>';

  const rowsQualite =
    ["A", "B", "C", "D"]
      .filter((qualite) => byQualite[qualite] > 0)
      .map(
        (qualite) => `
      <div class="summary-row">
        <span><span class="badge badge-${qualite}">${qualite}</span></span>
        <span>${byQualite[qualite].toFixed(4)} m3</span>
      </div>`,
      )
      .join("") ||
    '<div class="summary-row"><span style="color:var(--text-hint)">Aucune donnee</span></div>';

  container.innerHTML = `
    <div class="summary-card">
      <div class="summary-title">Chantier</div>
      <div class="summary-row"><span>Nom</span><span>${chantier.nom || "-"}</span></div>
      <div class="summary-row"><span>Date</span><span>${chantier.date || "-"}</span></div>
      <div class="summary-row"><span>Mandant</span><span>${chantier.mandant || "-"}</span></div>
      <div class="summary-row"><span>Billes</span><span>${billes.length}</span></div>
      <div class="summary-total"><span>Volume total</span><span>${total.toFixed(4)} m3</span></div>
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

function exporterCSV() {
  if (!window.billes.length) {
    showToast("Aucune bille a exporter");
    return;
  }

  const rows = [
    ["id", "chantier", "date", "mandant", "essence", "diametre_cm", "longueur_m", "qualite", "defauts", "volume_m3"],
    ...window.billes.map((bille) => [
      bille.id,
      window.chantier.nom || "",
      window.chantier.date || "",
      window.chantier.mandant || "",
      bille.essence,
      bille.diametre,
      bille.longueur,
      bille.qualite,
      bille.defauts,
      bille.volume.toFixed(4),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomFichier("billes").replace(".pdf", ".csv");
  link.click();
  URL.revokeObjectURL(url);
  showToast("CSV exporte");
}

function csvCell(value) {
  const text = String(value ?? "");
  return '"' + text.replace(/"/g, '""') + '"';
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
  updateStats();
  saveState();
  showToast("Nouvelle journee prete");
}

function initServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("assets/sw.js", { scope: "/" })
      .then(() => console.log("TimberLog CH - SW enregistre"))
      .catch((err) => console.warn("SW erreur :", err));
  }
}
