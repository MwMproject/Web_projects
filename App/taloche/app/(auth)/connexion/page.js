"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Connexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function seConnecter(e) {
    e.preventDefault();
    setEnCours(true);
    setErreur("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    setEnCours(false);
    if (error) return setErreur("E-mail ou mot de passe incorrect.");
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="terrain" style={{ paddingTop: 64 }}>
      <h1>Taloche</h1>
      <p className="sous-titre">Connexion à votre entreprise</p>
      <form onSubmit={seConnecter} className="carte">
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="mdp">Mot de passe</label>
        <input id="mdp" type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        {erreur && <p className="alerte">{erreur}</p>}
        <p><button className="bouton large" disabled={enCours}>{enCours ? "Connexion…" : "Se connecter"}</button></p>
      </form>
    </main>
  );
}
