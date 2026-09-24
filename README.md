# RémiOS — portfolio BTS SIO SISR

Portfolio de **Rémi Moreau**, étudiant en BTS SIO option SISR à MyDigitalSchool Nantes (promo 2026-2028), en alternance chez 1Life (groupe Visiativ) comme consultant ERP Open-Prod.

Le site se présente comme le démarrage d'un système Linux : écran GRUB, journal du noyau, services systemd, puis un menu façon ncurses qui donne accès aux réalisations, au tableau de synthèse et à la veille technologique. Une **vue rapide jury**, sobre et imprimable, rassemble tout le contenu sur une seule page.

> Projet construit étape par étape : ce README est complété à chaque étape.

## Démarrer en local

Prérequis : **Node.js 22.12 ou plus récent** (version conseillée : 24 LTS, indiquée dans `.nvmrc`).

```bash
npm install      # installe les outils du projet (à faire une fois)
npm run dev      # lance le site en local, avec rechargement automatique à chaque modification
npm run build    # fabrique la version finale, 100 % statique, dans dist/
npm run preview  # sert le contenu de dist/ pour vérifier le build avant de le déployer
```

`npm run dev` affiche l'adresse à ouvrir dans le navigateur (par défaut http://localhost:5173).

## Organisation des fichiers

```
content/site.config.js  configuration du contenu : identité, contact, PDF, veille, compétences
content/pages/          présentation et veille (Markdown)
content/realisations/   une fiche Markdown par réalisation
index.html              page unique du site : meta, Open Graph, préchargement de la police
vite.config.js          configuration du build
plugins/                plugin Vite maison qui convertit le Markdown au build
public/                 fichiers copiés tels quels dans dist/ (favicon, captures, PDF)
src/main.js             point d'entrée du JavaScript : assemble les modules
src/router.js           routage par hash (#/presentation, #/realisations/nas…)
src/content.js          accès au contenu (configuration + fiches) pour le reste du code
src/blocks.js           blocs de contenu communs à RémiOS et à la vue jury
src/tui/                interface façon whiptail : boîte, menu, rubriques, fiches, visionneuse
src/boot/               séquence de démarrage : GRUB, journal du noyau, systemd, connexion
src/jury/               vue rapide jury, sobre et imprimable
src/terminal/           terminal caché : fenêtre, commandes, système de fichiers simulé
src/ui/                 barre fixe en haut à droite (vue jury)
src/utils/              petites fonctions partagées (HTML sûr, dates)
src/styles/index.css    point d'entrée des styles, importe les fichiers ci-dessous
src/styles/fonts.css    déclaration de la police auto-hébergée
src/styles/tokens.css   variables de design : toutes les couleurs et tailles du site
src/styles/base.css     styles communs (police, focus visible, réduction des animations)
src/assets/fonts/       IBM Plex Mono en woff2 (400 et 600) + licence OFL
reference/              maquette HTML validée au départ du projet (hors build)
```

## Modifier le contenu

Tout le contenu est dans `content/` : aucune ligne de code à toucher.

- **Informations générales** (contact, sujet de veille, compétences, PDF) : `content/site.config.js`, commenté ligne par ligne.
- **Ajouter une réalisation** : copier une fiche de `content/realisations/`, la renommer (minuscules, chiffres et tirets : `supervision-zabbix.md`), puis remplir le bloc d'en-tête :

  ```yaml
  titre: "Supervision du réseau avec Zabbix"
  slug: supervision-zabbix        # identique au nom du fichier
  type: entreprise                # entreprise, formation ou perso
  date: 2026-11                   # AAAA, AAAA-MM ou AAAA-MM-JJ
  statut: terminé
  resume: "Une phrase qui résume la réalisation."
  technos: [Zabbix, Debian]
  competences: [C1, C4]           # codes définis dans site.config.js
  ```
- **Captures d'écran** : déposer l'image dans `public/captures/<slug>/`, puis l'insérer dans la fiche avec `![Description](captures/<slug>/image.webp "Légende")`.
- Les textes `[À COMPLÉTER]` sont surlignés en jaune sur le site pour repérer ce qui reste à rédiger.

Si une fiche est mal remplie (type inconnu, slug différent du nom de fichier, image ou PDF introuvable, compétence inexistante…), `npm run dev` et `npm run build` affichent un message qui indique le fichier et la correction à faire.

## Choix techniques

