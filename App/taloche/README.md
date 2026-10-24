# Taloche

Gestion bureau + chantier pour les PME du bâtiment en Suisse romande.
Une seule application web (PWA) : le **bureau** sur PC, les **ouvriers** sur téléphone.

> Devis → chantier → rapports du terrain (heures, matériel, photos) → stock du dépôt mis à jour
> automatiquement → rentabilité en temps réel → facture QR en un clic.

## Pile technique

| Élément | Choix | Pourquoi |
| --- | --- | --- |
| Application | Next.js 15 (App Router), JavaScript | Un seul code pour PC et mobile, déjà vu en formation |
| Base de données, comptes, fichiers | Supabase (PostgreSQL), région **Zurich** | Auth + RLS + stockage prêts à l'emploi, données en Suisse |
| Hébergement de l'app | Infomaniak Cloud Server managé (Node.js) | Suisse, build `standalone` |
| QR-facture | `swissqrbill` | Section paiement conforme aux normes suisses |

## Structure du projet

```
taloche/
├── app/
│   ├── (auth)/connexion/          Connexion
│   ├── (bureau)/                  Interface PC (patron + bureau) — menu latéral
│   │   ├── tableau-de-bord/       ✅ Rentabilité de chaque chantier + alertes de stock
│   │   ├── chantiers/             ✅ Liste des chantiers
│   │   ├── chantiers/[id]/        ✅ Fiche chantier + « Facturer en un clic »
│   │   ├── devis/ factures/ clients/ articles/ stock/ equipe/ parametres/
│   │   │                          🔲 Pages à construire (chaque page liste ce qu'elle doit faire)
│   │   └── layout.js              Menu + blocage des ouvriers
│   ├── terrain/                   Interface téléphone (ouvriers)
│   │   ├── page.js                ✅ Mes chantiers
│   │   └── rapport/[chantierId]/  ✅ Rapport du jour : heures, matériel + dépôt, remarques
│   ├── layout.js · page.js · globals.css
├── components/AConstruire.js      Page provisoire « à construire »
├── lib/
│   ├── supabase/client.js         Client navigateur
│   ├── supabase/server.js         Client serveur + getSession() (utilisateur, entreprise, rôle)
│   ├── qr-facture.js              Génération de la QR-facture (SVG)
│   └── format.js                  CHF et dates au format suisse
├── middleware.js                  Session + redirection des ouvriers hors des pages bureau
├── public/manifest.webmanifest    Installation sur l'écran d'accueil (PWA)
└── supabase/
    ├── migrations/…_schema.sql    ⭐ Schéma complet : tables, sécurité (RLS), triggers, vues, fonctions
    └── tests/scenario.sql         Scénario complet + tests de sécurité
```

## Le schéma en bref

| Domaine | Tables | Points clés |
| --- | --- | --- |
| Entreprise & équipe | `entreprises`, `membres`, `membre_couts` | Rôles patron / bureau / ouvrier ; coûts horaires invisibles aux ouvriers |
| Commercial | `clients`, `articles`, `devis`, `devis_lignes` | Numérotation auto `DEV-2026-001`, TVA 8.1 % par défaut |
| Chantier | `chantiers`, `chantier_membres`, `rapports`, `rapport_heures`, `rapport_materiel`, `photos` | Un ouvrier ne voit que ses chantiers et ses rapports ; rapport verrouillé une fois envoyé |
| Stock | `depots`, `stock_mouvements` | Le stock = somme des mouvements ; **sortie automatique** quand du matériel « origine dépôt » est saisi sur un rapport |
| Facturation | `factures`, `facture_lignes`, `compteurs` | `FAC-2026-001`, échéance auto, pas de double facturation |

**Vues** : `stock_niveaux`, `devis_totaux`, `facture_totaux`, `chantier_rentabilite` (devis vs coût réel), `articles_terrain` (catalogue sans prix pour les ouvriers).

**Fonctions « en un clic »** (appel `supabase.rpc(...)`) :
`creer_entreprise`, `creer_chantier_depuis_devis`, `facturer_devis`, `facturer_regie`.

## Démarrer en local

1. Installer [Docker Desktop](https://www.docker.com/products/docker-desktop/) et la [CLI Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started).
2. Dans ce dossier :
   ```bash
   npm install
   supabase init          # une seule fois (garde le dossier supabase/ existant)
   supabase start         # lance Postgres + Auth + Storage en local
   supabase db reset      # applique supabase/migrations/
   ```
3. Copier `.env.example` en `.env.local` avec l'URL et la clé `anon` affichées par `supabase start`.
4. `npm run dev` puis ouvrir http://localhost:3000.
5. Pour tester le scénario complet sur la base locale :
   `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/scenario.sql`

## Mise en ligne

1. Créer le projet sur supabase.com, **région Central EU (Zurich)**, plan Pro.
2. `supabase link` puis `supabase db push` pour appliquer le schéma.
3. Dans Supabase : activer la double authentification, signer le DPA (contrat de sous-traitance).
4. Sur le serveur Infomaniak : `npm ci && npm run build`, puis lancer `node .next/standalone/server.js`
   (copier aussi `.next/static` et `public/` à côté, voir la doc Next.js « standalone »).

## Prochaines étapes (ordre conseillé)

1. Page **Articles** (reprendre la bibliothèque de prestations de FacturePro) + import CSV.
2. Page **Devis** (éditeur de lignes de FacturePro) + PDF.
3. Page **Équipe** : invitation des ouvriers et assignation aux chantiers.
4. Page **Factures** avec PDF + QR-facture (`lib/qr-facture.js`).
5. **Photos** et **signature du client** sur le rapport (Supabase Storage).
6. Mode hors ligne sur le téléphone (rapports mis en file d'attente sans réseau).

## Testé

- `supabase/tests/scenario.sql` passe sur PostgreSQL 16 : devis 3 480 CHF HT → chantier → 8 h de régie + 1 palette
  sortie du dépôt (stock 4 → 3) → rentabilité (coût 750 CHF, 21.6 % du budget) → facture régie 1 140 CHF HT / 1 232.34 TTC.
- Sécurité vérifiée : un ouvrier ne voit ni clients, ni devis, ni prix ; ne peut ni déclarer des heures pour un collègue,
  ni toucher au stock, ni facturer, ni modifier un rapport envoyé ; une autre entreprise ne voit rien.
- `next build` passe.
