import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";

const LIBELLES = { prevu: "Prévu", en_cours: "En cours", termine: "Terminé", facture: "Facturé", archive: "Archivé" };

export default async function Chantiers() {
  const supabase = await createClient();
  const { data: chantiers } = await supabase
    .from("chantiers")
    .select("id, nom, localite, statut, date_debut, clients(raison_sociale, prenom, nom)")
    .neq("statut", "archive")
    .order("created_at", { ascending: false });

  return (
    <>
      <h1>Chantiers</h1>
      <p className="sous-titre">Un chantier est créé en un clic depuis un devis accepté</p>
      <table>
        <thead><tr><th>Chantier</th><th>Client</th><th>Lieu</th><th>Début</th><th>Statut</th></tr></thead>
        <tbody>
          {(chantiers ?? []).map((c) => (
            <tr key={c.id}>
              <td><Link href={`/chantiers/${c.id}`}>{c.nom}</Link></td>
              <td>{c.clients?.raison_sociale || `${c.clients?.prenom ?? ""} ${c.clients?.nom ?? ""}`}</td>
              <td>{c.localite ?? "—"}</td>
              <td>{fmtDate(c.date_debut)}</td>
              <td><span className="badge">{LIBELLES[c.statut]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
