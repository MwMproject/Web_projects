"use server";
// Actions déclenchées par les boutons de l'interface.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { analyserEnAttente, envoyerBrouillon, enregistrerSecret, journaliser, synchroniserCompte } from "@/lib/pipeline";
import { PRESETS, tester } from "@/lib/mail/imap";

async function exigerMembre(admin = false) {
  const { supabase, user, membre } = await getSession();
  if (!user || !membre) redirect("/connexion");
  if (admin && membre.role !== "admin") throw new Error("Réservé aux administrateurs");
  return { supabase, user, membre };
}

/** Enregistre les retouches du brouillon (RLS) puis l'envoie (serveur). */
export async function envoyer(formData) {
  const { supabase, user, membre } = await exigerMembre();
  const id = String(formData.get("brouillon"));
  const sujet = String(formData.get("sujet") || "").slice(0, 300);
  const corps = String(formData.get("corps") || "").slice(0, 10_000);
  if (!corps.trim()) throw new Error("Le message est vide");
  // Passe par la RLS : garantit que le brouillon appartient bien à l'entreprise du membre
  const { data, error } = await supabase.from("brouillons").update({ sujet, corps }).eq("id", id).eq("statut", "a_valider").select("id, message_id").maybeSingle();
  if (error || !data) throw new Error("Brouillon introuvable ou déjà traité");
  await envoyerBrouillon(adminClient(), { brouillonId: id, membreId: membre.id, userId: user.id });
  revalidatePath("/boite");
  redirect("/boite?envoye=1");
}

export async function abandonner(formData) {
  const { supabase } = await exigerMembre();
  await supabase.from("brouillons").update({ statut: "abandonne" }).eq("id", String(formData.get("brouillon")));
  revalidatePath("/boite");
  redirect("/boite");
}

export async function changerStatutMessage(formData) {
  const { supabase } = await exigerMembre();
  const statut = z.enum(["a_traiter", "ignore", "archive"]).parse(formData.get("statut"));
  await supabase.from("messages").update({ statut }).eq("id", String(formData.get("message")));
  revalidatePath("/boite");
  redirect("/boite");
}

/** Bouton "Vérifier maintenant" : synchronise les boîtes de l'entreprise et lance l'analyse. */
export async function synchroniserMaintenant() {
  const { supabase, membre } = await exigerMembre();
  const { data: comptes } = await supabase.from("comptes_mail").select("id").in("statut", ["actif", "erreur"]);
  const db = adminClient();
  for (const { id } of comptes || []) {
    const { data: compte } = await db.from("comptes_mail").select("*").eq("id", id).eq("entreprise_id", membre.entreprise_id).single();
    if (compte) await synchroniserCompte(db, compte);
  }
  await analyserEnAttente(db, { limite: 15, entrepriseId: membre.entreprise_id });
  revalidatePath("/boite");
}

const schemaImap = z.object({
  preset: z.enum(Object.keys(PRESETS)),
  libelle: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email(),
  utilisateur: z.string().trim().max(200).optional(),
  motDePasse: z.string().min(1).max(500),
  imap_hote: z.string().trim().max(200).optional(),
  imap_port: z.coerce.number().int().min(1).max(65535).optional(),
  smtp_hote: z.string().trim().max(200).optional(),
  smtp_port: z.coerce.number().int().min(1).max(65535).optional(),
});

