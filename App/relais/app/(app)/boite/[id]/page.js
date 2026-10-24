// Un e-mail : l'original, ce que l'IA en a compris, et le brouillon à valider.
import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { CATEGORIES, INFOS, dateCourte } from "@/lib/libelles";
import { abandonner, changerStatutMessage, envoyer } from "../../actions";

export default async function Message({ params }) {
  const { id } = await params;
  const { supabase } = await getSession();
  const { data: m } = await supabase.from("messages")
    .select("*, analyses(*), brouillons(*), comptes_mail(email, libelle)")
    .eq("id", id).maybeSingle();
  if (!m) notFound();
  const a = m.analyses;
  const b = m.brouillons;
  const infos = Object.entries(a?.infos || {}).filter(([, v]) => v);

  return (
    <>
      <p><Link href="/boite" className="discret">← Boîte du jour</Link></p>
      <h1>{m.sujet}</h1>
      <p className="sous-titre">
        {m.expediteur_nom ? `${m.expediteur_nom} · ` : ""}{m.expediteur_email} · {dateCourte(m.recu_le)} · reçu sur {m.comptes_mail?.libelle}
      </p>

      <div className="deux">
        <div className="carte">
          <div className="puces">
            {a && <span className="badge">{CATEGORIES[a.categorie]}</span>}
            {a?.urgence === "haute" && <span className="badge urgent">Urgent</span>}
          </div>
          <p><strong>{a?.resume || "Analyse en cours…"}</strong></p>
          {a?.action_suggeree && <p className="discret">Suggestion : {a.action_suggeree}</p>}
          {infos.length > 0 && (
            <dl className="infos">{infos.map(([k, v]) => (<Fragment key={k}><dt>{INFOS[k] || k}</dt><dd>{String(v)}</dd></Fragment>))}</dl>
          )}
          {a?.infos_manquantes?.length > 0 && (
            <><p className="discret" style={{ marginBottom: 4 }}>À demander :</p><div className="puces">{a.infos_manquantes.map((x) => <span key={x} className="badge">{x}</span>)}</div></>
          )}
        </div>
        <div className="carte">
          <p className="discret" style={{ marginTop: 0 }}>Message d'origine</p>
          <div className="original">{m.corps_texte}</div>
        </div>
      </div>

      {b && b.statut === "a_valider" && (
        <>
          <h2>Réponse proposée</h2>
          <form action={envoyer} className="carte">
            <input type="hidden" name="brouillon" value={b.id} />
            <label htmlFor="sujet">Objet</label>
            <input id="sujet" name="sujet" defaultValue={b.sujet} />
            <label htmlFor="corps">Message (modifiez librement avant d'envoyer)</label>
            <textarea id="corps" name="corps" rows={12} defaultValue={b.corps} />
            <p className="discret">Envoyé depuis {m.comptes_mail?.email}, dans la même conversation. Rien ne part sans votre clic.</p>
            <div className="actions">
              <button className="bouton">Envoyer la réponse</button>
              <button formAction={abandonner} className="bouton secondaire">Je réponds moi-même</button>
            </div>
          </form>
        </>
      )}
      {b?.statut === "envoye" && <p className="message-ok">Réponse envoyée le {dateCourte(b.envoye_le)}{b.modifie ? " (retouchée)" : ""}.</p>}
      {b?.statut === "erreur_envoi" && <p className="message-erreur">L'envoi a échoué : {b.erreur}</p>}
      {!b && a && !a.reponse_necessaire && <p className="discret">Aucune réponse nécessaire selon l'assistante.</p>}

      <form action={changerStatutMessage} className="actions">
        <input type="hidden" name="message" value={m.id} />
        <button name="statut" value="archive" className="bouton secondaire">Marquer comme traité</button>
        <button name="statut" value="ignore" className="bouton secondaire">Ignorer</button>
      </form>
    </>
  );
}
