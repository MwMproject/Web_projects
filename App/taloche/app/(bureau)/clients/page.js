import AConstruire from "@/components/AConstruire";

export default function Page() {
  return (
    <AConstruire
      titre="Clients"
      description="Carnet d'adresses"
      points={["Liste, recherche, fiche client", "Historique des devis, chantiers et factures du client"]}
    />
  );
}
