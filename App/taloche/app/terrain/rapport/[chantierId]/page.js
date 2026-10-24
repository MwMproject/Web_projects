// Rapport du jour : heures + matériel (avec dépôt d'origine) + remarques.
// Objectif : rempli en moins de 60 secondes avec des gants.
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import FormulaireRapport from "./FormulaireRapport";

export default async function Rapport({ params }) {
  const { chantierId } = await params;
  const { supabase, membre } = await getSession();
  if (!membre) redirect("/connexion");

  const [{ data: chantier }, { data: articles }, { data: depots }] = await Promise.all([
    supabase.from("chantiers").select("id, nom").eq("id", chantierId).maybeSingle(),
    // Vue sans prix : un ouvrier ne voit jamais les prix d'achat ni de vente.
    supabase.from("articles_terrain").select("id, designation, unite, stockable").neq("type", "prestation").order("designation"),
    supabase.from("depots").select("id, nom").eq("actif", true).order("nom"),
  ]);
  if (!chantier) notFound();

  return (
    <main className="terrain">
      <h1>{chantier.nom}</h1>
      <p className="sous-titre">Rapport du {new Date().toLocaleDateString("fr-CH")}</p>
      <FormulaireRapport chantierId={chantier.id} membreId={membre.id} articles={articles ?? []} depots={depots ?? []} />
    </main>
  );
}
