// Récapitulatif du soir envoyé au patron.
import nodemailer from "nodemailer";

const LIBELLES = {
  demande_devis: "Demandes de devis", rendez_vous: "Rendez-vous", question_client: "Questions de clients",
  reclamation: "Réclamations", facture_fournisseur: "Factures fournisseurs", administratif: "Administratif",
  publicite: "Publicité et notifications", autre: "Autres",
};

export function heureZurich(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Zurich" }).formatToParts(date);
  return Number(parts.find((p) => p.type === "hour").value);
}
export function jourZurich(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" }).format(date);   // AAAA-MM-JJ
}

const echapper = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/**
 * @param {object} entreprise
 * @param {Array<{sujet, expediteur_nom, expediteur_email, analyses: {categorie, urgence, resume}|null}>} messages  reçus aujourd'hui
 * @param {number} brouillonsEnAttente
 */
export function construireRecap(entreprise, messages, brouillonsEnAttente, urlApp) {
  const utiles = messages.filter((m) => m.analyses && m.analyses.categorie !== "publicite");
  const urgents = utiles.filter((m) => m.analyses.urgence === "haute");
  const parCategorie = {};
  for (const m of utiles) (parCategorie[m.analyses.categorie] ||= []).push(m);
  const automatiques = messages.length - utiles.length;

  const sujet = urgents.length
    ? `${urgents.length} urgent${urgents.length > 1 ? "s" : ""} · ${utiles.length} e-mail${utiles.length > 1 ? "s" : ""} aujourd'hui`
    : `${utiles.length} e-mail${utiles.length > 1 ? "s" : ""} aujourd'hui · ${brouillonsEnAttente} réponse${brouillonsEnAttente > 1 ? "s" : ""} prête${brouillonsEnAttente > 1 ? "s" : ""}`;

  const ligne = (m) => `- ${m.expediteur_nom || m.expediteur_email} : ${m.analyses.resume}`;
  const blocs = [];
  if (urgents.length) blocs.push(`URGENT\n${urgents.map(ligne).join("\n")}`);
  for (const [cat, liste] of Object.entries(parCategorie)) {
    const nonUrgents = liste.filter((m) => m.analyses.urgence !== "haute");
    if (nonUrgents.length) blocs.push(`${LIBELLES[cat].toUpperCase()} (${nonUrgents.length})\n${nonUrgents.map(ligne).join("\n")}`);
  }
  const texte = [
    `Bonsoir,`, ``,
    utiles.length ? `Voici le résumé de la journée pour ${entreprise.nom}.` : `Aucun e-mail important aujourd'hui.`, ``,
    ...blocs.flatMap((b) => [b, ""]),
    brouillonsEnAttente ? `${brouillonsEnAttente} brouillon(s) de réponse attendent votre validation : ${urlApp}/boite` : "",
    automatiques ? `${automatiques} message(s) automatique(s) classé(s) sans action.` : "",
    ``, `— Relais`,
  ].filter((l) => l !== null).join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#1f2328">
<p>Bonsoir,</p>
<p>${utiles.length ? `Voici le résumé de la journée pour <strong>${echapper(entreprise.nom)}</strong>.` : "Aucun e-mail important aujourd'hui."}</p>
${urgents.length ? `<h3 style="color:#b91c1c;margin-bottom:4px">Urgent</h3><ul>${urgents.map((m) => `<li><strong>${echapper(m.expediteur_nom || m.expediteur_email)}</strong> : ${echapper(m.analyses.resume)}</li>`).join("")}</ul>` : ""}
${Object.entries(parCategorie).map(([cat, liste]) => {
    const n = liste.filter((m) => m.analyses.urgence !== "haute");
    return n.length ? `<h3 style="margin-bottom:4px">${LIBELLES[cat]} (${n.length})</h3><ul>${n.map((m) => `<li><strong>${echapper(m.expediteur_nom || m.expediteur_email)}</strong> : ${echapper(m.analyses.resume)}</li>`).join("")}</ul>` : "";
  }).join("")}
${brouillonsEnAttente ? `<p><a href="${echapper(urlApp)}/boite" style="background:#0f766e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Valider ${brouillonsEnAttente} réponse(s)</a></p>` : ""}
${automatiques ? `<p style="color:#5b6168;font-size:13px">${automatiques} message(s) automatique(s) classé(s) sans action.</p>` : ""}
<p style="color:#5b6168;font-size:13px">— Relais</p></div>`;

  return { sujet: `Relais · ${sujet}`, texte, html, vide: utiles.length === 0 && !brouillonsEnAttente };
}

export async function envoyerRecap(destinataire, recap) {
  const smtp = nodemailer.createTransport({
    host: process.env.RELAIS_SMTP_HOTE, port: Number(process.env.RELAIS_SMTP_PORT || 465),
    secure: (process.env.RELAIS_SMTP_PORT || "465") === "465",
    auth: { user: process.env.RELAIS_SMTP_UTILISATEUR, pass: process.env.RELAIS_SMTP_MOT_DE_PASSE },
  });
  try {
    await smtp.sendMail({
      from: { name: "Relais", address: process.env.RELAIS_SMTP_EXPEDITEUR || process.env.RELAIS_SMTP_UTILISATEUR },
      to: destinataire, subject: recap.sujet, text: recap.texte, html: recap.html,
    });
  } finally {
    smtp.close();
  }
}
