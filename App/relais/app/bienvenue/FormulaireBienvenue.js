"use client";
import { useActionState } from "react";
import { creerEntreprise } from "@/app/(app)/actions";

export default function FormulaireBienvenue() {
  const [etat, action, enCours] = useActionState(creerEntreprise, {});
  return (
    <form action={action} className="carte">
      <label htmlFor="nom">Nom de l'entreprise</label>
      <input id="nom" name="nom" required placeholder="Peinture Martin Sàrl" />
      <div className="deux">
        <div><label htmlFor="prenom">Votre prénom</label><input id="prenom" name="prenom" /></div>
        <div><label htmlFor="nom_personne">Votre nom</label><input id="nom_personne" name="nom_personne" /></div>
      </div>
      {etat?.erreur && <p className="message-erreur">{etat.erreur}</p>}
      <div className="actions"><button className="bouton" disabled={enCours}>Continuer</button></div>
    </form>
  );
}
