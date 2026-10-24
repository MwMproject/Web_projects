// Transforme un e-mail brut (MIME) en ligne pour la table "messages".
import { simpleParser } from "mailparser";

const LIMITE_CORPS = 20_000;

/** Retire les citations des réponses précédentes ("> ..." et "Le ... a écrit :") */
export function retirerCitations(texte) {
  const lignes = String(texte || "").replace(/\r\n/g, "\n").split("\n");
  const sortie = [];
  for (const ligne of lignes) {
    if (/^(Le|On|Am) .{5,120}(a écrit|wrote|schrieb)\s*:\s*$/i.test(ligne.trim())) break;
    if (/^-{2,}\s*(Original Message|Message d'origine|Ursprüngliche Nachricht)/i.test(ligne.trim())) break;
    if (/^(De|From|Von)\s*:.+/i.test(ligne.trim()) && sortie.length > 3) break;
    if (ligne.trim().startsWith(">")) continue;
    sortie.push(ligne);
  }
  return sortie.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * E-mails envoyés par des robots (newsletters, notifications, réponses automatiques) :
 * inutile de payer une analyse IA ni de proposer une réponse.
 */
export function estAutomatique(parsed) {
  const h = parsed.headers;
  const get = (k) => String(h?.get?.(k) ?? "").toLowerCase();
  if (get("auto-submitted") && get("auto-submitted") !== "no") return true;
  if (["bulk", "list", "junk"].includes(get("precedence"))) return true;
  if (h?.has?.("list-unsubscribe") || h?.has?.("list-id")) return true;
  if (h?.has?.("x-autoreply") || h?.has?.("x-autorespond")) return true;
  const de = parsed.from?.value?.[0]?.address?.toLowerCase() || "";
  return /^(no-?reply|ne-pas-repondre|mailer-daemon|postmaster|notifications?)@/.test(de);
}

/**
 * @param {Buffer|string} source  MIME brut
 * @param {{idFournisseur: string, filId?: string, recuLe?: Date}} meta
 */
export async function normaliser(source, meta) {
  const parsed = await simpleParser(source, { skipTextToHtml: true, skipImageLinks: true });
  const de = parsed.from?.value?.[0] || {};
  const a = Array.isArray(parsed.to) ? parsed.to.flatMap((t) => t.value) : parsed.to?.value || [];
  let texte = parsed.text || "";
  if (!texte && parsed.html) {
    texte = String(parsed.html).replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " ");
  }
  const corps = retirerCitations(texte).slice(0, LIMITE_CORPS);
  const refs = parsed.references ? [].concat(parsed.references).join(" ") : null;
  return {
    id_fournisseur: meta.idFournisseur,
    fil_id: meta.filId || null,
    message_id_entete: parsed.messageId || null,
    references_entete: refs,
    expediteur_nom: de.name?.slice(0, 200) || null,
    expediteur_email: (de.address || "inconnu@invalide.local").toLowerCase(),
    destinataire: a.map((x) => x.address).filter(Boolean).join(", ").slice(0, 500) || null,
    sujet: (parsed.subject || "(sans objet)").slice(0, 300),
    corps_texte: corps,
    extrait: corps.replace(/\s+/g, " ").slice(0, 200),
    recu_le: (parsed.date || meta.recuLe || new Date()).toISOString(),
    automatique: estAutomatique(parsed),
  };
}
