// Téléphone de l'ouvrier : ses chantiers, un gros bouton par chantier.
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

export default async function Terrain() {
  const { supabase, membre } = await getSession();
  if (!membre) redirect("/connexion");

  // La RLS ne renvoie à un ouvrier que les chantiers où il est assigné.
  const { data: chantiers } = await supabase
    .from("chantiers")
    .select("id, nom, adresse, localite, statut")
    .in("statut", ["prevu", "en_cours"])
    .order("nom");

  return (
    <main className="terrain">
      <h1>Bonjour {membre.prenom}</h1>
      <p className="sous-titre">{membre.entreprises?.nom} · choisis ton chantier</p>
      {(chantiers ?? []).map((c) => (
        <Link key={c.id} href={`/terrain/rapport/${c.id}`} className="carte chantier">
          <strong>{c.nom}</strong>
          <div className="sous-titre" style={{ margin: "4px 0 0" }}>{[c.adresse, c.localite].filter(Boolean).join(", ")}</div>
        </Link>
      ))}
      {!chantiers?.length && <p>Aucun chantier ne t'est assigné pour le moment.</p>}
    </main>
  );
}
