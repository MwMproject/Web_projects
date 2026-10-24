"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FormulaireRapport({ chantierId, membreId, articles, depots }) {
  const router = useRouter();
  const [heures, setHeures] = useState(8);
  const [typeHeures, setTypeHeures] = useState("normal");
  const [materiel, setMateriel] = useState([]);
  const [remarques, setRemarques] = useState("");
  const [etat, setEtat] = useState({ enCours: false, erreur: "" });

  const ajouterMateriel = () =>
    setMateriel([...materiel, { article_id: articles[0]?.id ?? "", quantite: 1, depot_id: depots[0]?.id ?? "" }]);
  const majMateriel = (i, champ, valeur) =>
    setMateriel(materiel.map((m, j) => (j === i ? { ...m, [champ]: valeur } : m)));
  const retirerMateriel = (i) => setMateriel(materiel.filter((_, j) => j !== i));

  async function envoyer(e) {
    e.preventDefault();
    setEtat({ enCours: true, erreur: "" });
    const supabase = createClient();
    try {
      // 1. Le rapport (brouillon tant que les lignes ne sont pas toutes enregistrées)
      const { data: rapport, error: e1 } = await supabase
        .from("rapports")
        .insert({ chantier_id: chantierId, auteur_id: membreId, remarques, est_regie: typeHeures === "regie" })
        .select("id").single();
      if (e1) throw e1;

      // 2. Les heures
      if (Number(heures) > 0) {
        const { error } = await supabase.from("rapport_heures")
          .insert({ rapport_id: rapport.id, membre_id: membreId, heures: Number(heures), type: typeHeures });
        if (error) throw error;
      }

      // 3. Le matériel : la sortie de stock est faite automatiquement par la base
      if (materiel.length) {
        const lignes = materiel.map((m) => {
          const a = articles.find((x) => x.id === m.article_id);
          return {
            rapport_id: rapport.id, article_id: m.article_id, designation: a?.designation ?? "",
            unite: a?.unite ?? "u", quantite: Number(m.quantite), depot_id: m.depot_id || null,
          };
        });
        const { error } = await supabase.from("rapport_materiel").insert(lignes);
        if (error) throw error;
      }

      // 4. Envoi au bureau (le rapport n'est plus modifiable par l'ouvrier)
      const { error: e4 } = await supabase.from("rapports").update({ statut: "envoye" }).eq("id", rapport.id);
      if (e4) throw e4;

      router.push("/terrain?envoye=1");
    } catch (err) {
      setEtat({ enCours: false, erreur: "Envoi impossible : " + (err.message ?? "erreur inconnue") });
    }
  }

  return (
    <form onSubmit={envoyer}>
      <div className="carte">
        <label htmlFor="heures">Mes heures aujourd'hui</label>
        <input id="heures" type="number" inputMode="decimal" step="0.25" min="0" max="24" value={heures} onChange={(e) => setHeures(e.target.value)} />
        <label htmlFor="type">Type</label>
        <select id="type" value={typeHeures} onChange={(e) => setTypeHeures(e.target.value)}>
          <option value="normal">Travail au forfait (devis)</option>
          <option value="regie">Régie (facturé à l'heure)</option>
          <option value="deplacement">Déplacement</option>
        </select>
      </div>

      <div className="carte" style={{ marginTop: 12 }}>
        <strong>Matériel utilisé</strong>
        {materiel.map((m, i) => (
          <div key={i} style={{ borderTop: "1px solid var(--ligne)", marginTop: 12, paddingTop: 4 }}>
            <label>Article</label>
            <select value={m.article_id} onChange={(e) => majMateriel(i, "article_id", e.target.value)}>
              {articles.map((a) => <option key={a.id} value={a.id}>{a.designation} ({a.unite})</option>)}
            </select>
            <div className="ligne-saisie">
              <div>
                <label>Origine</label>
                <select value={m.depot_id} onChange={(e) => majMateriel(i, "depot_id", e.target.value)}>
                  {depots.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
                  <option value="">Acheté / livré sur chantier</option>
                </select>
              </div>
              <div>
                <label>Qté</label>
                <input type="number" inputMode="decimal" step="0.5" min="0.001" value={m.quantite} onChange={(e) => majMateriel(i, "quantite", e.target.value)} />
              </div>
              <button type="button" className="bouton secondaire" onClick={() => retirerMateriel(i)} aria-label="Retirer">×</button>
            </div>
          </div>
        ))}
        <p><button type="button" className="bouton secondaire" onClick={ajouterMateriel} disabled={!articles.length}>+ Ajouter du matériel</button></p>
      </div>

      <div className="carte" style={{ marginTop: 12 }}>
        <label htmlFor="remarques">Remarques (travaux faits, problèmes)</label>
        <textarea id="remarques" rows={3} value={remarques} onChange={(e) => setRemarques(e.target.value)} />
        {/* À venir : photos (Supabase Storage) et signature du client pour la régie */}
      </div>

      {etat.erreur && <p className="alerte">{etat.erreur}</p>}
      <p><button className="bouton large" disabled={etat.enCours}>{etat.enCours ? "Envoi…" : "Envoyer au bureau"}</button></p>
    </form>
  );
}
