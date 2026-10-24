export const CATEGORIES = {
  demande_devis: "Demande de devis",
  rendez_vous: "Rendez-vous",
  question_client: "Question client",
  reclamation: "Réclamation",
  facture_fournisseur: "Facture fournisseur",
  administratif: "Administratif",
  publicite: "Publicité / notification",
  autre: "Autre",
};

// Ordre d'affichage des sections de la boîte du jour
export const ORDRE_SECTIONS = ["demande_devis", "reclamation", "rendez_vous", "question_client", "facture_fournisseur", "administratif", "autre"];

export const INFOS = {
  nom: "Nom", telephone: "Téléphone", email: "E-mail", adresse: "Adresse",
  travaux: "Travaux", delai_souhaite: "Délai souhaité", budget: "Budget",
};

export const dateCourte = (d) =>
  new Intl.DateTimeFormat("fr-CH", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zurich" }).format(new Date(d));
