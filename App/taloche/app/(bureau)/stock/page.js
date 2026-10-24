import AConstruire from "@/components/AConstruire";

export default function Page() {
  return (
    <AConstruire
      titre="Stock & dépôts"
      description="Ce qu'il reste dans chaque dépôt"
      points={["Vue stock_niveaux par dépôt", "Entrée de marchandise (livraison fournisseur)", "Inventaire / ajustement", "Historique des mouvements avec le chantier d'origine"]}
    />
  );
}
