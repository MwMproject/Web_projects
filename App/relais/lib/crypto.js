// Chiffrement des secrets des boîtes mail (mots de passe, jetons OAuth).
// AES-256-GCM : confidentialité + détection de toute modification.
// La clé vit UNIQUEMENT dans la variable d'environnement RELAIS_CLE_CHIFFREMENT
// (32 octets en base64, générée avec `npm run cle:generer`), jamais en base.
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function cle() {
  const brute = process.env.RELAIS_CLE_CHIFFREMENT;
  if (!brute) throw new Error("RELAIS_CLE_CHIFFREMENT manquante");
  const k = Buffer.from(brute, "base64");
  if (k.length !== 32) throw new Error("RELAIS_CLE_CHIFFREMENT doit faire 32 octets (base64)");
  return k;
}

/** @param {object} valeur  objet JSON à protéger */
export function chiffrer(valeur) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cle(), iv);
  const chiffre = Buffer.concat([cipher.update(JSON.stringify(valeur), "utf8"), cipher.final()]);
  return { chiffre: chiffre.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64") };
}

/** @param {{chiffre: string, iv: string, tag: string}} ligne */
export function dechiffrer(ligne) {
  const decipher = createDecipheriv("aes-256-gcm", cle(), Buffer.from(ligne.iv, "base64"));
  decipher.setAuthTag(Buffer.from(ligne.tag, "base64"));
  const clair = Buffer.concat([decipher.update(Buffer.from(ligne.chiffre, "base64")), decipher.final()]);
  return JSON.parse(clair.toString("utf8"));
}

// Jeton signé (pour le paramètre "state" OAuth) : données + expiration + signature HMAC
export function signer(donnees, dureeSecondes = 600) {
  const corps = Buffer.from(JSON.stringify({ ...donnees, exp: Date.now() + dureeSecondes * 1000 })).toString("base64url");
  const sig = createHmac("sha256", cle()).update(corps).digest("base64url");
  return `${corps}.${sig}`;
}

export function verifierSignature(jeton) {
  const [corps, sig] = String(jeton || "").split(".");
  if (!corps || !sig) return null;
  const attendu = createHmac("sha256", cle()).update(corps).digest();
  const recu = Buffer.from(sig, "base64url");
  if (recu.length !== attendu.length || !timingSafeEqual(recu, attendu)) return null;
  const donnees = JSON.parse(Buffer.from(corps, "base64url").toString("utf8"));
  if (!donnees.exp || donnees.exp < Date.now()) return null;
  return donnees;
}
