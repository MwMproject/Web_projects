/* ============================
   Thème clair / sombre
============================ */
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

/* ============================
   Simulateur d'impôts
============================ */
function calculerImpots() {
  const revenu = parseFloat(document.getElementById("revenu").value);
  const canton = document.getElementById("canton").value;
  const taux = {
    Vaud: 0.14,
    Genève: 0.14,
    Fribourg: 0.1387,
  };

  if (!revenu) {
    document.getElementById("resultat").textContent =
      "Veuillez entrer un revenu.";
    return;
  }

  const impot = revenu * (taux[canton] || 0.12);
  const net = revenu - impot;

  document.getElementById(
    "resultat"
  ).textContent = `Impôt estimé par  mois : CHF
  ${impot.toFixed(2)} Revenu net : CHF ${net.toFixed(2)}`;
}

/* ============================
   Démo : gestion de budget
============================ */

// Sélecteurs principaux
const demoBtn = document.getElementById("demoBtn");
const demoSection = document.getElementById("demoBudget");
const tableau = document.getElementById("tableauBudget").querySelector("tbody");
const totalBudget = document.getElementById("totalBudget");

// Données en localStorage
let depenses = JSON.parse(localStorage.getItem("helviiDepenses")) || [];

// Sélecteurs de période
const moisSelect = document.getElementById("moisSelect");
const anneeSelect = document.getElementById("anneeSelect");
const titreBudget = document.getElementById("titreBudget");

/* --- Période : sauvegarde et chargement --- */
function sauvegarderPeriode() {
  const periode = { mois: moisSelect.value, annee: anneeSelect.value };
  localStorage.setItem("helviiPeriode", JSON.stringify(periode));
  majTitreBudget();
}

function majTitreBudget() {
  titreBudget.textContent = `Budget de ${moisSelect.value} ${anneeSelect.value}`;
}

function chargerPeriode() {
  const saved = JSON.parse(localStorage.getItem("helviiPeriode"));
  if (saved) {
    moisSelect.value = saved.mois;
    anneeSelect.value = saved.annee;
  } else {
    const now = new Date();
    const moisFrancais = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    moisSelect.value = moisFrancais[now.getMonth()];
    anneeSelect.value = now.getFullYear();
  }
  majTitreBudget();
}

// Événements pour la sélection de période
if (moisSelect && anneeSelect) {
  moisSelect.addEventListener("change", sauvegarderPeriode);
  anneeSelect.addEventListener("change", sauvegarderPeriode);
}

/* --- Initialisation de la démo --- */
function initDemo() {
  demoSection.style.display = "block";

  // Scroll fluide vers la section
  setTimeout(() => demoSection.scrollIntoView({ behavior: "smooth" }), 100);

  // Charge la période
  chargerPeriode();

  // Données par défaut
  if (depenses.length === 0) {
    depenses = [
      { categorie: "Loyer", montant: 1400 },
      { categorie: "Assurance", montant: 350 },
      { categorie: "Téléphone / Internet", montant: 120 },
    ];
  }

  renderTable();
  sauvegarderDepenses();
}

