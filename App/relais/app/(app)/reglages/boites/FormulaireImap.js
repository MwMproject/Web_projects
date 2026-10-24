"use client";
import { useActionState, useState } from "react";
import { ajouterBoiteImap } from "../../actions";

const PRESETS = [
  ["infomaniak", "Infomaniak"], ["bluewin", "Bluewin (Swisscom)"], ["hostpoint", "Hostpoint"],
  ["gmail_mdp", "Gmail (mot de passe d'application)"], ["autre", "Autre hébergeur"],
];

export default function FormulaireImap() {
  const [etat, action, enCours] = useActionState(ajouterBoiteImap, {});
  const [preset, setPreset] = useState("infomaniak");
  return (
    <form action={action} className="carte">
      <label htmlFor="preset">Hébergeur</label>
      <select id="preset" name="preset" value={preset} onChange={(e) => setPreset(e.target.value)}>
        {PRESETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <div className="deux">
        <div><label htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" required placeholder="info@entreprise.ch" /></div>
        <div><label htmlFor="libelle">Nom affiché</label><input id="libelle" name="libelle" required placeholder="Contact" /></div>
      </div>
      <label htmlFor="motDePasse">Mot de passe de la boîte</label>
      <input id="motDePasse" name="motDePasse" type="password" autoComplete="off" required />
      <p className="discret">Chiffré avant d'être enregistré ; personne ne peut le relire, pas même vous.
        {preset === "gmail_mdp" && " Gmail exige un « mot de passe d'application » (Compte Google › Sécurité)."}</p>
      {preset === "autre" && (
        <div className="deux">
          <div><label>Serveur IMAP</label><input name="imap_hote" placeholder="imap.exemple.ch" /></div>
          <div><label>Port IMAP</label><input name="imap_port" type="number" defaultValue={993} /></div>
          <div><label>Serveur SMTP</label><input name="smtp_hote" placeholder="smtp.exemple.ch" /></div>
          <div><label>Port SMTP</label><input name="smtp_port" type="number" defaultValue={465} /></div>
          <div><label>Identifiant (si différent de l'adresse)</label><input name="utilisateur" /></div>
        </div>
      )}
      {etat?.erreur && <p className="message-erreur">{etat.erreur}</p>}
      {etat?.ok && <p className="message-ok">{etat.ok}</p>}
      <div className="actions"><button className="bouton" disabled={enCours}>{enCours ? "Vérification de la connexion…" : "Connecter"}</button></div>
    </form>
  );
}
