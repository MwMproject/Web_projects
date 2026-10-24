import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

export default async function Accueil() {
  const { user, membre } = await getSession();
  if (!user) redirect("/connexion");
  redirect(membre ? "/boite" : "/bienvenue");
}
