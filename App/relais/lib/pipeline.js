// Chaîne de traitement côté serveur : synchroniser → analyser → (humain valide) → envoyer.
// `db` = client Supabase service_role (lib/supabase/admin.js).
import { chiffrer, dechiffrer } from "./crypto.js";
import { connecteur } from "./mail/index.js";
import { sujetReponse } from "./mail/composer.js";
import { analyserMessage, signer } from "./ia/analyser.js";

const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

export async function journaliser(db, entrepriseId, action, cible = null, details = null, acteur = null) {
  await db.from("journal").insert({ entreprise_id: entrepriseId, action, cible, details, acteur });
}

async function lireSecret(db, compteId) {
  const ligne = ok(await db.from("comptes_mail_secrets").select("chiffre, iv, tag").eq("compte_id", compteId).single());
  return dechiffrer(ligne);
}

export async function enregistrerSecret(db, compte, secret) {
  ok(await db.from("comptes_mail_secrets").upsert({
    compte_id: compte.id, entreprise_id: compte.entreprise_id, ...chiffrer(secret), updated_at: new Date().toISOString(),
  }));
}

// Messages d'erreur montrés à l'utilisateur : jamais de détail technique ni de secret
function erreurLisible(e) {
  const m = String(e?.message || e);
  if (m === "A_RECONNECTER") return "Autorisation expirée : reconnectez la boîte.";
  if (/auth|login|credentials|password|AUTHENTICATIONFAILED/i.test(m)) return "Identifiant ou mot de passe refusé par le serveur mail.";
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|timeout/i.test(m)) return "Serveur mail injoignable.";
  return "Erreur de synchronisation. Réessai automatique.";
}

/** Lit les nouveaux e-mails d'une boîte et les enregistre. */
export async function synchroniserCompte(db, compte) {
  try {
    const secret = await lireSecret(db, compte.id);
    const { messages, curseur, secretMisAJour } = await connecteur(compte.fournisseur).lireNouveaux(compte, secret, compte.curseur);
    if (secretMisAJour) await enregistrerSecret(db, compte, secretMisAJour);

    let importes = 0;
    for (const { automatique, ...m } of messages) {
      const { data } = await db.from("messages")
        .upsert({ ...m, entreprise_id: compte.entreprise_id, compte_id: compte.id, statut: automatique ? "archive" : "nouveau" },
          { onConflict: "compte_id,id_fournisseur", ignoreDuplicates: true })
        .select("id");
      if (!data?.length) continue;
      importes += 1;
      if (automatique) {
        // Newsletter, notification… : classée sans payer d'analyse IA
        await db.from("analyses").insert({
          message_id: data[0].id, entreprise_id: compte.entreprise_id, categorie: "publicite", urgence: "basse",
          resume: "Message automatique (newsletter, notification ou réponse automatique).", reponse_necessaire: false, modele: "regle",
        });
      }
    }
    ok(await db.from("comptes_mail").update({
      curseur, derniere_synchro: new Date().toISOString(), statut: "actif", derniere_erreur: null,
    }).eq("id", compte.id));
    return { importes };
  } catch (e) {
    const statut = String(e?.message) === "A_RECONNECTER" ? "a_reconnecter" : "erreur";
    await db.from("comptes_mail").update({ statut, derniere_erreur: erreurLisible(e) }).eq("id", compte.id);
    await journaliser(db, compte.entreprise_id, "compte.erreur_synchro", compte.email, { erreur: String(e?.message).slice(0, 300) });
    return { importes: 0, erreur: erreurLisible(e) };
  }
}

