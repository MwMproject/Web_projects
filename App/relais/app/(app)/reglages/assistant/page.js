import { getSession } from "@/lib/supabase/server";
import FormulaireFiche from "./FormulaireFiche";

export default async function Assistant({ searchParams }) {
  const { bienvenue } = await searchParams;
  const { supabase, membre } = await getSession();
  const mois = `${new Date().toISOString().slice(0, 7)}-01`;   // mois en cours (UTC, comme la base)
  const [{ data: e }, { data: usage }] = await Promise.all([
    supabase.from("entreprises").select("*").eq("id", membre.entreprise_id).single(),
    supabase.from("usage_ia").select("appels, cout_microchf").eq("entreprise_id", membre.entreprise_id)
      .eq("mois", mois).maybeSingle(),
  ]);
  const consomme = (usage?.cout_microchf || 0) / 1_000_000;
  const plafond = e.plafond_ia_centimes / 100;

  return (
    <>
      <h1>Mon assistante</h1>
      <p className="sous-titre">Ce qu'elle doit savoir sur votre entreprise pour bien répondre à votre place.</p>
      {bienvenue && (
        <p className="message-ok">Entreprise créée. Remplissez cette fiche (2 minutes), puis connectez votre boîte mail dans « Boîtes mail ».</p>
      )}
      <FormulaireFiche e={e} admin={membre.role === "admin"} />
      <h2>Consommation de ce mois</h2>
      <div className="carte">
        {usage?.appels || 0} e-mail(s) analysé(s) · {consomme.toFixed(2)} CHF sur un plafond de {plafond.toFixed(2)} CHF.
        <p className="discret">Au-delà du plafond, les nouveaux e-mails restent visibles mais ne sont plus analysés jusqu'au mois suivant.</p>
      </div>
    </>
  );
}
