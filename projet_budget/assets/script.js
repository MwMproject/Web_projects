/* =========================================================
-------------------- Mode clair / sombre -------------------
========================================================= */
(function initThemeToggle() {
  const toggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("helviiTheme");

  // Applique le thème sauvegardé
  if (savedTheme === "dark")
    document.documentElement.classList.add("dark-mode");

  if (toggle) {
    toggle.textContent = document.documentElement.classList.contains(
      "dark-mode"
    )
      ? "☀️"
      : "🌑";

    toggle.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark-mode");
      const theme = document.documentElement.classList.contains("dark-mode")
        ? "dark"
        : "light";
      localStorage.setItem("helviiTheme", theme);
      toggle.textContent = theme === "dark" ? "☀️" : "🌑";
    });
  }
})();

/* =========================================================
---------------- Démo budget (page d’accueil ---------------
========================================================= */
(function initDemoBudget() {
  const demoTable = document.getElementById("demoTable");
  if (!demoTable) return;

  const tbody = demoTable.querySelector("tbody");
  const totalCell = document.getElementById("demoTotal");
  const demoSection = document.querySelector(".demo-box");

  // 🧾 Frais de base réalistes
  let depenses = JSON.parse(localStorage.getItem("demoDepenses")) || [
    { categorie: "Loyer / Hypothèque", montant: 1800 },
    { categorie: "Assurance maladie", montant: 350 },
    { categorie: "Téléphone / Internet", montant: 120 },
    { categorie: "Transports / essence", montant: 180 },
    { categorie: "Courses / alimentation", montant: 500 },
    { categorie: "Impôts (provision)", montant: 300 },
    { categorie: "Loisirs / sorties", montant: 150 },
    { categorie: "Autres dépenses", montant: 100 },
  ];

  /* === Bloc d’ajout === */
  const ajout = document.createElement("div");
  ajout.className = "ajout-demo";
  ajout.innerHTML = `
    <input type="text" id="newDemoCat" placeholder="Nouvelle dépense" />
    <input type="number" id="newDemoAmt" placeholder="Montant" />
    <button id="addDemoBtn" class="btn-small">+ Ajouter</button>
  `;
  demoSection.appendChild(ajout);

  const newCat = ajout.querySelector("#newDemoCat");
  const newAmt = ajout.querySelector("#newDemoAmt");
  const addBtn = ajout.querySelector("#addDemoBtn");

  /* === Bouton PDF === */
  const pdfBtn = document.createElement("button");
  pdfBtn.textContent = "📄 Télécharger le PDF";
  pdfBtn.className = "btn-cta";
  pdfBtn.style.marginTop = "20px";
  demoSection.appendChild(pdfBtn);

  /* === Rendu du tableau === */
  function render() {
    tbody.innerHTML = "";
    let total = 0;

    depenses.forEach((d, i) => {
      total += d.montant;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.categorie}</td>
        <td>
          <input type="number" value="${d.montant}" data-idx="${i}" class="demo-input" />
          CHF
          <button class="delete-btn" data-idx="${i}" title="Supprimer">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    totalCell.textContent = `💵 Total : CHF ${total.toFixed(2)}`;
    localStorage.setItem("demoDepenses", JSON.stringify(depenses));
  }

  /* === Écouteurs d’événements === */
  tbody.addEventListener("input", (e) => {
    if (e.target.matches(".demo-input")) {
      const idx = e.target.getAttribute("data-idx");
      const val = parseFloat(e.target.value) || 0;
      depenses[idx].montant = val;
      render();
    }
  });

  tbody.addEventListener("click", (e) => {
    if (e.target.matches(".delete-btn")) {
      const idx = e.target.getAttribute("data-idx");
      depenses.splice(idx, 1);
      render();
    }
  });

  addBtn.addEventListener("click", () => {
    const cat = newCat.value.trim();
    const amt = parseFloat(newAmt.value);
    if (!cat || isNaN(amt)) {
      alert("Veuillez entrer un nom et un montant valides.");
      return;
    }
    depenses.push({ categorie: cat, montant: amt });
    newCat.value = "";
    newAmt.value = "";
    render();
  });

  /* === Génération du PDF === */
  pdfBtn.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // === En-tête ===
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(224, 60, 49);
    doc.text("Rapport de budget - Helvii", 40, 60);

    // === Date ===
    doc.setFontSize(11);
    doc.setTextColor(80);
    const date = new Date().toLocaleDateString("fr-CH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`Généré le ${date}`, 40, 85);

    // === Tableau ===
    let y = 130;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text("Catégorie", 40, y);
    doc.text("Montant (CHF)", 400, y);

    doc.setFont("Helvetica", "normal");
    y += 20;
    let total = 0;

    depenses.forEach((d) => {
      total += d.montant;
      doc.text(d.categorie, 40, y);
      doc.text(`${d.montant.toFixed(2)}`, 420, y, { align: "right" });
      y += 20;
    });

    // === Ligne de total ===
    y += 10;
    doc.setDrawColor(224, 60, 49);
    doc.line(40, y, 520, y);
    y += 25;
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(224, 60, 49);
    doc.text(`TOTAL : CHF ${total.toFixed(2)}`, 420, y, { align: "right" });

    // === Pied de page ===
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      "Helvii.ch — Application de gestion budgétaire suisse [CH]",
      40,
      800
    );

    doc.save(`Budget_Helvii_${date.replace(/\s/g, "_")}.pdf`);
  });

  render();
})();

/* =========================================================
 ------------------ Page Login / Inscription ---------------
========================================================= */
(function initLoginPage() {
  const loginBox = document.getElementById("loginBox");
  const signupBox = document.getElementById("signupBox");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const showSignup = document.getElementById("showSignup");
  const showLogin = document.getElementById("showLogin");

  if (!loginBox || !signupBox) return;

  // Si ?signup => ouvre directement le formulaire de création
  if (window.location.search.includes("signup")) {
    loginBox.style.display = "none";
    signupBox.style.display = "block";
  }

  // Bascule manuelle entre les deux formulaires
  showSignup.addEventListener("click", (e) => {
    e.preventDefault();
    loginBox.style.display = "none";
    signupBox.style.display = "block";
  });

  showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    signupBox.style.display = "none";
    loginBox.style.display = "block";
  });

  // Simule la connexion / inscription
  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    window.location.href = "dashboard.html";
  });

  signupForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    window.location.href = "dashboard.html";
  });
})();
