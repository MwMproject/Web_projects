// Fiche chantier : rapports reçus du terrain + facturation en un clic.
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fmtChf, fmtDate } from "@/lib/format";

async function facturerRegie(formData) {
  "use server";
  const supabase = await createClient();
  const { data: factureId, error } = await supabase.rpc("facturer_regie", { p_chantier: formData.get("chantier") });
  if (error) redirect(`/chantiers/${formData.get("chantier")}?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath("/factures");
  redirect(`/factures?nouvelle=${factureId}`);
}

export default async function FicheChantier({ params, searchParams }) {
  const { id } = await params;
  const { erreur } = await searchParams;
  const supabase = await createClient();

  const [{ data: chantier }, { data: renta }, { data: rapports }] = await Promise.all([
    supabase.from("chantiers").select("*, clients(raison_sociale, prenom, nom)").eq("id", id).maybeSingle(),
    supabase.from("chantier_rentabilite").select("*").eq("chantier_id", id).maybeSingle(),
    supabase.from("rapports")
      .select("id, date_rapport, statut, est_regie, remarques, membres!rapports_auteur_id_fkey(prenom, nom), rapport_heures(heures, type, facture_id), rapport_materiel(designation, quantite, unite, facture_id)")
      .eq("chantier_id", id).order("date_rapport", { ascending: false }),
  ]);
  if (!chantier) notFound();

  return (
    <>
      <h1>{chantier.nom}</h1>
      <p className="sous-titre">
        {chantier.clients?.raison_sociale || `${chantier.clients?.prenom ?? ""} ${chantier.clients?.nom ?? ""}`} · {chantier.localite ?? ""}
      </p>
      {erreur && <p className="alerte">{erreur}</p>}

      <div className="grille" style={{ marginBottom: 24 }}>
        <div className="carte"><div className="sous-titre" style={{ margin: 0 }}>Devis HT</div><h2>{fmtChf(renta?.budget_ht)}</h2></div>
        <div className="carte"><div className="sous-titre" style={{ margin: 0 }}>Coût réel</div><h2>{fmtChf(renta?.cout_total)}</h2></div>
        <div className="carte"><div className="sous-titre" style={{ margin: 0 }}>Marge prévue</div><h2 className={renta?.marge_prevue < 0 ? "alerte" : "ok"}>{fmtChf(renta?.marge_prevue)}</h2></div>
      </div>

      <form action={facturerRegie} style={{ marginBottom: 24 }}>
        <input type="hidden" name="chantier" value={id} />
        <button className="bouton">Facturer les heures et le matériel non facturés</button>
      </form>

      <h2>Rapports du terrain</h2>
      <table>
        <thead><tr><th>Date</th><th>Par</th><th>Heures</th><th>Matériel</th><th>Remarques</th><th>Statut</th></tr></thead>
        <tbody>
          {(rapports ?? []).map((r) => (
            <tr key={r.id}>
              <td>{fmtDate(r.date_rapport)}</td>
              <td>{r.membres?.prenom} {r.membres?.nom}</td>
              <td>{r.rapport_heures.reduce((s, h) => s + Number(h.heures), 0)} h</td>
              <td>{r.rapport_materiel.map((m) => `${Number(m.quantite)} ${m.unite} ${m.designation}`).join(", ") || "—"}</td>
              <td>{r.remarques}</td>
              <td><span className="badge">{r.est_regie ? "Régie · " : ""}{r.statut}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
