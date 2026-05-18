// Export PDF - TimberLog CH
const VERT = [59, 109, 17];
const VERT_L = [234, 243, 222];

function pdfHeader(doc, sousTitre) {
  doc.setFillColor(...VERT);
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont(undefined, "bold");
  doc.text("TimberLog CH", 14, 14);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(sousTitre, 14, 21);
  doc.text("Genere le " + new Date().toLocaleDateString("fr-CH"), 14, 27);

  doc.setTextColor(0, 0, 0);
}

function pdfFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("TimberLog CH \u2014 Page " + i + "/" + pageCount, 105, 290, {
      align: "center",
    });
  }
}

function pdfBlocChantier(doc, startY) {
  const chantier = window.chantier || {};
  const billes = window.billes || [];
  const total = billes.reduce((sum, bille) => sum + bille.volume, 0);

  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("Informations chantier", 14, startY);

  doc.autoTable({
    startY: startY + 4,
    head: [],
    body: [
      ["Chantier", chantier.nom || "-"],
      ["Date", chantier.date || "-"],
      ["Mandant", chantier.mandant || "-"],
      ["Nombre de billes", String(billes.length)],
      ["Volume total", total.toFixed(4) + " m3"],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: [80, 80, 80] },
      1: { textColor: [20, 20, 20] },
    },
  });

  return doc.lastAutoTable.finalY;
}

function pdfBlocBilles(doc, startY) {
  const billes = window.billes || [];

  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("Detail des billes", 14, startY);

  doc.autoTable({
    startY: startY + 4,
    head: [
      [
        "#",
        "Essence",
        "Diam. (cm)",
        "Long. (m)",
        "Qualite",
        "Volume m3",
        "Defauts",
      ],
    ],
    body: billes.map((bille) => [
      bille.id,
      bille.essence,
      bille.diametre,
      bille.longueur,
      bille.qualite,
      bille.volume.toFixed(4),
      bille.defauts,
    ]),
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: VERT, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: VERT_L },
    columnStyles: {
      0: { cellWidth: 10 },
      4: { halign: "center" },
      5: { halign: "right", fontStyle: "bold" },
    },
  });

  return doc.lastAutoTable.finalY;
}

function pdfBlocRecap(doc, startY) {
  const billes = window.billes || [];
  const byEssence = {};
  billes.forEach((bille) => {
    byEssence[bille.essence] = (byEssence[bille.essence] || 0) + bille.volume;
  });

  if (startY > 240) {
    doc.addPage();
    startY = 20;
  }

  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("Recapitulatif par essence", 14, startY);

  doc.autoTable({
    startY: startY + 4,
    head: [["Essence", "Nb billes", "Volume m3"]],
    body: Object.entries(byEssence).map(([essence, volume]) => [
      essence,
      billes.filter((bille) => bille.essence === essence).length,
      volume.toFixed(4),
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: VERT, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: VERT_L },
    columnStyles: { 2: { halign: "right", fontStyle: "bold" } },
  });

  let y = doc.lastAutoTable.finalY + 10;
  const byQualite = { A: 0, B: 0, C: 0, D: 0 };
  billes.forEach((bille) => {
    byQualite[bille.qualite] = (byQualite[bille.qualite] || 0) + bille.volume;
  });

  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("Recapitulatif par qualite", 14, y);

  doc.autoTable({
    startY: y + 4,
    head: [["Qualite", "Nb billes", "Volume m3"]],
    body: ["A", "B", "C", "D"]
      .filter((qualite) => byQualite[qualite] > 0)
      .map((qualite) => [
        qualite,
        billes.filter((bille) => bille.qualite === qualite).length,
        byQualite[qualite].toFixed(4),
      ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: VERT, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: VERT_L },
    columnStyles: { 2: { halign: "right", fontStyle: "bold" } },
  });

  return doc.lastAutoTable.finalY;
}

function pdfBlocSecurite(doc, startY) {
  const gps = window.gpsData || {};
  const coordE = document.getElementById("coordE").value || "-";
  const coordN = document.getElementById("coordN").value || "-";
  const alt = document.getElementById("altitude").value || "-";
  const lieu = document.getElementById("lieu-dit").value || "-";
  const resp = document.getElementById("resp-chantier").value || "-";
  const hopital = document.getElementById("hopital").value || "-";
  const notes = document.getElementById("notes-sec").value || "-";
  const accInfo = gps.acc ? "(GPS +/-" + gps.acc + " m)" : "(saisie manuelle)";

  if (startY > 220) {
    doc.addPage();
    startY = 20;
  }

  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("Fiche de securite", 14, startY);

  doc.autoTable({
    startY: startY + 4,
    head: [],
    body: [
      ["Coordonnees LV95 E", coordE + "  " + accInfo],
      ["Coordonnees LV95 N", coordN],
      ["Altitude", alt !== "-" ? alt + " m" : "-"],
      ["Lieu-dit / acces", lieu],
      ["Responsable", resp],
      ["Hopital / medecin", hopital],
      ["Notes securite", notes],
      [""],
      ["URGENCES", ""],
      ["Urgences generales", "112"],
      ["Ambulance / SAMU", "144"],
      ["Police", "117"],
      ["Pompiers", "118"],
      ["Rega (helicoptere)", "1414"],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: [80, 80, 80] },
    },
    didParseCell: (data) => {
      if (data.row.index === 8) {
        data.cell.styles.fillColor = VERT_L;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = VERT;
      }
    },
  });

  return doc.lastAutoTable.finalY;
}

function nomFichier(suffixe) {
  const nom = (window.chantier.nom || "chantier")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "");
  const date = window.chantier.date || new Date().toISOString().split("T")[0];
  return nom + "_" + date + "_" + suffixe + ".pdf";
}

function exporterPDFSecurite() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  pdfHeader(doc, "Fiche de securite - avant chantier");
  let y = pdfBlocChantier(doc, 44);
  pdfBlocSecurite(doc, y + 10);
  pdfFooter(doc);

  doc.save(nomFichier("securite"));
  showToast("PDF Securite exporte !");
}

function exporterPDFBilles() {
  if (!window.billes || window.billes.length === 0) {
    showToast("Aucune bille a exporter");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  pdfHeader(doc, "Fiche de cubage - billes");
  let y = pdfBlocChantier(doc, 44);
  y = pdfBlocBilles(doc, y + 10);
  pdfBlocRecap(doc, y + 10);
  pdfFooter(doc);

  doc.save(nomFichier("billes"));
  showToast("PDF Billes exporte !");
}

function exporterPDF() {
  if (!window.billes || window.billes.length === 0) {
    showToast("Ajoutez des billes avant d'exporter");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  pdfHeader(doc, "Fiche complete - cubage & securite");
  let y = pdfBlocChantier(doc, 44);
  y = pdfBlocBilles(doc, y + 10);
  y = pdfBlocRecap(doc, y + 10);
  pdfBlocSecurite(doc, y + 10);
  pdfFooter(doc);

  doc.save(nomFichier("complet"));
  showToast("PDF Complet exporte !");
}
