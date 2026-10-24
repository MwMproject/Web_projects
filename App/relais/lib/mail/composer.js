// Construit le MIME d'une réponse, dans le même fil que le message d'origine.
import MailComposer from "nodemailer/lib/mail-composer";

export function sujetReponse(sujet) {
  const s = String(sujet || "").trim();
  return /^(re|aw|tr|fwd?)\s*:/i.test(s) ? s : `Re: ${s}`;
}

/**
 * @param {{de: string, deNom?: string, a: string, sujet: string, texte: string,
 *          enReponseA?: string|null, references?: string|null}} m
 * @returns {Promise<Buffer>}
 */
export function construireMime(m) {
  const references = [m.references, m.enReponseA].filter(Boolean).join(" ").trim() || undefined;
  const mail = new MailComposer({
    from: m.deNom ? { name: m.deNom, address: m.de } : m.de,
    to: m.a,
    subject: m.sujet,
    text: m.texte,
    inReplyTo: m.enReponseA || undefined,
    references,
    headers: { "X-Mailer": "Relais" },
  });
  return new Promise((resolve, reject) => mail.compile().build((err, msg) => (err ? reject(err) : resolve(msg))));
}
