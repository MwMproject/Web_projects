# Relais

**La secrétaire IA des petites entreprises.** Relais lit les e-mails reçus, les trie, les résume,
repère ce qu'il manque pour avancer et prépare une réponse. Le patron valide en un clic,
et un récapitulatif part chaque soir.

> Rien ne part sans validation humaine. L'IA propose, le patron décide.

## Ce que fait la version actuelle

| Fonction | État |
| --- | --- |
| Boîtes IMAP (Infomaniak, Bluewin, Hostpoint, Gmail par mot de passe d'application, autres) | ✅ testé sur serveur local |
| Gmail / Google Workspace (OAuth, API Gmail) | ✅ codé — à tester avec de vrais identifiants Google |
| Outlook / Microsoft 365 (OAuth, Microsoft Graph) | ✅ codé — à tester avec de vrais identifiants Microsoft |
| Tri IA : catégorie, urgence, résumé, coordonnées, infos manquantes | ✅ |
| Brouillon de réponse dans le ton de l'entreprise, avec sa signature | ✅ |
| Newsletters et notifications classées sans payer d'IA | ✅ |
| Envoi de la réponse dans le même fil, depuis la même adresse (+ copie dans « Envoyés ») | ✅ testé sur serveur SMTP local |
| Récapitulatif du soir par e-mail, à l'heure choisie | ✅ |
| Plafond de coût IA par entreprise et par mois | ✅ |
| Sécurité multi-entreprise (RLS), secrets chiffrés, journal d'audit | ✅ testé sur PostgreSQL |

## Pile technique

Next.js 15 (JavaScript) · Supabase (PostgreSQL, comptes) région **Zurich** · Claude Haiku (Anthropic)
· `imapflow` / `nodemailer` / `mailparser` · hébergement de l'app sur Infomaniak (Node.js).

## Structure

```
relais/
├── app/
│   ├── connexion/ · bienvenue/            Inscription, création de l'entreprise
│   ├── (app)/boite/                       ⭐ Boîte du jour (urgents, devis, rendez-vous…)
│   ├── (app)/boite/[id]/                  E-mail + analyse + brouillon à valider/envoyer
│   ├── (app)/reglages/assistant/          Fiche de l'entreprise (services, zone, ton, consignes, signature, récap)
│   ├── (app)/reglages/boites/             Connexion des boîtes (IMAP, Gmail, Outlook)
│   ├── (app)/actions.js                   Actions des boutons (serveur)
│   └── api/
│       ├── taches/synchro/                Tâche planifiée : lire + analyser (toutes les 5 min)
│       ├── taches/recap/                  Tâche planifiée : récap du soir (toutes les heures)
│       └── oauth/[gmail|microsoft]/       Connexion Google / Microsoft
├── lib/
│   ├── pipeline.js                        ⭐ synchroniser → analyser → envoyer
│   ├── ia/analyser.js                     Prompt, sortie structurée, garde-fous, coût
│   ├── mail/imap.js · gmail.js · microsoft.js · oauth.js
│   ├── mail/normaliser.js · composer.js   Lecture MIME (citations, robots) / réponse dans le fil
│   ├── crypto.js                          AES-256-GCM pour les secrets, jetons signés
│   └── recap.js                           Récapitulatif du soir
├── supabase/migrations/…_relais.sql       ⭐ Schéma + RLS + garde-fous
├── supabase/tests/securite.sql            Tests de sécurité du schéma
└── tests/                                 Tests unitaires (`npm test`)
```

## Démarrer en local

1. `npm install`
2. Créer un projet Supabase (ou `supabase start` en local) et appliquer
   `supabase/migrations/20261015000100_relais.sql` (`supabase db push` ou éditeur SQL).
3. Copier `.env.example` en `.env.local`, remplir Supabase + `ANTHROPIC_API_KEY`,
   générer `RELAIS_CLE_CHIFFREMENT` et `RELAIS_SECRET_TACHES` avec `npm run cle:generer`.
4. `npm run dev` → http://localhost:3000, créer un compte, remplir « Mon assistante »,
   connecter une boîte Infomaniak de test.
5. Lancer une lecture : bouton « Vérifier les nouveaux e-mails », ou
   `curl -X POST -H "Authorization: Bearer <RELAIS_SECRET_TACHES>" http://localhost:3000/api/taches/synchro`

Tests : `npm test` (unitaires) et `psql … -f supabase/tests/securite.sql` (sur une base de test).

## Mise en production

- **Tâches planifiées** (cron du serveur Infomaniak, ou tout service de cron) :
  - toutes les 5 minutes : `POST /api/taches/synchro`
  - toutes les heures : `POST /api/taches/recap`
  - avec l'en-tête `Authorization: Bearer <RELAIS_SECRET_TACHES>`
- **Gmail** : les portées de lecture/envoi sont « restreintes » chez Google. En mode test,
  jusqu'à 100 utilisateurs ajoutés à la main fonctionnent tout de suite (parfait pour les pilotes),
  mais l'autorisation expire au bout de 7 jours : il faut alors cliquer sur « Reconnecter ».
  Pour une ouverture publique, Google exige une vérification de l'application, qui peut inclure
  une évaluation de sécurité externe payante et prend plusieurs semaines. En attendant :
  Gmail via **mot de passe d'application** (IMAP), déjà pris en charge.
- **Microsoft** : inscription de l'application dans Azure (gratuite). Certaines entreprises
  Microsoft 365 exigent que leur administrateur approuve l'application.
- **Protection des données (nLPD)** : les e-mails contiennent des données personnelles.
  À prévoir avant le premier client payant : politique de confidentialité, contrat de
  sous-traitance avec chaque client, liste des sous-traitants (Supabase – Zurich, Anthropic – États-Unis,
  Infomaniak – Suisse). Le texte des e-mails est envoyé à Anthropic pour l'analyse : à dire clairement.

## Garde-fous de sécurité

- Mots de passe et jetons des boîtes chiffrés (AES-256-GCM) avec une clé hors base ; table des
  secrets sans aucun accès utilisateur.
- Chaque entreprise ne voit que ses données (RLS testée) ; un membre ne peut ni marquer un e-mail
  « envoyé » sans l'envoyer, ni modifier un e-mail reçu, ni détourner les serveurs d'une boîte.
- Le contenu des e-mails est traité comme une donnée, jamais comme une instruction (anti-injection).
- Envoi protégé contre le double clic ; journal de chaque envoi.
- Plafond de coût IA mensuel par entreprise.

## Prochaines étapes

1. Tester avec une vraie boîte Infomaniak et une clé Anthropic.
2. Créer les identifiants Google et Microsoft, tester avec 2–3 entreprises pilotes.
3. Page « Mes clients » : historique des échanges par expéditeur.
4. Abonnement (Stripe) et page de présentation.
5. Option : réponse automatique d'accusé de réception (désactivée par défaut).
