// Écran principal du patron : "est-ce que mes chantiers sont rentables ?"
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtChf } from "@/lib/format";

export default async function TableauDeBord() {
  const supabase = await createClient();
  const [{ data: chantiers }, { data: alertes }] = await Promise.all([
    supabase.from("chantier_rentabilite").select("*").in("statut", ["prevu", "en_cours", "termine"]).order("nom"),
    supabase.from("stock_niveaux").select("designation, depot, quantite, unite").eq("en_alerte", true),
  ]);

  return (
    <>
      <h1>Tableau de bord</h1>
      <p className="sous-titre">Coût réel de chaque chantier comparé au devis</p>

      <table>
        <thead>
          <tr>
            <th>Chantier</th>
            <th className="nombre">Devis HT</th>
            <th className="nombre">Heures</th>
            <th className="nombre">Coût réel</th>
            <th className="nombre">Budget consommé</th>
            <th className="nombre">Marge prévue</th>
          </tr>
        </thead>
        <tbody>
          {(chantiers ?? []).map((c) => (
            <tr key={c.chantier_id}>
              <td><Link href={`/chantiers/${c.chantier_id}`}>{c.nom}</Link></td>
              <td className="nombre">{fmtChf(c.budget_ht)}</td>
              <td className="nombre">{Number(c.heures)} h</td>
              <td className="nombre">{fmtChf(c.cout_total)}</td>
              <td className={`nombre ${c.budget_consomme_pct > 90 ? "alerte" : ""}`}>
                {c.budget_consomme_pct == null ? "—" : `${c.budget_consomme_pct} %`}
              </td>
              <td className={`nombre ${c.marge_prevue < 0 ? "alerte" : "ok"}`}>{fmtChf(c.marge_prevue)}</td>
            </tr>
          ))}
          {!chantiers?.length && <tr><td colSpan={6}>Aucun chantier en cours.</td></tr>}
        </tbody>
      </table>

      {!!alertes?.length && (
        <div className="carte" style={{ marginTop: 24 }}>
          <strong className="alerte">Stock bas</strong>
          <ul>{alertes.map((a) => <li key={a.designation + a.depot}>{a.designation} : {Number(a.quantite)} {a.unite} ({a.depot})</li>)}</ul>
        </div>
      )}
    </>
  );
}
