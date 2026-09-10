# Site L'Hibou Étoilé

Site vitrine bilingue en HTML, CSS et JavaScript, sans framework.

## Structure du dossier

```text
hibou-etoile/
├── index.html          Page d'accueil
├── contact.html        Page de contact
├── .htaccess           Conservation des anciennes URL sur Apache
├── sitemap.xml         Liste des pages pour les moteurs de recherche
├── robots.txt          Indications données aux moteurs de recherche
├── README.md           Ce guide
└── assets/
    ├── style.css       Apparence du site
    ├── main.js         Interactions et animations
    ├── i18n.js         Textes français et anglais
    └── img/            Logo, drapeaux et photos
```

## À quoi servent les fichiers ?

### HTML

`index.html` et `contact.html` contiennent la structure et le contenu des deux pages.

Pour modifier un titre, un lien, une adresse ou une image, il faut généralement commencer par ces fichiers.

### CSS

`assets/style.css` gère tout l'aspect visuel :

- les couleurs et les polices ;
- les tailles et les espacements ;
- la disposition des sections ;
- l'affichage sur ordinateur, tablette et téléphone ;
- le menu, les boutons et les effets visuels.

Les couleurs principales se trouvent au début du fichier dans le bloc `:root`.

### JavaScript

`assets/main.js` gère les interactions et les animations : menu mobile, navigation, sélecteur de langue et formulaire de contact.

`assets/i18n.js` contient les textes français et anglais. Pour modifier un texte traduit, il faut changer sa version dans les deux langues.

### Images

Les images se trouvent dans `assets/img/`. Pour remplacer une photo simplement, conserver le même nom de fichier.

## Le fichier .htaccess

Ce fichier est utile si le site est hébergé sur un serveur Apache. Il permet de conserver les URL actuelles :

- `/contact`
- `/en`
- `/en/contact`

Sur un autre type d'hébergement, ces règles devront être configurées directement chez l'hébergeur.

## Référencement

`sitemap.xml` indique à Google les pages françaises et anglaises du site. `robots.txt` autorise leur indexation et indique où trouver le sitemap.

## Voir le site en local

Dans un terminal ouvert dans le dossier du site :

```powershell
python -m http.server 3000
```

Puis ouvrir `http://127.0.0.1:3000/` dans un navigateur.

Les modifications réalisées dans l'inspecteur du navigateur sont temporaires. Il faut toujours les reporter dans les vrais fichiers du site.
