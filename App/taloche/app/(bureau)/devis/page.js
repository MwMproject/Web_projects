import AConstruire from "@/components/AConstruire";

export default function Page() {
  return (
    <AConstruire
      titre="Devis"
      description="Créer, envoyer et suivre les devis"
      points={["Liste avec statut (brouillon, envoyé, accepté, refusé)", "Éditeur de lignes depuis la bibliothèque d'articles (reprendre FacturePro)", "PDF du devis", "Bouton « Accepté → créer le chantier » (rpc creer_chantier_depuis_devis)", "Bouton « Facturer le devis » (rpc facturer_devis)"]}
    />
  );
}
