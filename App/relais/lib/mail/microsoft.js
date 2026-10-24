// Outlook.com / Microsoft 365 via Microsoft Graph (OAuth).
import { normaliser } from "./normaliser.js";
import { construireMime } from "./composer.js";
import { jetonValide } from "./oauth.js";

const API = "https://graph.microsoft.com/v1.0/me";
const PREMIERE_SYNCHRO_JOURS = 3;
const MAX_PAR_SYNCHRO = 30;

async function appel(jeton, chemin, options = {}, format = "json") {
  const res = await fetch(chemin.startsWith("http") ? chemin : `${API}${chemin}`, {
    ...options, headers: { Authorization: `Bearer ${jeton}`, ...options.headers },
  });
  if (res.status === 401) throw new Error("A_RECONNECTER");
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(`Graph ${res.status} : ${json.error?.message || ""}`);
  }
  if (format === "brut") return Buffer.from(await res.arrayBuffer());
  return res.status === 202 || res.status === 204 ? null : res.json();
}

export async function lireNouveaux(compte, secret, curseur = {}) {
  const { jeton, secretMisAJour } = await jetonValide("microsoft", secret);
  const depuis = curseur.depuis || new Date(Date.now() - PREMIERE_SYNCHRO_JOURS * 86_400_000).toISOString();
  const p = new URLSearchParams({
    $select: "id,conversationId,receivedDateTime",
    $filter: `receivedDateTime gt ${depuis}`,
    $orderby: "receivedDateTime asc",
    $top: String(MAX_PAR_SYNCHRO),
  });
  const liste = await appel(jeton, `/mailFolders/inbox/messages?${p}`);
  const messages = [];
  let plusRecent = depuis;
  for (const m of liste.value || []) {
    const mime = await appel(jeton, `/messages/${m.id}/$value`, {}, "brut");
    messages.push(await normaliser(mime, { idFournisseur: m.id, filId: m.conversationId, recuLe: new Date(m.receivedDateTime) }));
    if (m.receivedDateTime > plusRecent) plusRecent = m.receivedDateTime;
  }
  return { messages, curseur: { depuis: plusRecent }, secretMisAJour };
}

export async function envoyer(compte, secret, reponse) {
  const { jeton, secretMisAJour } = await jetonValide("microsoft", secret);
  const brut = await construireMime({ ...reponse, de: compte.email });
  // Graph accepte un message MIME complet encodé en base64 (garde le fil de discussion)
  await appel(jeton, "/sendMail", {
    method: "POST", headers: { "Content-Type": "text/plain" }, body: brut.toString("base64"),
  });
  return { secretMisAJour };
}
