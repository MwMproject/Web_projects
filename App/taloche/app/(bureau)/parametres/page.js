import AConstruire from "@/components/AConstruire";

export default function Page() {
  return (
    <AConstruire
      titre="Paramètres"
      description="Informations de l'entreprise"
      points={["Nom, adresse, IDE (CHE-xxx.xxx.xxx), n° TVA", "IBAN / QR-IBAN, délai de paiement, tarifs horaires", "Logo pour les PDF", "Abonnement Taloche"]}
    />
  );
}
