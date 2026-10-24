import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

export default async function AppLayout({ children }) {
  const { user, membre } = await getSession();
  if (!user) redirect("/connexion");
  if (!membre) redirect("/bienvenue");
  return (
    <>
      <header className="entete">
        <Link href="/boite" className="logo">Re<span>lais</span></Link>
        <nav>
          <Link href="/boite">Boîte du jour</Link>
          <Link href="/reglages/assistant">Mon assistante</Link>
          <Link href="/reglages/boites">Boîtes mail</Link>
        </nav>
        <span className="discret">{membre.entreprises?.nom}</span>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
