import { getSession } from "@/lib/supabase/server";
import { dateCourte } from "@/lib/libelles";
import { basculerPause, supprimerBoite } from "../../actions";
import FormulaireImap from "./FormulaireImap";

const STATUTS = { actif: "Active", erreur: "Erreur", pause: "En pause", a_reconnecter: "À reconnecter" };
const ERREURS = {
  "lien-expire": "Le lien de connexion a expiré, recommencez.",
  "autorisation-refusee": "Autorisation refusée.",
  session: "Session invalide, reconnectez-vous.",
  "pas-de-jeton-longue-duree": "Le fournisseur n'a pas accordé d'accès durable. Retirez Relais des applications autorisées de votre compte, puis recommencez.",
  "connexion-impossible": "Connexion impossible pour le moment.",
};

export default async function Boites({ searchParams }) {
  const { erreur, ajoute } = await searchParams;
  const { supabase, membre } = await getSession();
  const { data: comptes } = await supabase.from("comptes_mail").select("*").order("created_at");
  const admin = membre.role === "admin";

  return (
    <>
      <h1>Boîtes mail</h1>
      <p className="sous-titre">Relais lit les nouveaux e-mails toutes les 5 minutes et répond depuis la même adresse.</p>
      {ajoute && <p className="message-ok">Boîte connectée.</p>}
      {erreur && <p className="message-erreur">{ERREURS[erreur] || "Erreur de connexion."}</p>}

      <div className="pile">
        {(comptes ?? []).map((c) => (
          <div key={c.id} className="carte">
            <div className="mail"><div className="haut">
              <span className="qui">{c.libelle} · {c.email}</span>
              <span className={`badge ${c.statut === "actif" ? "" : "urgent"}`}>{STATUTS[c.statut]}</span>
            </div></div>
            <div className="discret">
              {c.fournisseur === "imap" ? `IMAP ${c.imap_hote}` : c.fournisseur === "gmail" ? "Gmail (connexion Google)" : "Outlook (connexion Microsoft)"}
              {c.derniere_synchro ? ` · dernière lecture ${dateCourte(c.derniere_synchro)}` : ""}
            </div>
            {c.derniere_erreur && <p className="message-erreur">{c.derniere_erreur}</p>}
            {admin && (
              <div className="actions">
                {c.statut === "a_reconnecter" && c.fournisseur !== "imap" && <a className="bouton" href={`/api/oauth/${c.fournisseur}/debut`}>Reconnecter</a>}
                <form action={basculerPause}><input type="hidden" name="compte" value={c.id} /><input type="hidden" name="statut" value={c.statut === "pause" ? "actif" : "pause"} />
                  <button className="bouton secondaire">{c.statut === "pause" ? "Reprendre" : "Mettre en pause"}</button></form>
                <form action={supprimerBoite}><input type="hidden" name="compte" value={c.id} /><button className="bouton danger">Déconnecter</button></form>
              </div>
            )}
          </div>
        ))}
      </div>

      {admin && (
        <>
          <h2>Connecter une boîte</h2>
          <div className="actions" style={{ marginTop: 0 }}>
            <a className="bouton secondaire" href="/api/oauth/gmail/debut">Gmail / Google Workspace</a>
            <a className="bouton secondaire" href="/api/oauth/microsoft/debut">Outlook / Microsoft 365</a>
          </div>
          <h2>Infomaniak, Bluewin, Hostpoint ou autre (IMAP)</h2>
          <FormulaireImap />
        </>
      )}
    </>
  );
}
