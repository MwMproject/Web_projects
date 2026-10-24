// Génération de la QR-facture suisse (section paiement) en SVG.
// Librairie : swissqrbill (https://github.com/schoero/swissqrbill)
import { SwissQRBill } from "swissqrbill/svg";

/**
 * @param {object} entreprise  ligne de la table entreprises
 * @param {object} client      ligne de la table clients
 * @param {object} facture     { numero, total_ttc, qr_reference? }
 * @returns {string} SVG de la section paiement, à placer en bas de la facture PDF
 */
export function qrFactureSvg(entreprise, client, facture) {
  const data = {
    currency: "CHF",
    amount: Number(facture.total_ttc),
    creditor: {
      account: entreprise.iban.replace(/\s/g, ""),
      name: entreprise.nom,
      address: entreprise.adresse,
      zip: entreprise.npa,
      city: entreprise.localite,
      country: entreprise.pays || "CH",
    },
    debtor: {
      name: client.raison_sociale || `${client.prenom ?? ""} ${client.nom ?? ""}`.trim(),
      address: client.adresse,
      zip: client.npa,
      city: client.localite,
      country: client.pays || "CH",
    },
    // Référence QR obligatoire avec un QR-IBAN ; sinon un simple message suffit.
    ...(facture.qr_reference ? { reference: facture.qr_reference } : {}),
    message: `Facture ${facture.numero}`,
  };
  return new SwissQRBill(data, { language: "FR" }).toString();
}
