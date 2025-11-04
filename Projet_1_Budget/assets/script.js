/* ===============================
Mode clair / sombre
=============================== */
(function initThemeToggle() {
  const toggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("helviiTheme");
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

/* ===============================
Page d’accueil : Démo budget
=============================== */
(function initDemoBudget() {
  const demoTable = document.getElementById("demoTable");
  if (!demoTable) return;

  const tbody = demoTable.querySelector("tbody");
  const totalCell = document.getElementById("demoTotal");

  let depenses = [
    { categorie: "Loyer", montant: 1500 },
    { categorie: "Assurance", montant: 300 },
    { categorie: "Téléphone / Internet", montant: 120 },
    { categorie: "Courses", montant: 450 },
  ];

  // Ajout d’un bloc pour les nouvelles dépenses
  const demoSection = document.querySelector(".demo-box");
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

  function render() {
    tbody.innerHTML = "";
    let total = 0;
    depenses.forEach((d, i) => {
      total += d.montant;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.categorie}</td>
        <td><input type="number" value="${d.montant}" data-idx="${i}" class="demo-input" /> CHF</td>
      `;
      tbody.appendChild(tr);
    });
    totalCell.textContent = `CHF ${total.toFixed(2)}`;
  }

  tbody.addEventListener("input", (e) => {
    if (e.target.matches(".demo-input")) {
      const idx = e.target.getAttribute("data-idx");
      const val = parseFloat(e.target.value) || 0;
      depenses[idx].montant = val;
      render();
    }
  });

  addBtn.addEventListener("click", () => {
    const cat = newCat.value.trim();
    const amt = parseFloat(newAmt.value);
    if (!cat || isNaN(amt)) {
      alert("Entrez un nom et un montant valides.");
      return;
    }
    depenses.push({ categorie: cat, montant: amt });
    newCat.value = "";
    newAmt.value = "";
    render();
  });

  render();
})();

/* ===============================
Page de connexion / inscription
=============================== */
(function initLoginPage() {
  const loginBox = document.getElementById("loginBox");
  const signupBox = document.getElementById("signupBox");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const showSignup = document.getElementById("showSignup");
  const showLogin = document.getElementById("showLogin");

  if (!loginBox || !signupBox) return;

  // Ouvre directement la création de compte si ?signup
  if (window.location.search.includes("signup")) {
    loginBox.style.display = "none";
    signupBox.style.display = "block";
  }

  // Bascule entre formulaires
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

  // Simulation connexion / inscription
  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    window.location.href = "dashboard.html";
  });

  signupForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    window.location.href = "dashboard.html";
  });
})();
