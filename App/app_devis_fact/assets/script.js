// =============================================
// FACTUREPRO — app.js
// LocalStorage-based SaaS for quotes & invoices
// =============================================

// ===== DATA LAYER =====
const DB = {
  get: (key) => JSON.parse(localStorage.getItem("fp_" + key) || "[]"),
  set: (key, val) => localStorage.setItem("fp_" + key, JSON.stringify(val)),
  getOne: (key) => JSON.parse(localStorage.getItem("fp_" + key) || "null"),
  setOne: (key, val) => localStorage.setItem("fp_" + key, JSON.stringify(val)),
};

const getData = (key) => DB.get(key);
const saveData = (key, arr) => DB.set(key, arr);
const getParams = () => DB.getOne("params") || {};
const saveParams = (p) => DB.setOne("params", p);

// ===== UTILS =====
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmt = (n) => parseFloat(n || 0).toFixed(2);
const fmtMoney = (n) => fmt(n) + " CHF";
const today = () => new Date().toISOString().slice(0, 10);

function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  setTimeout(() => (t.className = "toast"), 2600);
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

function badgeHtml(status) {
  const map = {
    brouillon: ["badge-brouillon", "Brouillon"],
    envoye: ["badge-envoye", "Envoyé"],
    accepte: ["badge-accepte", "Accepté"],
    refuse: ["badge-refuse", "Refusé"],
    envoyee: ["badge-envoyee", "Envoyée"],
    payee: ["badge-payee", "Payée"],
    retard: ["badge-retard", "En retard"],
  };
  const [cls, label] = map[status] || ["badge-brouillon", status];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ===== NAVIGATION =====
function navigate(page) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  const pageEl = document.getElementById("page-" + page);
  if (pageEl) pageEl.classList.add("active");
  document
    .querySelectorAll(`[data-page="${page}"]`)
    .forEach((el) => el.classList.add("active"));
  renderPage(page);
}

function renderPage(page) {
  const map = {
    dashboard: renderDashboard,
    prestations: renderPrestations,
    clients: renderClients,
    devis: renderDevis,
    factures: renderFactures,
    parametres: renderParametres,
  };
  if (map[page]) map[page]();
}

// ===== DASHBOARD =====
function renderDashboard() {
  const devis = getData("devis");
  const factures = getData("factures");

  const caTotal = factures
    .filter((f) => f.status === "payee")
    .reduce((s, f) => s + parseFloat(f.totalTTC || 0), 0);
  const enAttente = factures
    .filter((f) => f.status === "envoyee")
    .reduce((s, f) => s + parseFloat(f.totalTTC || 0), 0);
  const enRetard = factures.filter((f) => f.status === "retard").length;
  const devisAcceptes = devis.filter((d) => d.status === "accepte").length;

  document.getElementById("stats-grid").innerHTML = `
      <div class="stat-card green">
        <div class="stat-label">CA Encaissé</div>
        <div class="stat-value">${fmtMoney(caTotal)}</div>
        <div class="stat-sub">Factures payées</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-label">En attente</div>
        <div class="stat-value">${fmtMoney(enAttente)}</div>
        <div class="stat-sub">Factures envoyées</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">En retard</div>
        <div class="stat-value">${enRetard}</div>
        <div class="stat-sub">Factures en retard</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-label">Devis acceptés</div>
        <div class="stat-value">${devisAcceptes}</div>
        <div class="stat-sub">Total: ${devis.length} devis</div>
      </div>
    `;

  const recentDevis = [...devis]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const pendingFactures = factures
    .filter((f) => f.status !== "payee")
    .slice(0, 5);

  document.getElementById("recent-devis-list").innerHTML = recentDevis.length
    ? recentDevis
        .map(
          (d) => `
          <div class="mini-list-item">
            <div class="mini-list-left">
              <span class="mini-list-num">${d.numero}</span>
              <span class="mini-list-client">${getClientName(d.clientId)}</span>
            </div>
            <div class="mini-list-right">
              <span class="mini-list-amount">${fmtMoney(d.totalTTC)}</span>
              ${badgeHtml(d.status)}
            </div>
          </div>`
        )
        .join("")
    : '<div class="empty-state">Aucun devis pour l\'instant</div>';

  document.getElementById("pending-factures-list").innerHTML =
    pendingFactures.length
      ? pendingFactures
          .map(
            (f) => `
          <div class="mini-list-item">
            <div class="mini-list-left">
              <span class="mini-list-num">${f.numero}</span>
              <span class="mini-list-client">${getClientName(f.clientId)}</span>
            </div>
            <div class="mini-list-right">
              <span class="mini-list-amount">${fmtMoney(f.totalTTC)}</span>
              ${badgeHtml(f.status)}
            </div>
          </div>`
          )
          .join("")
      : '<div class="empty-state">Aucune facture en attente</div>';
}

