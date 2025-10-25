// --- Toggle clair/sombre ---
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// --- Simulateur d'impôts ---
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
  ).textContent = `Impôt estimé : CHF ${impot.toFixed(
    2
  )} • Revenu net : CHF ${net.toFixed(2)}`;
}

// --- Démo tableau vertical de budget ---
const demoBtn = document.getElementById("demoBtn");
const demoSection = document.getElementById("demoBudget");
const tableau = document.getElementById("tableauBudget").querySelector("tbody");
const totalBudget = document.getElementById("totalBudget");

let depenses = JSON.parse(localStorage.getItem("helviiDepenses")) || [];

// Initialisation de la démo
function initDemo() {
  demoSection.style.display = "block";
  setTimeout(() => {
    demoSection.scrollIntoView({ behavior: "smooth" });
  }, 100);
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
// Rendu du tableau
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
// Supprimer une dépense
function supprimerDepense(index) {
  if (confirm(`Supprimer "${depenses[index].categorie}" ?`)) {
    depenses.splice(index, 1);
    sauvegarderDepenses();
    renderTable();
  }
}
function modifierMontant(index, value) {
  depenses[index].montant = parseFloat(value) || 0;
  sauvegarderDepenses();
  renderTable();
}
// Ajouter une dépense
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
function sauvegarderDepenses() {
  localStorage.setItem("helviiDepenses", JSON.stringify(depenses));
}

// Télécharger le PDF
document.getElementById("downloadPDF").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Rapport de budget Helvii", 20, 20);
  doc.setFontSize(12);
  doc.text("Résumé des dépenses mensuelles", 20, 30);

  let y = 45;
  doc.text("Catégorie", 20, y);
  doc.text("Montant (CHF)", 120, y);
  y += 8;
  doc.line(20, y, 180, y); // ligne de séparation
  y += 6;

  depenses.forEach((dep) => {
    doc.text(dep.categorie, 20, y);
    doc.text(dep.montant.toFixed(2), 140, y, { align: "right" });
    y += 8;
  });

  const total = depenses.reduce((a, b) => a + Number(b.montant), 0);
  y += 6;
  doc.line(20, y, 180, y);
  y += 10;
  doc.text("Total mensuel :", 20, y);
  doc.text(`CHF ${total.toFixed(2)}`, 140, y, { align: "right" });

  doc.save("budget-helvii.pdf");
});

// Événements
demoBtn.addEventListener("click", initDemo);
document
  .getElementById("ajouterDepense")
  .addEventListener("click", ajouterDepense);
