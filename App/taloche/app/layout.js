import "./globals.css";

export const metadata = {
  title: "Taloche",
  description: "Devis, chantiers, stock et factures QR pour les PME du bâtiment",
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c2410c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr-CH">
      <body>{children}</body>
    </html>
  );
}