// ===== PRESTATIONS =====
function renderPrestations(filter = "") {
  const prestations = getData("prestations");
  const cats = [
    ...new Set(prestations.map((p) => p.categorie).filter(Boolean)),
  ];
  const catFilter = document.getElementById("filter-categorie-prest").value;

  // Update datalist
  document.getElementById("categories-list").innerHTML = cats
    .map((c) => `<option value="${c}">`)
    .join("");

  // Update filter options
  const sel = document.getElementById("filter-categorie-prest");
  const currentVal = sel.value;
  sel.innerHTML =
    '<option value="">Toutes les catégories</option>' +
    cats
      .map(
        (c) =>
          `<option value="${c}" ${
            c === currentVal ? "selected" : ""
          }>${c}</option>`
      )
      .join("");

  const searchVal = document
    .getElementById("search-prestations")
    .value.toLowerCase();
  const filtered = prestations.filter((p) => {
    const matchSearch =
      !searchVal ||
      p.nom.toLowerCase().includes(searchVal) ||
      (p.fournisseur || "").toLowerCase().includes(searchVal);
    const matchCat = !catFilter || p.categorie === catFilter;
    return matchSearch && matchCat;
  });

  document.getElementById("tbody-prestations").innerHTML = filtered.length
    ? filtered
        .map(
          (p) => `
          <tr>
            <td><strong>${p.nom}</strong>${
            p.description
              ? `<br><small style="color:var(--text3)">${p.description}</small>`
              : ""
          }</td>
            <td>${
              p.categorie
                ? `<span class="badge" style="background:var(--accent-dim);color:var(--accent)">${p.categorie}</span>`
                : "—"
            }</td>
            <td>${p.unite}</td>
            <td style="font-family:var(--font-display);font-weight:600">${fmtMoney(
              p.prix
            )}</td>
            <td>${p.fournisseur || "—"}</td>
            <td>${
              p.ref
                ? `<code style="font-size:12px;color:var(--text3)">${p.ref}</code>`
                : "—"
            }</td>
            <td class="table-actions">
              <button class="btn-icon" onclick="editPrestation('${
                p.id
              }')" title="Modifier">✏️</button>
              <button class="btn-icon btn-danger" onclick="deletePrestation('${
                p.id
              }')" title="Supprimer">🗑</button>
            </td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text3)">Aucune prestation trouvée</td></tr>`;
}

function openPrestationModal(prest = null) {
  document.getElementById("modal-prestation-title").textContent = prest
    ? "Modifier la prestation"
    : "Nouvelle prestation";
  document.getElementById("prest-id").value = prest ? prest.id : "";
  document.getElementById("prest-nom").value = prest ? prest.nom : "";
  document.getElementById("prest-categorie").value = prest
    ? prest.categorie || ""
    : "";
  document.getElementById("prest-unite").value = prest ? prest.unite : "m²";
  document.getElementById("prest-prix").value = prest ? prest.prix : "";
  document.getElementById("prest-fournisseur").value = prest
    ? prest.fournisseur || ""
    : "";
  document.getElementById("prest-ref").value = prest ? prest.ref || "" : "";
  document.getElementById("prest-desc").value = prest
    ? prest.description || ""
    : "";
  openModal("modal-prestation");
}

function savePrestation() {
  const nom = document.getElementById("prest-nom").value.trim();
  const prix = document.getElementById("prest-prix").value;
  if (!nom) return showToast("Le nom est obligatoire", "error");
  if (prix === "" || isNaN(prix))
    return showToast("Le prix est obligatoire", "error");

  const prestations = getData("prestations");
  const id = document.getElementById("prest-id").value;

  const data = {
    id: id || uid(),
    nom,
    categorie: document.getElementById("prest-categorie").value.trim(),
    unite: document.getElementById("prest-unite").value,
    prix: parseFloat(prix),
    fournisseur: document.getElementById("prest-fournisseur").value.trim(),
    ref: document.getElementById("prest-ref").value.trim(),
    description: document.getElementById("prest-desc").value.trim(),
  };

  if (id) {
    const idx = prestations.findIndex((p) => p.id === id);
    prestations[idx] = data;
    showToast("Prestation mise à jour ✓");
  } else {
    prestations.push(data);
    showToast("Prestation ajoutée ✓");
  }

  saveData("prestations", prestations);
  closeModal("modal-prestation");
  renderPrestations();
}

function editPrestation(id) {
  const p = getData("prestations").find((p) => p.id === id);
  if (p) openPrestationModal(p);
}

function deletePrestation(id) {
  if (!confirm("Supprimer cette prestation ?")) return;
  saveData(
    "prestations",
    getData("prestations").filter((p) => p.id !== id)
  );
  showToast("Prestation supprimée");
  renderPrestations();
}

// ===== CLIENTS =====
function getClientName(id) {
  const c = getData("clients").find((c) => c.id === id);
  if (!c) return "Client inconnu";
  return c.entreprise ? `${c.entreprise}` : `${c.prenom} ${c.nom}`;
}
function getClient(id) {
  return getData("clients").find((c) => c.id === id);
}

function renderClients() {
  const clients = getData("clients");
  const searchVal = document
    .getElementById("search-clients")
    .value.toLowerCase();
  const filtered = clients.filter((c) => {
    const name = `${c.prenom} ${c.nom} ${c.entreprise || ""}`.toLowerCase();
    return !searchVal || name.includes(searchVal);
  });

  document.getElementById("clients-grid").innerHTML = filtered.length
    ? filtered
        .map(
          (c) => `
          <div class="client-card">
            <div class="client-card-name">${c.prenom} ${c.nom}</div>
            ${
              c.entreprise
                ? `<div class="client-card-company">${c.entreprise}</div>`
                : ""
            }
            <div class="client-card-info">
              ${c.email ? `📧 ${c.email}<br>` : ""}
              ${c.tel ? `📞 ${c.tel}<br>` : ""}
              ${c.ville ? `📍 ${c.cp || ""} ${c.ville}` : ""}
            </div>
            <div class="client-card-actions">
              <button class="btn-icon" onclick="editClient('${
                c.id
              }')" title="Modifier">✏️</button>
              <button class="btn-icon btn-danger" onclick="deleteClient('${
                c.id
              }')" title="Supprimer">🗑</button>
            </div>
          </div>`
        )
        .join("")
    : '<div class="empty-state" style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text3)">Aucun client trouvé</div>';
}

function openClientModal(client = null) {
  document.getElementById("modal-client-title").textContent = client
    ? "Modifier le client"
    : "Nouveau client";
  document.getElementById("client-id").value = client ? client.id : "";
  document.getElementById("client-type").value = client
    ? client.type
    : "particulier";
  document.getElementById("client-entreprise").value = client
    ? client.entreprise || ""
    : "";
  document.getElementById("client-prenom").value = client ? client.prenom : "";
  document.getElementById("client-nom").value = client ? client.nom : "";
  document.getElementById("client-adresse").value = client
    ? client.adresse || ""
    : "";
  document.getElementById("client-cp").value = client ? client.cp || "" : "";
  document.getElementById("client-ville").value = client
    ? client.ville || ""
    : "";
  document.getElementById("client-pays").value = client
    ? client.pays || ""
    : "";
  document.getElementById("client-email").value = client
    ? client.email || ""
    : "";
  document.getElementById("client-tel").value = client ? client.tel || "" : "";
  openModal("modal-client");
}

function saveClient() {
  const prenom = document.getElementById("client-prenom").value.trim();
  const nom = document.getElementById("client-nom").value.trim();
  if (!prenom || !nom) return showToast("Prénom et nom obligatoires", "error");

  const clients = getData("clients");
  const id = document.getElementById("client-id").value;

  const data = {
    id: id || uid(),
    type: document.getElementById("client-type").value,
    entreprise: document.getElementById("client-entreprise").value.trim(),
    prenom,
    nom,
    adresse: document.getElementById("client-adresse").value.trim(),
    cp: document.getElementById("client-cp").value.trim(),
    ville: document.getElementById("client-ville").value.trim(),
    pays: document.getElementById("client-pays").value.trim(),
    email: document.getElementById("client-email").value.trim(),
    tel: document.getElementById("client-tel").value.trim(),
  };

  if (id) {
    clients[clients.findIndex((c) => c.id === id)] = data;
    showToast("Client mis à jour ✓");
  } else {
    clients.push(data);
    showToast("Client ajouté ✓");
  }

  saveData("clients", clients);
  closeModal("modal-client");
  renderClients();
}

function editClient(id) {
  const c = getData("clients").find((c) => c.id === id);
  if (c) openClientModal(c);
}

function deleteClient(id) {
  if (!confirm("Supprimer ce client ?")) return;
  saveData(
    "clients",
    getData("clients").filter((c) => c.id !== id)
  );
  showToast("Client supprimé");
  renderClients();
}

// ===== DOCUMENT (DEVIS/FACTURE) =====
let currentLignes = [];

function openDevisForm(doc = null, type = "devis") {
  currentLignes = doc ? JSON.parse(JSON.stringify(doc.lignes || [])) : [];

  document.getElementById("modal-devis-title").textContent = doc
    ? `Modifier ${type === "devis" ? "le devis" : "la facture"} ${doc.numero}`
    : `Nouveau ${type === "devis" ? "devis" : "facture"}`;
  document.getElementById("doc-id").value = doc ? doc.id : "";
  document.getElementById("doc-type").value = type;
  document.getElementById("doc-date").value = doc ? doc.date : today();
  document.getElementById("doc-validite").value = doc
    ? doc.validite || 30
    : getParams().delai || 30;
  document.getElementById("doc-objet").value = doc ? doc.objet || "" : "";
  document.getElementById("doc-notes").value = doc
    ? doc.notes || ""
    : getParams().mentions || "";
  document.getElementById("doc-tva").value = doc
    ? doc.tvaRate || getParams().tvaTaux || 7.7
    : getParams().tvaTaux || 7.7;

  // Populate clients
  const clients = getData("clients");
  document.getElementById("doc-client").innerHTML =
    '<option value="">Sélectionner un client...</option>' +
    clients
      .map(
        (c) =>
          `<option value="${c.id}" ${
            doc && doc.clientId === c.id ? "selected" : ""
          }>${getClientName(c.id)}</option>`
      )
      .join("");

  document.getElementById("btn-save-doc").textContent = `Enregistrer ${
    type === "devis" ? "le devis" : "la facture"
  }`;

  renderLignes();
  openModal("modal-devis-form");
}

function renderLignes() {
  const container = document.getElementById("lignes-list");
  if (!currentLignes.length) {
    container.innerHTML =
      '<div class="ligne-empty">Aucune ligne — ajoutez une prestation ou une ligne manuelle</div>';
    updateTotaux();
    return;
  }

  container.innerHTML = currentLignes
    .map(
      (l, i) => `
      <div class="ligne-row" id="ligne-${i}">
        <div>
          <input type="text" class="form-input" value="${
            l.designation
          }" oninput="updateLigne(${i}, 'designation', this.value)" placeholder="Désignation">
          ${
            l.fromPrestation
              ? `<div style="font-size:11px;color:var(--text3);margin-top:2px">📦 ${
                  l.fournisseur || ""
                } ${l.ref ? "· " + l.ref : ""}</div>`
              : ""
          }
        </div>
        <input type="text" class="form-input" value="${
          l.unite
        }" oninput="updateLigne(${i}, 'unite', this.value)" placeholder="Unité">
        <input type="number" class="form-input" value="${
          l.qte
        }" oninput="updateLigne(${i}, 'qte', this.value)" placeholder="0" min="0" step="0.01">
        <input type="number" class="form-input" value="${
          l.prixUnit
        }" oninput="updateLigne(${i}, 'prixUnit', this.value)" placeholder="0.00" step="0.01" min="0">
        <div class="ligne-total">${fmtMoney(l.qte * l.prixUnit)}</div>
        <button class="btn-icon btn-danger" onclick="removeLigne(${i})">✕</button>
      </div>`
    )
    .join("");

  updateTotaux();
}

function updateLigne(idx, field, val) {
  currentLignes[idx][field] =
    field === "qte" || field === "prixUnit" ? parseFloat(val) || 0 : val;
  const totalEl = document.querySelector(`#ligne-${idx} .ligne-total`);
  if (totalEl)
    totalEl.textContent = fmtMoney(
      currentLignes[idx].qte * currentLignes[idx].prixUnit
    );
  updateTotaux();
}

function removeLigne(idx) {
  currentLignes.splice(idx, 1);
  renderLignes();
}

function updateTotaux() {
  const ht = currentLignes.reduce(
    (s, l) => s + (parseFloat(l.qte) || 0) * (parseFloat(l.prixUnit) || 0),
    0
  );
  const tvaRate = parseFloat(document.getElementById("doc-tva").value) || 0;
  const tva = (ht * tvaRate) / 100;
  const ttc = ht + tva;
  document.getElementById("total-ht").textContent = fmtMoney(ht);
  document.getElementById("total-tva").textContent = fmtMoney(tva);
  document.getElementById("total-ttc").textContent = fmtMoney(ttc);
}

function addLigneManuelle() {
  currentLignes.push({
    designation: "",
    unite: "u",
    qte: 1,
    prixUnit: 0,
    fromPrestation: false,
  });
  renderLignes();
}

function addLigneFromBibliotheque() {
  const prestations = getData("prestations");
  filterPrestationsModal("");
  document.getElementById("search-prest-modal").value = "";
  document.getElementById("prest-select-list").innerHTML = prestations.length
    ? prestations
        .map(
          (p) => `
          <div class="prest-select-item" onclick="selectPrestation('${p.id}')">
            <div>
              <div class="prest-item-name">${p.nom}</div>
              <div class="prest-item-meta">${p.categorie || ""} · ${p.unite}${
            p.fournisseur ? " · " + p.fournisseur : ""
          }</div>
            </div>
            <div class="prest-item-price">${fmtMoney(p.prix)}/${p.unite}</div>
          </div>`
        )
        .join("")
    : '<div class="empty-state" style="padding:24px">Aucune prestation dans la bibliothèque</div>';
  openModal("modal-select-prestation");
}

function filterPrestationsModal() {
  const searchVal = document
    .getElementById("search-prest-modal")
    .value.toLowerCase();
  const prestations = getData("prestations");
  const filtered = prestations.filter(
    (p) =>
      p.nom.toLowerCase().includes(searchVal) ||
      (p.categorie || "").toLowerCase().includes(searchVal)
  );
  document.getElementById("prest-select-list").innerHTML = filtered.length
    ? filtered
        .map(
          (p) => `
          <div class="prest-select-item" onclick="selectPrestation('${p.id}')">
            <div>
              <div class="prest-item-name">${p.nom}</div>
              <div class="prest-item-meta">${p.categorie || ""} · ${p.unite}${
            p.fournisseur ? " · " + p.fournisseur : ""
          }</div>
            </div>
            <div class="prest-item-price">${fmtMoney(p.prix)}/${p.unite}</div>
          </div>`
        )
        .join("")
    : '<div class="empty-state" style="padding:24px">Aucun résultat</div>';
}

function selectPrestation(id) {
  const p = getData("prestations").find((p) => p.id === id);
  if (!p) return;
  currentLignes.push({
    designation: p.nom,
    unite: p.unite,
    qte: 1,
    prixUnit: p.prix,
    fromPrestation: true,
    fournisseur: p.fournisseur || "",
    ref: p.ref || "",
    prestationId: p.id,
  });
  closeModal("modal-select-prestation");
  renderLignes();
  showToast(`"${p.nom}" ajouté ✓`);
}

function getNextNumero(type) {
  const items = getData(type === "devis" ? "devis" : "factures");
  const prefix = type === "devis" ? "DEV" : "FAC";
  const year = new Date().getFullYear();
  const nums = items
    .map((d) => d.numero)
    .filter((n) => n && n.startsWith(`${prefix}-${year}`))
    .map((n) => parseInt(n.split("-").pop()) || 0);
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}-${year}-${String(max + 1).padStart(3, "0")}`;
}

function saveDocument() {
  const clientId = document.getElementById("doc-client").value;
  if (!clientId) return showToast("Veuillez sélectionner un client", "error");
  if (!currentLignes.length)
    return showToast("Ajoutez au moins une ligne", "error");

  const type = document.getElementById("doc-type").value;
  const isDevis = type === "devis";
  const key = isDevis ? "devis" : "factures";
  const items = getData(key);
  const id = document.getElementById("doc-id").value;

  const ht = currentLignes.reduce(
    (s, l) => s + (parseFloat(l.qte) || 0) * (parseFloat(l.prixUnit) || 0),
    0
  );
  const tvaRate = parseFloat(document.getElementById("doc-tva").value) || 0;
  const tva = (ht * tvaRate) / 100;
  const ttc = ht + tva;

  const doc = {
    id: id || uid(),
    numero: id ? items.find((d) => d.id === id)?.numero : getNextNumero(type),
    clientId,
    date: document.getElementById("doc-date").value,
    validite: parseInt(document.getElementById("doc-validite").value) || 30,
    objet: document.getElementById("doc-objet").value.trim(),
    lignes: currentLignes,
    notes: document.getElementById("doc-notes").value.trim(),
    tvaRate,
    totalHT: ht,
    totalTVA: tva,
    totalTTC: ttc,
    status: isDevis ? "brouillon" : "envoyee",
    createdAt: new Date().toISOString(),
  };

  if (id) {
    doc.status = items.find((d) => d.id === id)?.status || doc.status;
    items[items.findIndex((d) => d.id === id)] = doc;
    showToast(`${isDevis ? "Devis" : "Facture"} mis à jour ✓`);
  } else {
    items.push(doc);
    showToast(`${isDevis ? "Devis" : "Facture"} créé ✓`);
  }

  saveData(key, items);
  closeModal("modal-devis-form");
  isDevis ? renderDevis() : renderFactures();
}

// ===== DEVIS =====
function renderDevis() {
  const devis = getData("devis");
  const searchVal = document.getElementById("search-devis").value.toLowerCase();
  const statusFilter = document.getElementById("filter-status-devis").value;

  const filtered = devis
    .filter((d) => {
      const clientName = getClientName(d.clientId).toLowerCase();
      const matchSearch =
        !searchVal ||
        d.numero.toLowerCase().includes(searchVal) ||
        clientName.includes(searchVal);
      const matchStatus = !statusFilter || d.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  document.getElementById("tbody-devis").innerHTML = filtered.length
    ? filtered
        .map(
          (d) => `
          <tr>
            <td><strong>${d.numero}</strong></td>
            <td>${getClientName(d.clientId)}</td>
            <td>${d.date}</td>
            <td>${fmtMoney(d.totalHT)}</td>
            <td>${fmt(d.tvaRate)}%</td>
            <td style="font-family:var(--font-display);font-weight:600;color:var(--accent)">${fmtMoney(
              d.totalTTC
            )}</td>
            <td>${badgeHtml(d.status)}</td>
            <td class="table-actions">
              <button class="btn-icon" onclick="previewDoc('${
                d.id
              }', 'devis')" title="Aperçu">👁</button>
              <button class="btn-icon" onclick="editDoc('${
                d.id
              }', 'devis')" title="Modifier">✏️</button>
              <select class="form-input" style="padding:4px 6px;font-size:12px;width:auto" onchange="changeDocStatus('${
                d.id
              }','devis',this.value)">
                <option value="">Statut...</option>
                <option value="brouillon">Brouillon</option>
                <option value="envoye">Envoyé</option>
                <option value="accepte">Accepté</option>
                <option value="refuse">Refusé</option>
              </select>
              ${
                d.status === "accepte"
                  ? `<button class="btn-icon" style="color:var(--success)" onclick="convertToFacture('${d.id}')" title="Convertir en facture">→🧾</button>`
                  : ""
              }
              <button class="btn-icon btn-danger" onclick="deleteDoc('${
                d.id
              }','devis')" title="Supprimer">🗑</button>
            </td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text3)">Aucun devis trouvé</td></tr>`;
}

