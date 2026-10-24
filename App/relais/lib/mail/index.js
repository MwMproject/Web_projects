import * as imap from "./imap.js";
import * as gmail from "./gmail.js";
import * as microsoft from "./microsoft.js";

const CONNECTEURS = { imap, gmail, microsoft };

/** Renvoie le connecteur (lireNouveaux, envoyer) adapté à la boîte. */
export function connecteur(fournisseur) {
  const c = CONNECTEURS[fournisseur];
  if (!c) throw new Error(`Fournisseur inconnu : ${fournisseur}`);
  return c;
}

export { PRESETS } from "./imap.js";
