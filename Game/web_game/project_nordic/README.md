# Village Viking

Prototype de jeu de gestion de village viking.

Tu développes un petit clan nordique : construire le village, produire des ressources, accueillir des habitants, préparer des expéditions et gérer les relations avec les autres clans.

Au lancement, tu choisis le lieu où ton clan fonde son village. Ce choix change la carte locale, les ressources de départ et la première route d'expédition.

## Lancer le jeu

Dans le dossier du projet :

```bash
npm.cmd run serve
```

Puis ouvrir l'adresse affichée dans le terminal, par exemple :

```text
http://127.0.0.1:5173
```

## Contrôles

- Déplacer la caméra : `WASD` ou flèches.
- Zoom : molette, `+` ou `-`.
- Glisser la carte : souris ou tactile.
- Construire : choisir un bâtiment, puis cliquer sur l'herbe ou une case constructible.

## Lieux de départ

Tu peux choisir entre plusieurs régions :

- Fjord de Bergen : bon départ côtier pour les expéditions.
- Forêt de Svealand : beaucoup de bois.
- Montagnes de Norvège : beaucoup de pierre et un peu de fer.
- Côtes du Danemark : bonne nourriture et commerce.
- Île d'Islande : plus de foi, terrain plus isolé.

La carte du village est plus grande qu'avant, avec de la place pour étendre le clan.

## Ressources

Le village utilise :

- Bois
- Pierre
- Nourriture
- Fer
- Foi

## Bâtiments

- Maison longue : augmente la population maximale et attire de nouveaux villageois.
- Scierie : produit du bois.
- Carrière : produit de la pierre.
- Forge : produit du fer.
- Port : débloque les expéditions.
- Temple : produit de la foi.
- Champ : produit de la nourriture.
- Chemin : permet de dessiner les routes du village.
- Palissade : première protection pour les futures attaques.

## Population

Le village commence avec quelques habitants.

Construire des maisons longues augmente la capacité de population. Si le village a assez de nourriture, de nouveaux habitants arrivent progressivement.

## Métiers

Les villageois peuvent recevoir un métier :

- Libre : se promène.
- Paysan : produit de la nourriture, surtout avec des champs.
- Bûcheron : produit du bois.
- Mineur : produit pierre et un peu de fer.
- Forgeron : produit du fer si une forge existe.
- Guerrier : prépare la défense du village.
- Navigateur : réduit le risque des expéditions.

## Expéditions

Après avoir construit un port, tu peux envoyer un équipage sur la carte du monde.

Types d'expédition :

- Explorer : équilibré, utile pour découvrir et ramener des ressources.
- Commerce : plus sûr, améliore les relations.
- Raid : plus dangereux, rapporte davantage, mais dégrade les relations.

Les destinations ont chacune :

- une distance
- un risque
- des récompenses
- un clan associé

## Carte du monde

La carte du monde représente les régions nordiques et les routes d'expédition.

Destinations actuelles :

- Bergen
- Uppsala
- Hedeby
- York
- Dublin
- Reykjavik
- Gotland
- Novgorod

## Idées pour la suite

- Former des guerriers et des navigateurs.
- Ajouter des vagues ennemies tous les 10 jours.
- Créer des alliances avec d'autres clans.
- Envoyer des expéditions vers des lieux précis.
- Ajouter une sauvegarde de partie.
