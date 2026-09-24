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
index.html              page unique du site : meta, Open Graph, préchargement de la police
vite.config.js          configuration du build
public/                 fichiers copiés tels quels dans dist/ (favicon.svg…)
src/main.js             point d'entrée du JavaScript
src/styles/index.css    point d'entrée des styles, importe les fichiers ci-dessous
src/styles/fonts.css    déclaration de la police auto-hébergée
src/styles/tokens.css   variables de design : toutes les couleurs et tailles du site
src/styles/base.css     styles communs (police, focus visible, réduction des animations)
src/assets/fonts/       IBM Plex Mono en woff2 (400 et 600) + licence OFL
reference/              maquette HTML validée au départ du projet (hors build)
```

## Choix techniques

- **Vite + JavaScript sans framework.** Le site n'a pas besoin de React ou Vue : quelques modules JavaScript suffisent, le code reste court et facile à expliquer, et le navigateur n'a presque rien à télécharger. Vite apporte le serveur de développement (rechargement instantané) et le build optimisé : fichiers minifiés et noms de fichiers « hashés » (`index-3f9a2c.js`), ce qui permet au serveur de demander aux navigateurs de les garder en cache très longtemps.
- **Chemins relatifs (`base: './'`).** Le site généré fonctionne à la racine d'un domaine comme dans un sous-dossier derrière un reverse proxy, sans reconfiguration.
- **Aucune dépendance au moment de l'exécution.** Les outils (Vite, et plus tard le lecteur de Markdown) ne servent qu'à fabriquer le site ; ils sont déclarés en `devDependencies` et ne sont pas envoyés aux visiteurs.
- **Police auto-hébergée.** IBM Plex Mono est servie par le site lui-même, pas par Google Fonts : le site fonctionne sans accès extérieur (utile sur un réseau fermé ou en démonstration hors ligne) et aucune donnée de visite n'est transmise à un tiers. Seuls le sous-ensemble latin et deux graisses sont embarqués (≈ 30 ko au total). La police principale est préchargée pour que le boot s'affiche directement dans la bonne police.
- **Variables CSS (« tokens »).** Toutes les couleurs de la maquette sont définies une seule fois dans `tokens.css`. Les tailles de texte sont en `rem` : si le visiteur agrandit le texte dans son navigateur, le site suit (accessibilité).
- **Réduction des animations.** Si le système demande de réduire les animations (réglage d'accessibilité), les transitions CSS sont désactivées.

## Avancement

- [x] 1. Initialisation du projet (Vite, git, configuration de base)
- [x] 2. Police auto-hébergée et thème RémiOS
- [ ] 3. Contenu en Markdown et fiches d'exemple
- [ ] 4. Menu principal et navigation
- [ ] 5. Fiches de réalisation et visionneuse d'images
- [ ] 6. Vue rapide jury imprimable
- [ ] 7. Séquence de démarrage
- [ ] 8. Terminal caché
- [ ] 9. Sons de démarrage
- [ ] 10. Responsive, accessibilité, performance
- [ ] 11. Déploiement Docker + nginx
- [ ] 12. Documentation complète
