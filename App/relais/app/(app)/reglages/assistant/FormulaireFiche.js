"use client";
import { useActionState } from "react";
import { enregistrerFiche } from "../../actions";

function Champ({ nom, label, aide, lignes, valeur, ...rest }) {
  return (
    <>
      <label htmlFor={nom}>{label}</label>
      {lignes ? <textarea id={nom} name={nom} rows={lignes} defaultValue={valeur ?? ""} {...rest} />
        : <input id={nom} name={nom} defaultValue={valeur ?? ""} {...rest} />}
      {aide && <div className="discret">{aide}</div>}
    </>
  );
}

export default function FormulaireFiche({ e, admin }) {
  const [etat, action, enCours] = useActionState(enregistrerFiche, {});
  return (
    <form action={action} className="carte">
      <fieldset disabled={!admin} style={{ border: 0, padding: 0, margin: 0 }}>
        <Champ nom="nom" label="Nom de l'entreprise" valeur={e.nom} required />
        <Champ nom="activite" label="Activité" valeur={e.activite} placeholder="Entreprise de peinture et plâtrerie, 6 personnes, depuis 1998" />
        <Champ nom="services" label="Services proposés" lignes={3} valeur={e.services} placeholder="Peinture intérieure et extérieure, crépis, plâtre, papier peint, rénovation de façades" />
        <Champ nom="zone" label="Zone d'intervention" valeur={e.zone} placeholder="Chablais, Riviera, Lausanne" />
        <Champ nom="delai_habituel" label="Délais habituels" valeur={e.delai_habituel} placeholder="Visite sous 5 jours ouvrables, devis sous 10 jours" />
        <Champ nom="ton" label="Ton des réponses" valeur={e.ton} />
        <Champ nom="consignes" label="Consignes particulières" lignes={4} valeur={e.consignes}
          placeholder={"Ne jamais donner de prix par e-mail.\nProposer une visite gratuite pour tout devis.\nFermé du 22 décembre au 5 janvier."}
          aide="L'assistante les respecte dans chaque brouillon." />
        <Champ nom="signature" label="Signature" lignes={4} valeur={e.signature} placeholder={"Meilleures salutations\n\nPaul Martin\nPeinture Martin Sàrl\n079 123 45 67"} />
        <h2>Récapitulatif du soir</h2>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" name="recap_actif" defaultChecked={e.recap_actif} style={{ width: "auto" }} /> Recevoir un résumé de la journée par e-mail
        </label>
        <div className="deux">
          <div>
            <label htmlFor="recap_heure">Heure d'envoi</label>
            <select id="recap_heure" name="recap_heure" defaultValue={e.recap_heure}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h} h 00</option>)}
            </select>
          </div>
          <Champ nom="recap_email" label="Envoyer à" valeur={e.recap_email} type="email" />
        </div>
        {etat?.erreur && <p className="message-erreur">{etat.erreur}</p>}
        {etat?.ok && <p className="message-ok">{etat.ok}</p>}
        <div className="actions"><button className="bouton" disabled={enCours}>Enregistrer</button></div>
      </fieldset>
      {!admin && <p className="discret">Seul un administrateur peut modifier cette fiche.</p>}
    </form>
  );
}