/** Ajoute une boîte IMAP après avoir vérifié les identifiants. */
export async function ajouterBoiteImap(_etat, formData) {
  const { user, membre } = await exigerMembre(true);
  const brut = Object.fromEntries([...formData.entries()].filter(([, v]) => v !== ""));
  const v = schemaImap.safeParse(brut);
  if (!v.success) return { erreur: "Vérifiez les champs du formulaire." };
  const d = v.data;
  const reglages = d.preset === "autre"
    ? { imap_hote: d.imap_hote, imap_port: d.imap_port || 993, smtp_hote: d.smtp_hote, smtp_port: d.smtp_port || 465, smtp_securise: (d.smtp_port || 465) === 465 }
    : (({ nom, ...r }) => r)(PRESETS[d.preset]);
  if (!reglages.imap_hote || !reglages.smtp_hote) return { erreur: "Indiquez les serveurs IMAP et SMTP." };

  const secret = { motDePasse: d.motDePasse, ...(d.utilisateur ? { utilisateur: d.utilisateur } : {}) };
  try {
    await tester({ email: d.email, ...reglages }, secret);
  } catch {
    return { erreur: "Connexion refusée : vérifiez l'adresse, le mot de passe et les serveurs. (Gmail : utilisez un mot de passe d'application.)" };
  }
  const db = adminClient();
  const { data: compte, error } = await db.from("comptes_mail")
    .upsert({ entreprise_id: membre.entreprise_id, fournisseur: "imap", libelle: d.libelle, email: d.email, ...reglages, statut: "actif", derniere_erreur: null, curseur: {} },
      { onConflict: "entreprise_id,email" })
    .select("*").single();
  if (error) return { erreur: "Enregistrement impossible." };
  await enregistrerSecret(db, compte, secret);
  await journaliser(db, membre.entreprise_id, "compte.ajoute", d.email, { fournisseur: "imap", preset: d.preset }, user.id);
  revalidatePath("/reglages/boites");
  return { ok: `${d.email} est connectée. Les e-mails des 3 derniers jours vont être analysés.` };
}

export async function basculerPause(formData) {
  const { supabase } = await exigerMembre(true);
  const statut = formData.get("statut") === "pause" ? "pause" : "actif";
  await supabase.from("comptes_mail").update({ statut }).eq("id", String(formData.get("compte")));
  revalidatePath("/reglages/boites");
}

export async function supprimerBoite(formData) {
  const { supabase, user, membre } = await exigerMembre(true);
  const { data } = await supabase.from("comptes_mail").delete().eq("id", String(formData.get("compte"))).select("email").maybeSingle();
  if (data) await journaliser(adminClient(), membre.entreprise_id, "compte.supprime", data.email, null, user.id);
  revalidatePath("/reglages/boites");
}

const schemaFiche = z.object({
  nom: z.string().trim().min(1).max(120),
  activite: z.string().max(500).optional(),
  services: z.string().max(1500).optional(),
  zone: z.string().max(300).optional(),
  delai_habituel: z.string().max(300).optional(),
  ton: z.string().max(300).optional(),
  signature: z.string().max(600).optional(),
  consignes: z.string().max(3000).optional(),
  recap_actif: z.preprocess((v) => v === "on", z.boolean()),
  recap_heure: z.coerce.number().int().min(0).max(23),
  recap_email: z.string().trim().email().optional().or(z.literal("")),
});

export async function enregistrerFiche(_etat, formData) {
  const { supabase, membre } = await exigerMembre(true);
  const v = schemaFiche.safeParse(Object.fromEntries(formData.entries()));
  if (!v.success) return { erreur: "Vérifiez les champs (e-mail du récap, longueur des textes)." };
  const { error } = await supabase.from("entreprises").update({ ...v.data, recap_email: v.data.recap_email || null }).eq("id", membre.entreprise_id);
  if (error) return { erreur: "Enregistrement impossible." };
  revalidatePath("/reglages/assistant");
  return { ok: "Fiche enregistrée. Les prochaines réponses en tiendront compte." };
}

export async function creerEntreprise(_etat, formData) {
  const { supabase, user, membre } = await getSession();
  if (!user) redirect("/connexion");
  if (membre) redirect("/boite");
  const nom = String(formData.get("nom") || "").trim();
  if (!nom) return { erreur: "Indiquez le nom de l'entreprise." };
  const { error } = await supabase.rpc("creer_entreprise", {
    p_nom: nom, p_prenom: String(formData.get("prenom") || ""), p_nom_personne: String(formData.get("nom_personne") || ""),
  });
  if (error) return { erreur: "Création impossible." };
  redirect("/reglages/assistant?bienvenue=1");
}
