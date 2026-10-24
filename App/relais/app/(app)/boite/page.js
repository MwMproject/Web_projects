// Boîte du jour : ce qui demande une action, trié et résumé par l'IA.
import Link from "next/link";
import { getSession } from "@/lib/supabase/server";
import { CATEGORIES, ORDRE_SECTIONS, dateCourte } from "@/lib/libelles";
import { synchroniserMaintenant } from "../actions";

function Carte({ m }) {
  const a = m.analyses;
  const urgent = a?.urgence === "haute";
  const brouillon = m.brouillons?.statut === "a_valider";
  return (
    <Link href={`/boite/${m.id}`} className={`carte mail ${urgent ? "urgent" : ""}`}>
      <div className="haut">
        <span className="qui">{m.expediteur_nom || m.expediteur_email}</span>
        <span className="discret">{dateCourte(m.recu_le)}</span>
      </div>
      <div className="discret">{m.sujet}</div>
      <div className="resume">{a?.resume || m.extrait}</div>
      <div className="puces">
        {urgent && <span className="badge urgent">Urgent</span>}
        {brouillon && <span className="badge">Réponse prête</span>}
        {m.brouillons?.statut === "erreur_envoi" && <span className="badge urgent">Échec d'envoi</span>}
        {(a?.infos_manquantes?.length ?? 0) > 0 && <span className="badge">{a.infos_manquantes.length} info(s) à demander</span>}
      </div>
    </Link>
  );
}

export default async function Boite({ searchParams }) {
  const { envoye } = await searchParams;
  const { supabase } = await getSession();
  const [{ data: messages }, { data: comptes }, { count: automatiques }] = await Promise.all([
    supabase.from("messages")
      .select("id, sujet, extrait, expediteur_nom, expediteur_email, recu_le, statut, analyses(categorie, urgence, resume, infos_manquantes), brouillons(statut)")
      .in("statut", ["a_traiter", "nouveau", "erreur_analyse"])
      .order("recu_le", { ascending: false }).limit(200),
    supabase.from("comptes_mail").select("id, statut"),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("statut", "archive")
      .gte("recu_le", new Date(Date.now() - 86_400_000).toISOString()),
  ]);

  const liste = messages ?? [];
  const enAnalyse = liste.filter((m) => !m.analyses);
  const analyses = liste.filter((m) => m.analyses);
  const urgents = analyses.filter((m) => m.analyses.urgence === "haute");
  const pretes = analyses.filter((m) => m.brouillons?.statut === "a_valider").length;
  const sections = ORDRE_SECTIONS
    .map((cat) => [cat, analyses.filter((m) => m.analyses.categorie === cat && m.analyses.urgence !== "haute")])
    .filter(([, l]) => l.length);

  return (
    <>
      <h1>Boîte du jour</h1>
      <p className="sous-titre">Ce qui attend une action de votre part, trié et résumé.</p>
      {envoye && <p className="message-ok">Réponse envoyée.</p>}
      {!comptes?.length && (
        <div className="carte"><strong>Aucune boîte connectée.</strong> <Link href="/reglages/boites">Connecter une boîte mail →</Link></div>
      )}

      <div className="compteurs">
        <div className="carte"><span className="discret">Urgents</span><strong style={{ color: urgents.length ? "var(--urgent)" : undefined }}>{urgents.length}</strong></div>
        <div className="carte"><span className="discret">Réponses prêtes</span><strong>{pretes}</strong></div>
        <div className="carte"><span className="discret">À traiter</span><strong>{analyses.length}</strong></div>
        <div className="carte"><span className="discret">Classés automatiquement (24 h)</span><strong>{automatiques ?? 0}</strong></div>
      </div>
      <form action={synchroniserMaintenant}><button className="bouton secondaire">Vérifier les nouveaux e-mails</button></form>

      {urgents.length > 0 && (<><h2 style={{ color: "var(--urgent)" }}>Urgent</h2><div className="pile">{urgents.map((m) => <Carte key={m.id} m={m} />)}</div></>)}
      {sections.map(([cat, l]) => (
        <section key={cat}><h2>{CATEGORIES[cat]} ({l.length})</h2><div className="pile">{l.map((m) => <Carte key={m.id} m={m} />)}</div></section>
      ))}
      {enAnalyse.length > 0 && (<><h2>En cours d'analyse ({enAnalyse.length})</h2><div className="pile">{enAnalyse.map((m) => <Carte key={m.id} m={m} />)}</div></>)}
      {!liste.length && comptes?.length > 0 && <p className="carte">Rien à traiter. Bonne journée !</p>}
    </>
  );
}