- **Vite + JavaScript sans framework.** Le site n'a pas besoin de React ou Vue : quelques modules JavaScript suffisent, le code reste court et facile à expliquer, et le navigateur n'a presque rien à télécharger. Vite apporte le serveur de développement (rechargement instantané) et le build optimisé : fichiers minifiés et noms de fichiers « hashés » (`index-3f9a2c.js`), ce qui permet au serveur de demander aux navigateurs de les garder en cache très longtemps.
- **Chemins relatifs (`base: './'`).** Le site généré fonctionne à la racine d'un domaine comme dans un sous-dossier derrière un reverse proxy, sans reconfiguration.
- **Aucune dépendance au moment de l'exécution.** Les outils (Vite, et plus tard le lecteur de Markdown) ne servent qu'à fabriquer le site ; ils sont déclarés en `devDependencies` et ne sont pas envoyés aux visiteurs.
- **Contenu en Markdown, converti au build.** Chaque réalisation est un fichier texte lisible et modifiable sans connaître le code. Un plugin Vite maison (`plugins/vite-plugin-content.js`) lit le bloc d'en-tête avec `gray-matter`, convertit le texte en HTML avec `marked` et vérifie les champs. Ces deux bibliothèques ne tournent qu'au build : le visiteur reçoit du HTML déjà prêt.
- **Routage par hash.** Tout le site tient dans `index.html` ; la partie après `#` indique l'écran à afficher (`#/veille`, `#/realisations/nas`). Chaque écran a une URL partageable, les boutons Précédent/Suivant fonctionnent, et le serveur n'a besoin d'aucune règle de réécriture.
- **Un contenu, deux habillages.** Les rubriques sont produites par `src/blocks.js` ; l'interface RémiOS et la vue jury l'habillent différemment. Le tableau croisé réalisations × compétences est généré à partir des fiches : il est toujours à jour.
- **Accessibilité du menu.** Les rubriques sont de vrais liens `<a>` et les actions de vrais `<button>` : souris, tactile, clavier et lecteurs d'écran fonctionnent sans code spécial. À l'ouverture d'une boîte, le focus passe sur son titre et une zone `aria-live` annonce la rubrique ouverte.
- **Boot en calque, par-dessus le menu.** Le menu est affiché dès le chargement ; le boot est un calque noir posé dessus pendant 5 secondes au maximum. « Passer » (bouton, n'importe quelle touche, clic ou toucher) retire simplement le calque. Le navigateur, les lecteurs d'écran et Lighthouse voient le contenu principal tout de suite. Pendant le boot, le menu est rendu « inerte » (attribut `inert`) pour que la touche Tab ne s'y perde pas.
- **Boot fluide à 60 images/s.** Une seule boucle `requestAnimationFrame` affiche par paquets les lignes dont l'heure est venue ; le nombre de lignes dans la page est limité à la hauteur de l'écran ; le défilement est fait par le CSS (lignes calées en bas) ; le seul effet, le fondu final, n'anime que l'opacité.
- **Boot seulement à l'accueil.** Un lien direct (`#/jury`, `#/realisations/nas`) affiche la page sans attendre. Si le système demande de réduire les animations, il n'y a pas de boot du tout. Le service `veille-techno.service` passe de `[ WARN ]` à `[  OK  ]` dès qu'un sujet est renseigné dans `site.config.js`.
- **Terminal caché, entièrement simulé.** Touche `` ` `` (ou `²` sur un clavier AZERTY PC), `Ctrl+Alt+T`, ou le bouton `[tty2]` de la barre du haut (seul moyen sur mobile). Les fiches y sont des fichiers (`cat realisations/perso/nas.md`) : l'arborescence est construite en mémoire à partir du contenu du site. Aucune commande n'est exécutée et rien n'est envoyé à un serveur ; tout ce que tape le visiteur est affiché avec `textContent`, donc jamais interprété comme du HTML (pas d'injection possible). Commandes : `help`, `whoami`, `neofetch`, `ls`, `cd`, `pwd`, `cat`, `open`, `jury`, `history`, `clear`, `reboot`, `exit`… et quelques surprises.
- **Vue rapide jury.** Accessible en un clic depuis n'importe quel écran (bouton jaune en haut à droite, premier élément atteint avec Tab) ou directement par l'URL `#/jury`. Fond clair, police système, aucune animation, tout sur une page. La feuille `@media print` retire les boutons, écrit l'adresse des liens en clair et évite de couper un bloc en bas de page.
- **Visionneuse d'images native.** Les captures s'agrandissent dans un élément HTML `<dialog>` : le navigateur gère lui-même le piège du focus, la touche Échap et le retour du focus à la fermeture. Sans JavaScript, le lien ouvre simplement l'image.
- **Police auto-hébergée.** IBM Plex Mono est servie par le site lui-même, pas par Google Fonts : le site fonctionne sans accès extérieur (utile sur un réseau fermé ou en démonstration hors ligne) et aucune donnée de visite n'est transmise à un tiers. Seuls le sous-ensemble latin et deux graisses sont embarqués (≈ 30 ko au total). La police principale est préchargée pour que le boot s'affiche directement dans la bonne police.
- **Variables CSS (« tokens »).** Toutes les couleurs de la maquette sont définies une seule fois dans `tokens.css`. Les tailles de texte sont en `rem` : si le visiteur agrandit le texte dans son navigateur, le site suit (accessibilité).
- **Réduction des animations.** Si le système demande de réduire les animations (réglage d'accessibilité), les transitions CSS sont désactivées.

## Avancement

- [x] 1. Initialisation du projet (Vite, git, configuration de base)
- [x] 2. Police auto-hébergée et thème RémiOS
- [x] 3. Contenu en Markdown et fiches d'exemple
- [x] 4. Menu principal et navigation
- [x] 5. Fiches de réalisation et visionneuse d'images
- [x] 6. Vue rapide jury imprimable
- [x] 7. Séquence de démarrage
- [x] 8. Terminal caché
- [ ] 9. Sons de démarrage
- [ ] 10. Responsive, accessibilité, performance
- [ ] 11. Déploiement Docker + nginx
- [ ] 12. Documentation complète