/* --- Gestion du tableau --- */
function renderTable() {
  tableau.innerHTML = "";

  depenses.forEach((dep, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dep.categorie}</td>
      <td><input type="number" value="${dep.montant}" onchange="modifierMontant(${index}, this.value)"> CHF</td>
      <td><button class="delete-btn" onclick="supprimerDepense(${index})">🗑️</button></td>
    `;
    tableau.appendChild(tr);
  });

  const total = depenses.reduce((a, b) => a + Number(b.montant), 0);
  totalBudget.textContent = `CHF ${total.toFixed(2)}`;
}

function modifierMontant(index, value) {
  depenses[index].montant = parseFloat(value) || 0;
  sauvegarderDepenses();
  renderTable();
}

function ajouterDepense() {
  const cat = document.getElementById("nouvelleCategorie").value.trim();
  const montant = parseFloat(document.getElementById("nouveauMontant").value);

  if (!cat || isNaN(montant)) {
    alert("Veuillez entrer un nom et un montant valide.");
    return;
  }

  depenses.push({ categorie: cat, montant });
  document.getElementById("nouvelleCategorie").value = "";
  document.getElementById("nouveauMontant").value = "";
  sauvegarderDepenses();
  renderTable();
}

function supprimerDepense(index) {
  if (confirm(`Supprimer "${depenses[index].categorie}" ?`)) {
    depenses.splice(index, 1);
    sauvegarderDepenses();
    renderTable();
  }
}

function sauvegarderDepenses() {
  localStorage.setItem("helviiDepenses", JSON.stringify(depenses));
}

/* --- Génération du PDF --- */
const downloadBtn = document.getElementById("downloadPDF");
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // === Couleurs & Styles ===
    const rougeHelvii = "#E03C31";
    const grisClair = "#F5F5F5";
    const texteNoir = "#333";

    // === En-tête ===
    doc.setFillColor(rougeHelvii);
    doc.rect(0, 0, 600, 60, "F");
    doc.setTextColor("#fff");
    doc.setFontSize(20);
    doc.text("Helvii", 40, 38);
    doc.setFontSize(12);
    doc.text("Rapport de budget mensuel", 120, 38);

    // === Infos de période ===
    doc.setTextColor(texteNoir);
    doc.setFontSize(11);
    const today = new Date().toLocaleDateString("fr-CH");
    doc.text(`Mois : ${moisSelect.value} ${anneeSelect.value}`, 40, 90);
    doc.text(`Date : ${today}`, 450, 90);

    // === Ligne de séparation ===
    doc.setDrawColor(rougeHelvii);
    doc.setLineWidth(1);
    doc.line(40, 100, 550, 100);

    // === Tableau ===
    let y = 130;
    doc.setFont("helvetica", "bold");
    doc.text("Catégorie", 60, y);
    doc.text("Montant (CHF)", 430, y);
    doc.setFont("helvetica", "normal");

    y += 10;
    doc.setDrawColor("#ccc");
    doc.line(40, y, 550, y);
    y += 20;

    depenses.forEach((dep) => {
      doc.text(dep.categorie, 60, y);
      doc.text(dep.montant.toFixed(2), 500, y, { align: "right" });
      y += 20;
    });

    // === Total ===
    y += 10;
    doc.setDrawColor(rougeHelvii);
    doc.line(40, y, 550, y);
    const total = depenses.reduce((a, b) => a + Number(b.montant), 0);
    y += 25;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(rougeHelvii);
    doc.text("TOTAL", 60, y);
    doc.text(`CHF ${total.toFixed(2)}`, 500, y, { align: "right" });

    // === Pied de page ===
    doc.setFont("helvetica", "italic");
    doc.setTextColor("#777");
    doc.setFontSize(10);
    doc.text("Merci d’utiliser Helvii 🇨🇭 — www.helvii.ch", 180, 780);

    // === Sauvegarde ===
    doc.save(`budget-${moisSelect.value}-${anneeSelect.value}.pdf`);
  });
}

/*  Gestion du profil utilisateur */
const profilForm = document.getElementById("profilForm");
const profilMessage = document.getElementById("profilMessage");

// Charger le profil existant
function chargerProfil() {
  const data = JSON.parse(localStorage.getItem("helviiProfil"));
  if (data) {
    document.getElementById("salaire").value = data.salaire || "";
    document.getElementById("loyer").value = data.loyer || "";
    document.getElementById("assurance").value = data.assurance || "";
    document.getElementById("domicile").value = data.domicile || "";
    document.getElementById("travail").value = data.travail || "";
    document.getElementById("distance").value = data.distance || "";
    document.getElementById("transport").value = data.transport || "voiture";
    document.getElementById("statut").value = data.statut || "celibataire";
  }
}

function sauvegarderProfil(e) {
  e.preventDefault();
  const profil = {
    salaire: parseFloat(document.getElementById("salaire").value),
    loyer: parseFloat(document.getElementById("loyer").value),
    assurance: parseFloat(document.getElementById("assurance").value),
    domicile: document.getElementById("domicile").value,
    travail: document.getElementById("travail").value,
    distance: parseFloat(document.getElementById("distance").value),
    transport: document.getElementById("transport").value,
    statut: document.getElementById("statut").value,
  };

  localStorage.setItem("helviiProfil", JSON.stringify(profil));
  profilMessage.textContent = "✅ Profil enregistré avec succès !";

  setTimeout(() => (profilMessage.textContent = ""), 3000);
}

// Initialisation
if (profilForm) {
  profilForm.addEventListener("submit", sauvegarderProfil);
  chargerProfil();
}

/* ============================
  Événements généraux
============================ */
demoBtn.addEventListener("click", initDemo);
document
  .getElementById("ajouterDepense")
  .addEventListener("click", ajouterDepense);
