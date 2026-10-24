// Connexion OAuth Google (Gmail) et Microsoft (Outlook / Microsoft 365).
// Aucun mot de passe n'est demandé : l'utilisateur autorise Relais chez Google/Microsoft.

const URL_APP = () => process.env.RELAIS_URL || "http://localhost:3000";

export const OAUTH = {
  gmail: {
    autorisation: "https://accounts.google.com/o/oauth2/v2/auth",
    jeton: "https://oauth2.googleapis.com/token",
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    secret: () => process.env.GOOGLE_CLIENT_SECRET,
    // Lecture + envoi. Ces portées sont "restreintes" chez Google : publication
    // publique = vérification de l'app par Google (voir README).
    portees: "openid email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send",
    extra: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
  },
  microsoft: {
    autorisation: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    jeton: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    clientId: () => process.env.MICROSOFT_CLIENT_ID,
    secret: () => process.env.MICROSOFT_CLIENT_SECRET,
    portees: "offline_access openid email User.Read Mail.Read Mail.Send",
    extra: { response_mode: "query", prompt: "select_account" },
  },
};

export const urlRetour = (fournisseur) => `${URL_APP()}/api/oauth/${fournisseur}/retour`;

export function urlAutorisation(fournisseur, state) {
  const c = OAUTH[fournisseur];
  if (!c?.clientId()) throw new Error(`OAuth ${fournisseur} non configuré`);
  const p = new URLSearchParams({
    client_id: c.clientId(), redirect_uri: urlRetour(fournisseur), response_type: "code",
    scope: c.portees, state, ...c.extra,
  });
  return `${c.autorisation}?${p}`;
}

async function demanderJeton(fournisseur, corps) {
  const c = OAUTH[fournisseur];
  const res = await fetch(c.jeton, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: c.clientId(), client_secret: c.secret(), ...corps }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`OAuth ${fournisseur} : ${json.error_description || json.error || res.status}`);
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expire_le: Date.now() + (json.expires_in - 60) * 1000,
  };
}

export const echangerCode = (fournisseur, code) =>
  demanderJeton(fournisseur, { grant_type: "authorization_code", code, redirect_uri: urlRetour(fournisseur) });

/**
 * Renvoie un jeton d'accès valide ; rafraîchit si besoin.
 * @returns {Promise<{jeton: string, secretMisAJour: object|null}>}
 */
export async function jetonValide(fournisseur, secret) {
  if (secret.access_token && secret.expire_le > Date.now()) return { jeton: secret.access_token, secretMisAJour: null };
  if (!secret.refresh_token) throw new Error("A_RECONNECTER");
  const neuf = await demanderJeton(fournisseur, { grant_type: "refresh_token", refresh_token: secret.refresh_token });
  const secretMisAJour = { ...secret, ...neuf, refresh_token: neuf.refresh_token || secret.refresh_token };
  return { jeton: secretMisAJour.access_token, secretMisAJour };
}

/** Adresse e-mail du compte connecté */
export async function adresseDuCompte(fournisseur, jeton) {
  const url = fournisseur === "gmail"
    ? "https://gmail.googleapis.com/gmail/v1/users/me/profile"
    : "https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${jeton}` } });
  const json = await res.json();
  if (!res.ok) throw new Error(`Profil ${fournisseur} : ${res.status}`);
  return (json.emailAddress || json.mail || json.userPrincipalName || "").toLowerCase();
}
