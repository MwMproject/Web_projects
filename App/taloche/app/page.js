// Page d'accueil : envoie chacun au bon endroit selon son rôle.
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

export default async function Accueil() {
  const { user, membre } = await getSession();
  if (!user) redirect("/connexion");
  if (!membre) redirect("/connexion?erreur=aucune-entreprise");
  redirect(membre.role === "ouvrier" ? "/terrain" : "/tableau-de-bord");
}
