import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

const MENU = [
  ["/tableau-de-bord", "Tableau de bord"],
  ["/chantiers", "Chantiers"],
  ["/devis", "Devis"],
  ["/factures", "Factures"],
  ["/clients", "Clients"],
  ["/articles", "Articles & prestations"],
  ["/stock", "Stock & dépôts"],
  ["/equipe", "Équipe"],
  ["/parametres", "Paramètres"],
];

export default async function BureauLayout({ children }) {
  const { membre } = await getSession();
  if (!membre) redirect("/connexion");
  if (membre.role === "ouvrier") redirect("/terrain");

  return (
    <div className="bureau">
      <nav className="nav">
        <div className="logo">Ta<span>loche</span></div>
        {MENU.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <main className="contenu">{children}</main>
    </div>
  );
}
