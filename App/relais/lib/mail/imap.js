// Boîtes IMAP/SMTP : Infomaniak, Gmail ou Outlook avec mot de passe d'application, hébergeurs suisses…
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { normaliser } from "./normaliser.js";
import { construireMime } from "./composer.js";

export const PRESETS = {
  infomaniak: { nom: "Infomaniak", imap_hote: "mail.infomaniak.com", imap_port: 993, smtp_hote: "mail.infomaniak.com", smtp_port: 465, smtp_securise: true },
  gmail_mdp: { nom: "Gmail (mot de passe d'application)", imap_hote: "imap.gmail.com", imap_port: 993, smtp_hote: "smtp.gmail.com", smtp_port: 465, smtp_securise: true },
  bluewin: { nom: "Bluewin (Swisscom)", imap_hote: "imaps.bluewin.ch", imap_port: 993, smtp_hote: "smtpauths.bluewin.ch", smtp_port: 465, smtp_securise: true },
  hostpoint: { nom: "Hostpoint", imap_hote: "imap.mail.hostpoint.ch", imap_port: 993, smtp_hote: "asmtp.mail.hostpoint.ch", smtp_port: 587, smtp_securise: false },
  autre: { nom: "Autre hébergeur (réglages manuels)" },
};

const PREMIERE_SYNCHRO_JOURS = 3;
const MAX_PAR_SYNCHRO = 30;

function client(compte, secret) {
  const port = compte.imap_port || 993;
  // 993 = TLS direct ; autres ports = STARTTLS obligatoire (jamais de mot de passe en clair).
  // RELAIS_AUTORISER_IMAP_EN_CLAIR=1 : uniquement pour les tests sur un serveur local.
  const enClairAutorise = process.env.RELAIS_AUTORISER_IMAP_EN_CLAIR === "1";
  return new ImapFlow({
    host: compte.imap_hote, port, secure: port === 993,
    ...(port !== 993 && !enClairAutorise ? { doSTARTTLS: true } : {}),
    auth: { user: secret.utilisateur || compte.email, pass: secret.motDePasse },
    logger: false, socketTimeout: 30_000, greetingTimeout: 15_000,
  });
}

/** Vérifie les identifiants IMAP et SMTP avant d'enregistrer la boîte. */
export async function tester(compte, secret) {
  const imap = client(compte, secret);
  await imap.connect();
  await imap.logout();
  const smtp = nodemailer.createTransport({
    host: compte.smtp_hote, port: compte.smtp_port, secure: !!compte.smtp_securise,
    auth: { user: secret.utilisateur || compte.email, pass: secret.motDePasse },
  });
  await smtp.verify();
  smtp.close();
}

/** @returns {Promise<{messages: object[], curseur: object}>} */
export async function lireNouveaux(compte, secret, curseur = {}) {
  const imap = client(compte, secret);
  await imap.connect();
  const messages = [];
  let nouveauCurseur = { ...curseur };
  const verrou = await imap.getMailboxLock("INBOX");
  try {
    const boite = imap.mailbox;
    const validite = String(boite.uidValidity);
    const repartir = curseur.uidValidity !== validite || !curseur.dernierUid;
    let uids;
    if (repartir) {
      // Première lecture : les messages des 3 derniers jours. On filtre nous-mêmes sur la
      // date de réception (la recherche SINCE n'est pas fiable sur tous les serveurs).
      const depuis = Date.now() - PREMIERE_SYNCHRO_JOURS * 86_400_000;
      const tous = ((await imap.search({ all: true }, { uid: true })) || []).sort((x, y) => x - y).slice(-100);
      uids = [];
      if (tous.length) {
        for await (const m of imap.fetch(tous, { uid: true, internalDate: true }, { uid: true })) {
          if (m.internalDate && new Date(m.internalDate).getTime() >= depuis) uids.push(m.uid);
        }
      }
    } else {
      uids = ((await imap.search({ uid: `${curseur.dernierUid + 1}:*` }, { uid: true })) || [])
        .filter((u) => u > curseur.dernierUid);   // IMAP renvoie toujours le dernier message
    }
    uids = uids.sort((x, y) => x - y).slice(-MAX_PAR_SYNCHRO);
    let dernier = repartir ? 0 : curseur.dernierUid;
    if (uids.length) {
      for await (const m of imap.fetch(uids, { uid: true, source: true, internalDate: true }, { uid: true })) {
        if (!m.source || m.source.length > 5_000_000) continue;
        messages.push(await normaliser(m.source, { idFournisseur: `${validite}:${m.uid}`, recuLe: m.internalDate }));
        dernier = Math.max(dernier, m.uid);
      }
    }
    if (repartir && !uids.length) dernier = Math.max(0, (boite.uidNext || 1) - 1);
    nouveauCurseur = { uidValidity: validite, dernierUid: dernier };
  } finally {
    verrou.release();
    await imap.logout().catch(() => undefined);
  }
  return { messages, curseur: nouveauCurseur, secretMisAJour: null };
}

/** Envoie la réponse en SMTP puis la range dans "Envoyés" (si possible). */
export async function envoyer(compte, secret, reponse) {
  const brut = await construireMime({ ...reponse, de: compte.email });
  const smtp = nodemailer.createTransport({
    host: compte.smtp_hote, port: compte.smtp_port, secure: !!compte.smtp_securise,
    auth: { user: secret.utilisateur || compte.email, pass: secret.motDePasse },
  });
  try {
    await smtp.sendMail({ envelope: { from: compte.email, to: [reponse.a] }, raw: brut });
  } finally {
    smtp.close();
  }
  // Copie dans le dossier Envoyés (Gmail le fait seul ; on ignore les erreurs)
  if (!/gmail\.com$/i.test(compte.imap_hote || "")) {
    const imap = client(compte, secret);
    try {
      await imap.connect();
      const dossiers = await imap.list();
      const envoyes = dossiers.find((d) => d.specialUse === "\\Sent")?.path
        || dossiers.find((d) => /^(sent|envoy|inbox\.sent)/i.test(d.path))?.path;
      if (envoyes) await imap.append(envoyes, brut, ["\\Seen"]);
    } catch { /* non bloquant */ } finally {
      await imap.logout().catch(() => undefined);
    }
  }
  return { secretMisAJour: null };
}