// ===== FACTURES =====
function renderFactures() {
  const factures = getData("factures");
  const searchVal = document
    .getElementById("search-factures")
    .value.toLowerCase();
  const statusFilter = document.getElementById("filter-status-factures").value;

  // Auto-check retard
  const today_ = today();
  factures.forEach((f) => {
    if (f.status === "envoyee") {
      const echeance = new Date(f.date);
      echeance.setDate(echeance.getDate() + (f.validite || 30));
      if (echeance.toISOString().slice(0, 10) < today_) f.status = "retard";
    }
  });
  saveData("factures", factures);

  const filtered = factures
    .filter((f) => {
      const clientName = getClientName(f.clientId).toLowerCase();
      const matchSearch =
        !searchVal ||
        f.numero.toLowerCase().includes(searchVal) ||
        clientName.includes(searchVal);
      const matchStatus = !statusFilter || f.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  document.getElementById("tbody-factures").innerHTML = filtered.length
    ? filtered
        .map((f) => {
          const echeance = new Date(f.date);
          echeance.setDate(echeance.getDate() + (f.validite || 30));
          return `
          <tr>
            <td><strong>${f.numero}</strong></td>
            <td>${getClientName(f.clientId)}</td>
            <td>${f.date}</td>
            <td>${echeance.toISOString().slice(0, 10)}</td>
            <td style="font-family:var(--font-display);font-weight:600;color:var(--accent)">${fmtMoney(
              f.totalTTC
            )}</td>
            <td>${badgeHtml(f.status)}</td>
            <td class="table-actions">
              <button class="btn-icon" onclick="previewDoc('${
                f.id
              }', 'factures')" title="Aperçu">👁</button>
              <button class="btn-icon" onclick="editDoc('${
                f.id
              }', 'factures')" title="Modifier">✏️</button>
              <select class="form-input" style="padding:4px 6px;font-size:12px;width:auto" onchange="changeDocStatus('${
                f.id
              }','factures',this.value)">
                <option value="">Statut...</option>
                <option value="envoyee">Envoyée</option>
                <option value="payee">Payée ✓</option>
                <option value="retard">En retard</option>
              </select>
              <button class="btn-icon btn-danger" onclick="deleteDoc('${
                f.id
              }','factures')" title="Supprimer">🗑</button>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text3)">Aucune facture trouvée</td></tr>`;
}

function changeDocStatus(id, key, status) {
  if (!status) return;
  const items = getData(key);
  const item = items.find((d) => d.id === id);
  if (item) {
    item.status = status;
    saveData(key, items);
    key === "devis" ? renderDevis() : renderFactures();
    showToast("Statut mis à jour ✓");
  }
}

function editDoc(id, key) {
  const item = getData(key).find((d) => d.id === id);
  if (item) openDevisForm(item, key === "devis" ? "devis" : "facture");
}

function deleteDoc(id, key) {
  const label = key === "devis" ? "ce devis" : "cette facture";
  if (!confirm(`Supprimer ${label} ?`)) return;
  saveData(
    key,
    getData(key).filter((d) => d.id !== id)
  );
  showToast("Supprimé ✓");
  key === "devis" ? renderDevis() : renderFactures();
}

function convertToFacture(devisId) {
  const devis = getData("devis").find((d) => d.id === devisId);
  if (!devis) return;

  const factures = getData("factures");
  const newFac = {
    ...devis,
    id: uid(),
    numero: getNextNumero("facture"),
    status: "envoyee",
    date: today(),
    fromDevis: devis.numero,
    createdAt: new Date().toISOString(),
  };
  factures.push(newFac);
  saveData("factures", factures);

  // Mark devis as converted
  const devisArr = getData("devis");
  const d = devisArr.find((d) => d.id === devisId);
  if (d) {
    d.converted = true;
    saveData("devis", devisArr);
  }

  showToast(`Facture ${newFac.numero} créée ✓`);
  navigate("factures");
}

// ===== PREVIEW =====
function previewDoc(id, key) {
  const doc = getData(key).find((d) => d.id === id);
  if (!doc) return;

  const params = getParams();
  const client = getClient(doc.clientId);
  const isDevis = key === "devis";

  document.getElementById("preview-title").textContent = isDevis
    ? `Devis ${doc.numero}`
    : `Facture ${doc.numero}`;

  const echeance = new Date(doc.date);
  echeance.setDate(echeance.getDate() + (doc.validite || 30));

  const clientAddress = [
    client ? client.entreprise || `${client.prenom} ${client.nom}` : "Client",
    client?.adresse,
    client ? `${client.cp || ""} ${client.ville || ""}`.trim() : "",
    client?.pays,
  ]
    .filter(Boolean)
    .join("<br>");

  const companyInfo = [
    params.adresse,
    `${params.cp || ""} ${params.ville || ""}`.trim(),
    params.email,
    params.tel,
    params.siret ? `SIRET: ${params.siret}` : "",
    params.tvaNum ? `TVA: ${params.tvaNum}` : "",
  ]
    .filter(Boolean)
    .join("<br>");

  const lignesHtml = doc.lignes
    .map(
      (l, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${l.designation}${
        l.fournisseur
          ? `<br><small style="color:#999">${l.fournisseur}${
              l.ref ? " · " + l.ref : ""
            }</small>`
          : ""
      }</td>
        <td class="td-right">${l.unite}</td>
        <td class="td-right">${parseFloat(l.qte).toFixed(2)}</td>
        <td class="td-right">${fmtMoney(l.prixUnit)}</td>
        <td class="td-right td-bold">${fmtMoney(l.qte * l.prixUnit)}</td>
      </tr>`
    )
    .join("");

  document.getElementById("preview-content").innerHTML = `
      <div class="doc-preview-header">
        <div>
          <div class="doc-preview-company">${
            params.nom || "Votre Entreprise"
          }</div>
          <div class="doc-preview-company-info">${companyInfo}</div>
        </div>
        <div>
          <div class="doc-preview-type">${isDevis ? "DEVIS" : "FACTURE"}</div>
          <div class="doc-preview-num">${doc.numero}</div>
        </div>
      </div>
      <div class="doc-preview-meta">
        <div class="doc-preview-client-box">
          <div class="doc-preview-client-label">Destinataire</div>
          <div class="doc-preview-client-name">${
            client ? getClientName(client.id) : "—"
          }</div>
          <div class="doc-preview-client-info">${clientAddress}</div>
        </div>
        <div class="doc-preview-dates">
          <strong>Date :</strong> ${doc.date}<br>
          <strong>${
            isDevis ? "Valide jusqu'au" : "Échéance"
          } :</strong> ${echeance.toISOString().slice(0, 10)}<br>
          ${
            doc.fromDevis
              ? `<strong>Réf. devis :</strong> ${doc.fromDevis}<br>`
              : ""
          }
        </div>
      </div>
      ${
        doc.objet
          ? `<div class="doc-preview-objet">Objet : ${doc.objet}</div>`
          : ""
      }
      <table class="doc-preview-table">
        <thead><tr><th>#</th><th>Désignation</th><th>Unité</th><th style="text-align:right">Qté</th><th style="text-align:right">Prix unit.</th><th style="text-align:right">Total HT</th></tr></thead>
        <tbody>${lignesHtml}</tbody>
      </table>
      <div class="doc-totaux">
        <div class="doc-totaux-inner">
          <div class="doc-totaux-row"><span>Sous-total HT</span><span>${fmtMoney(
            doc.totalHT
          )}</span></div>
          <div class="doc-totaux-row"><span>TVA (${fmt(
            doc.tvaRate
          )}%)</span><span>${fmtMoney(doc.totalTVA)}</span></div>
          <div class="doc-totaux-row"><span>Total TTC</span><span>${fmtMoney(
            doc.totalTTC
          )}</span></div>
        </div>
      </div>
      ${
        doc.notes
          ? `<div class="doc-preview-notes"><strong>Notes :</strong> ${doc.notes}</div>`
          : ""
      }
      <div class="doc-preview-footer">
        ${params.iban ? `IBAN : ${params.iban}<br>` : ""}
        ${params.mentions || ""}
      </div>
    `;

  openModal("modal-preview");
}

function printDocument() {
  window.print();
}

// ===== PARAMETRES =====
function renderParametres() {
  const p = getParams();
  document.getElementById("p-nom").value = p.nom || "";
  document.getElementById("p-adresse").value = p.adresse || "";
  document.getElementById("p-ville").value = p.ville || "";
  document.getElementById("p-pays").value = p.pays || "";
  document.getElementById("p-email").value = p.email || "";
  document.getElementById("p-tel").value = p.tel || "";
  document.getElementById("p-siret").value = p.siret || "";
  document.getElementById("p-tva-num").value = p.tvaNum || "";
  document.getElementById("p-tva-taux").value = p.tvaTaux || 7.7;
  document.getElementById("p-delai").value = p.delai || 30;
  document.getElementById("p-mentions").value = p.mentions || "";
  document.getElementById("p-iban").value = p.iban || "";
}

function saveParametres() {
  saveParams({
    nom: document.getElementById("p-nom").value.trim(),
    adresse: document.getElementById("p-adresse").value.trim(),
    ville: document.getElementById("p-ville").value.trim(),
    pays: document.getElementById("p-pays").value.trim(),
    email: document.getElementById("p-email").value.trim(),
    tel: document.getElementById("p-tel").value.trim(),
    siret: document.getElementById("p-siret").value.trim(),
    tvaNum: document.getElementById("p-tva-num").value.trim(),
    tvaTaux: parseFloat(document.getElementById("p-tva-taux").value) || 7.7,
    delai: parseInt(document.getElementById("p-delai").value) || 30,
    mentions: document.getElementById("p-mentions").value.trim(),
    iban: document.getElementById("p-iban").value.trim(),
  });
  showToast("Paramètres sauvegardés ✓");
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  // Navigation
  document.querySelectorAll("[data-page]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });

  // Close modals on overlay click
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  });

  // TVA recalc
  document.getElementById("doc-tva").addEventListener("input", updateTotaux);

  // Search listeners
  document
    .getElementById("search-prestations")
    .addEventListener("input", () => renderPrestations());
  document
    .getElementById("filter-categorie-prest")
    .addEventListener("change", () => renderPrestations());
  document
    .getElementById("search-clients")
    .addEventListener("input", () => renderClients());
  document
    .getElementById("search-devis")
    .addEventListener("input", () => renderDevis());
  document
    .getElementById("filter-status-devis")
    .addEventListener("change", () => renderDevis());
  document
    .getElementById("search-factures")
    .addEventListener("input", () => renderFactures());
  document
    .getElementById("filter-status-factures")
    .addEventListener("change", () => renderFactures());

  // Demo data if empty
  if (!getData("prestations").length && !getData("clients").length) {
    loadDemoData();
  }

  // Start on dashboard
  navigate("dashboard");
});

function loadDemoData() {
  saveData("prestations", [
    {
      id: uid(),
      nom: "Peinture intérieure",
      categorie: "Peinture",
      unite: "m²",
      prix: 18,
      fournisseur: "Leroy Merlin",
      ref: "PNT-001",
      description: "Peinture 2 couches",
    },
    {
      id: uid(),
      nom: "Pose de carrelage",
      categorie: "Revêtement",
      unite: "m²",
      prix: 45,
      fournisseur: "Brico Dépôt",
      ref: "CARL-220",
      description: "",
    },
    {
      id: uid(),
      nom: "Maçonnerie briques",
      categorie: "Maçonnerie",
      unite: "m²",
      prix: 85,
      fournisseur: "Point P",
      ref: "",
      description: "",
    },
    {
      id: uid(),
      nom: "Electricité standard",
      categorie: "Electricité",
      unite: "h",
      prix: 75,
      fournisseur: "",
      ref: "",
      description: "Main d'oeuvre horaire",
    },
    {
      id: uid(),
      nom: "Plomberie installation",
      categorie: "Plomberie",
      unite: "forfait",
      prix: 350,
      fournisseur: "Cedeo",
      ref: "PLB-FT",
      description: "",
    },
  ]);

  saveData("clients", [
    {
      id: "cli1",
      type: "particulier",
      prenom: "Martin",
      nom: "Dupont",
      entreprise: "",
      adresse: "12 rue des Lilas",
      cp: "1201",
      ville: "Genève",
      pays: "Suisse",
      email: "martin.dupont@email.com",
      tel: "+41 79 123 45 67",
    },
    {
      id: "cli2",
      type: "entreprise",
      prenom: "Sophie",
      nom: "Bernard",
      entreprise: "Immobilier Bernard SA",
      adresse: "3 avenue du Lac",
      cp: "1003",
      ville: "Lausanne",
      pays: "Suisse",
      email: "contact@bernard-immo.ch",
      tel: "+41 21 456 78 90",
    },
  ]);

  saveParams({
    nom: "Mon Entreprise SARL",
    adresse: "5 route des Artisans",
    ville: "1180 Rolle",
    pays: "Suisse",
    email: "contact@monentreprise.ch",
    tel: "+41 78 999 00 11",
    tvaTaux: 7.7,
    delai: 30,
  });

  showToast("Données de démonstration chargées 🎉");
}
