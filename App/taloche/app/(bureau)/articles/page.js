import AConstruire from "@/components/AConstruire";

export default function Page() {
  return (
    <AConstruire
      titre="Articles & prestations"
      description="Bibliothèque de prix (prestations, matériel, main-d'œuvre)"
      points={["Reprendre la bibliothèque de prestations de FacturePro", "Prix de vente, prix d'achat, fournisseur, référence", "Case « stockable » pour le suivi au dépôt", "Import CSV depuis Excel"]}
    />
  );
}
