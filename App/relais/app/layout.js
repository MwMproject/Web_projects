import "./globals.css";

export const metadata = {
  title: "Relais",
  description: "La secrétaire IA des petites entreprises : vos e-mails triés, résumés et prêts à répondre.",
  manifest: "/manifest.webmanifest",
};
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0f766e" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr-CH">
      <body>{children}</body>
    </html>
  );
}
