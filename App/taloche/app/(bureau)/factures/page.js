import AConstruire from "@/components/AConstruire";

export default function Page() {
  return (
    <AConstruire
      titre="Factures"
      description="Factures QR, encaissements et retards"
      points={["Liste avec statut et échéance", "PDF avec section QR-facture (lib/qr-facture.js)", "Marquer payée, relances", "Vue facture_totaux pour HT / TVA / TTC"]}
    />
  );
}
