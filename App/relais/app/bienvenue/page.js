import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import FormulaireBienvenue from "./FormulaireBienvenue";

export default async function Bienvenue() {
  const { user, membre } = await getSession();
  if (!user) redirect("/connexion");
  if (membre) redirect("/boite");
  return (
    <main className="page" style={{ maxWidth: 520, paddingTop: 56 }}>
      <h1>Bienvenue sur Relais</h1>
      <p className="sous-titre">Trois minutes de configuration, puis votre assistante s'occupe du tri.</p>
      <FormulaireBienvenue />
    </main>
  );
}
