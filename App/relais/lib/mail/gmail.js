// Gmail / Google Workspace via l'API Gmail (OAuth).
import { normaliser } from "./normaliser.js";
import { construireMime } from "./composer.js";
import { jetonValide } from "./oauth.js";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";
const PREMIERE_SYNCHRO_JOURS = 3;
const MAX_PAR_SYNCHRO = 30;

async function appel(jeton, chemin, options = {}) {
  const res = await fetch(`${API}${chemin}`, {
    ...options, headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json", ...options.headers },
  });
  if (res.status === 401) throw new Error("A_RECONNECTER");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gmail ${res.status} : ${json.error?.message || ""}`);
  return json;
}

export async function lireNouveaux(compte, secret, curseur = {}) {
  const { jeton, secretMisAJour } = await jetonValide("gmail", secret);
  const depuis = curseur.depuis || Math.floor(Date.now() / 1000) - PREMIERE_SYNCHRO_JOURS * 86_400;
  const q = encodeURIComponent(`in:inbox -in:chats after:${depuis}`);
  const liste = await appel(jeton, `/messages?q=${q}&maxResults=${MAX_PAR_SYNCHRO}`);
  const messages = [];
  let plusRecent = depuis;
  for (const { id } of liste.messages || []) {
    const m = await appel(jeton, `/messages/${id}?format=raw`);
    const date = new Date(Number(m.internalDate));
    messages.push(await normaliser(Buffer.from(m.raw, "base64url"), { idFournisseur: m.id, filId: m.threadId, recuLe: date }));
    plusRecent = Math.max(plusRecent, Math.floor(Number(m.internalDate) / 1000));
  }
  return { messages, curseur: { depuis: plusRecent }, secretMisAJour };
}

export async function envoyer(compte, secret, reponse) {
  const { jeton, secretMisAJour } = await jetonValide("gmail", secret);
  const brut = await construireMime({ ...reponse, de: compte.email });
  await appel(jeton, "/messages/send", {
    method: "POST",
    body: JSON.stringify({ raw: brut.toString("base64url"), ...(reponse.filId ? { threadId: reponse.filId } : {}) }),
  });
  return { secretMisAJour };
}
