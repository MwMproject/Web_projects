// Appelé toutes les heures : envoie le récap aux entreprises dont c'est l'heure (heure de Zurich).
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { construireRecap, envoyerRecap, heureZurich, jourZurich } from "@/lib/recap";
import { autorise } from "@/lib/taches";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!autorise(request)) return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });
  const db = adminClient();
  const heure = heureZurich();
  const jour = jourZurich();
  const debutJour = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { data: entreprises } = await db.from("entreprises").select("*").eq("recap_actif", true).eq("recap_heure", heure);
  let envoyes = 0;
  for (const e of entreprises || []) {
    if (!e.recap_email) continue;
    // Réserve le récap du jour (clé primaire) : jamais deux envois
    const { error: deja } = await db.from("recaps").insert({ entreprise_id: e.id, jour });
    if (deja) continue;
    const [{ data: messages }, { count }] = await Promise.all([
      db.from("messages").select("sujet, expediteur_nom, expediteur_email, analyses(categorie, urgence, resume)")
        .eq("entreprise_id", e.id).gte("recu_le", debutJour).order("recu_le"),
      db.from("brouillons").select("id", { count: "exact", head: true }).eq("entreprise_id", e.id).eq("statut", "a_valider"),
    ]);
    const recap = construireRecap(e, messages || [], count || 0, process.env.RELAIS_URL);
    if (recap.vide) continue;
    try {
      await envoyerRecap(e.recap_email, recap);
      envoyes += 1;
    } catch {
      await db.from("recaps").delete().eq("entreprise_id", e.id).eq("jour", jour);   // réessai à la prochaine heure
    }
  }
  return NextResponse.json({ heure, entreprises: entreprises?.length || 0, envoyes });
}