/** Analyse les messages en attente (toutes entreprises), dans la limite du plafond IA de chacune. */
export async function analyserEnAttente(db, { limite = 20, client, entrepriseId } = {}) {
  let requete = db.from("messages")
    .select("id, entreprise_id, sujet, corps_texte, expediteur_nom, expediteur_email, recu_le, entreprises(*)")
    .eq("statut", "nouveau").order("recu_le", { ascending: true }).limit(limite);
  if (entrepriseId) requete = requete.eq("entreprise_id", entrepriseId);
  const messages = ok(await requete);

  const plafonnees = new Set();
  let analyses = 0;
  for (const message of messages) {
    const entreprise = message.entreprises;
    if (plafonnees.has(entreprise.id)) continue;
    const { data: atteint } = await db.rpc("plafond_ia_atteint", { p_entreprise: entreprise.id });
    if (atteint) { plafonnees.add(entreprise.id); continue; }   // reste "nouveau", repris le mois suivant ou après hausse du plafond

    try {
      const { analyse, usage, modele } = await analyserMessage({ entreprise, message, client });
      await db.rpc("ajouter_usage_ia", { p_entreprise: entreprise.id, p_entree: usage.entree, p_sortie: usage.sortie, p_cout_microchf: usage.coutMicroChf });
      ok(await db.from("analyses").insert({
        message_id: message.id, entreprise_id: entreprise.id, categorie: analyse.categorie, urgence: analyse.urgence,
        resume: analyse.resume, infos: analyse.infos || {}, infos_manquantes: analyse.infos_manquantes,
        action_suggeree: analyse.action_suggeree || null, reponse_necessaire: analyse.reponse_necessaire,
        modele, tokens_entree: usage.entree, tokens_sortie: usage.sortie,
      }));
      if (analyse.brouillon) {
        ok(await db.from("brouillons").insert({
          message_id: message.id, entreprise_id: entreprise.id,
          sujet: sujetReponse(message.sujet), corps: signer(analyse.brouillon.corps, entreprise),
        }));
      }
      const statut = !analyse.reponse_necessaire && analyse.categorie === "publicite" ? "archive" : "a_traiter";
      ok(await db.from("messages").update({ statut }).eq("id", message.id));
      analyses += 1;
    } catch (e) {
      await db.from("messages").update({ statut: "erreur_analyse" }).eq("id", message.id);
      await journaliser(db, entreprise.id, "ia.erreur", message.id, { erreur: String(e?.message).slice(0, 300) });
    }
  }
  return { analyses, plafonnees: [...plafonnees] };
}

/**
 * Envoie un brouillon validé par un membre. Le brouillon est "réservé" de façon
 * atomique (a_valider → envoye) pour qu'un double clic n'envoie jamais deux fois.
 */
export async function envoyerBrouillon(db, { brouillonId, membreId, userId }) {
  const reserve = ok(await db.from("brouillons")
    .update({ statut: "envoye", envoye_le: new Date().toISOString(), envoye_par: membreId })
    .eq("id", brouillonId).eq("statut", "a_valider").select("*").maybeSingle());
  if (!reserve) throw new Error("Ce brouillon a déjà été traité.");

  const message = ok(await db.from("messages").select("*, comptes_mail(*)").eq("id", reserve.message_id).single());
  const compte = message.comptes_mail;
  try {
    const secret = await lireSecret(db, compte.id);
    const { secretMisAJour } = await connecteur(compte.fournisseur).envoyer(compte, secret, {
      a: message.expediteur_email,
      sujet: reserve.sujet,
      texte: reserve.corps,
      enReponseA: message.message_id_entete,
      references: message.references_entete,
      filId: message.fil_id,
    });
    if (secretMisAJour) await enregistrerSecret(db, compte, secretMisAJour);
    await db.from("messages").update({ statut: "repondu" }).eq("id", message.id);
    await journaliser(db, reserve.entreprise_id, "brouillon.envoye", reserve.id, { a: message.expediteur_email, modifie: reserve.modifie }, userId);
  } catch (e) {
    await db.from("brouillons").update({ statut: "erreur_envoi", erreur: erreurLisible(e), envoye_le: null, envoye_par: null }).eq("id", reserve.id);
    await journaliser(db, reserve.entreprise_id, "brouillon.erreur_envoi", reserve.id, { erreur: String(e?.message).slice(0, 300) }, userId);
    throw new Error(`Envoi impossible : ${erreurLisible(e)}`);
  }
}
