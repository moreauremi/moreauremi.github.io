# dashu v0.0.1 : maquette cliquable

Première idée concrète de dashu : l'interface seule, avec de **fausses données**. Aucun serveur, aucun vrai connecteur, rien n'est enregistré : recharger la page remet tout à zéro. C'est en gros la « démo » prévue sur la page d'accueil de dashu.dev.

Elle suit les trois documents de conception : le dossier de conception, le guide de style et les fonctionnalités de personnalisation.

## Lancer la maquette

Le code est découpé en modules JavaScript (`import` / `export`). Les navigateurs refusent de charger des modules depuis un fichier ouvert en double-clic (`file://`) : il faut un petit serveur web local.

```bash
cd dashu
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000. Sans Python : `npx serve dashu` depuis la racine du dépôt.

## Ce qu'on peut essayer

- **Quatre vues** dans la barre du haut : Générale, Perso, Équipe, Maison. Chacune a sa propre adresse (`#perso`, `#maison`…).
- **Seize widgets**, tout le catalogue de départ : agenda de la semaine, aujourd'hui, prochain événement, chiffre clé, graphique, tableau triable, JSON libre, appareils, thermostat, scènes, météo, flux RSS, liens, notes, tâches, statut de service.
- **En lecture** : cocher une tâche (elle l'est aussi dans les autres vues), allumer une lumière, régler le chauffage, lancer une scène, trier le tableau, écrire dans une note. L'agenda suit l'heure réelle.
- **Mode édition** (« Modifier ») :
  - glisser un widget pour le déplacer, les autres se poussent ;
  - tirer le coin bas-droit pour le redimensionner ; le contenu s'adapte (l'agenda passe de 5 à 3 jours) ;
  - un emplacement sans assez de place s'affiche en rouge avant qu'on lâche ;
  - menu ⋯ : configurer (titre, source, rafraîchissement), dupliquer, supprimer ;
  - annuler / rétablir avec les flèches ou Ctrl+Z / Ctrl+Maj+Z ; « Annuler » remet la vue comme en entrant ;
  - au clavier : Tab jusqu'à la poignée ⠿, flèches pour déplacer, Maj + flèches pour redimensionner.
- **Bibliothèque** (« + Widget ») : recherche, catégories, filtre « compatible avec mes connecteurs », puis choix de la source et de la taille avec un aperçu en direct. Changer de source change les données affichées.
- **Sécurité de la maison** : au-delà de 23 °C, ou pour la scène « Absent », dashu demande une confirmation.
- **Thème** clair, sombre ou automatique (menu RM). Le thème ne change que les jetons de couleur.
- **Téléphone** : sous 760 px, une seule colonne et la page défile.

## Ce qui n'est pas là

Comptes, équipes, connecteurs réels, serveur, base de données, recherche, mode kiosque, épinglage vers la vue générale, marketplace. Les boutons qui y mènent le disent (« arrive en v1.0 »).

## Organisation

```
dashu/
├── index.html          la page : barre du haut, grille, menus, panneaux
├── favicon.svg         le « d » blanc sur carré noir
├── css/dashu.css       tout le style, construit sur les jetons du guide
└── js/
    ├── main.js         point d'entrée : vues, affichage, messages
    ├── layout.js       calcul de la grille 12 × 6 (places libres, widgets poussés)
    ├── editor.js       mode édition : glisser-déposer, clavier, menu, historique
    ├── library.js      bibliothèque de widgets et aperçu
    ├── widgets.js      le catalogue : rendu et actions de chaque widget
    ├── demo-data.js    fausses données et dispositions de départ
    ├── icons.js        icônes au trait façon Lucide
    └── util.js         petits outils (dates, nombres, échappement)
```

## Choix faits pour cette maquette

- **JavaScript sans framework ni Gridstack.** Le but est de voir et de tester l'interface, pas de choisir la stack (question encore ouverte). Le code reste lisible sans outil de build ; il sera repris quand la stack sera tranchée.
- **Grille sans défilement.** Un widget qui ne peut pas aller quelque part est refusé plutôt que d'agrandir la page (`layout.js`, fonction `tryPlace`).
- **Listes qui raccourcissent.** Quand une liste est trop longue pour sa case, ses dernières lignes sont masquées en entier au lieu d'être coupées à moitié.
- **Texte toujours échappé.** Tout ce qui vient des données ou de l'utilisateur passe par `esc()` avant d'entrer dans la page : pas de code injecté.
- **Accessibilité.** Vrais boutons et liens, cibles de 40 px minimum (44 px pour la maison), catégories de l'agenda nommées en plus de leur couleur, annonces pour les lecteurs d'écran.
