"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Connexion() {
  const router = useRouter();
  const [mode, setMode] = useState("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [info, setInfo] = useState({ erreur: "", ok: "" });
  const [enCours, setEnCours] = useState(false);

  async function valider(e) {
    e.preventDefault();
    setEnCours(true);
    setInfo({ erreur: "", ok: "" });
    const supabase = createClient();
    if (mode === "connexion") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
      setEnCours(false);
      if (error) return setInfo({ erreur: "E-mail ou mot de passe incorrect.", ok: "" });
      router.replace("/");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({ email, password: motDePasse, options: { emailRedirectTo: `${location.origin}/bienvenue` } });
      setEnCours(false);
      if (error) return setInfo({ erreur: "Inscription impossible (mot de passe d'au moins 10 caractères).", ok: "" });
      setInfo({ erreur: "", ok: "Vérifiez votre boîte mail pour confirmer votre adresse." });
    }
  }

  return (
    <main className="page" style={{ maxWidth: 440, paddingTop: 72 }}>
      <h1>Re<span style={{ color: "var(--accent)" }}>lais</span></h1>
      <p className="sous-titre">Vos e-mails triés, résumés et prêts à répondre.</p>
      <form onSubmit={valider} className="carte">
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="mdp">Mot de passe</label>
        <input id="mdp" type="password" minLength={10} autoComplete={mode === "connexion" ? "current-password" : "new-password"} required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        {info.erreur && <p className="message-erreur">{info.erreur}</p>}
        {info.ok && <p className="message-ok">{info.ok}</p>}
        <div className="actions">
          <button className="bouton" disabled={enCours}>{mode === "connexion" ? "Se connecter" : "Créer mon compte"}</button>
          <button type="button" className="bouton secondaire" onClick={() => setMode(mode === "connexion" ? "inscription" : "connexion")}>
            {mode === "connexion" ? "Créer un compte" : "J'ai déjà un compte"}
          </button>
        </div>
      </form>
    </main>
  );
}
