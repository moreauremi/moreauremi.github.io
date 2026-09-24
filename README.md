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
public/                 fichiers copiés tels quels dans dist/ : icônes, image d'aperçu,
                        robots.txt, captures, PDF
src/main.js             point d'entrée du JavaScript : assemble les modules
src/router.js           routage par hash (#/presentation, #/realisations/nas…)
src/content.js          accès au contenu (configuration + fiches) pour le reste du code
src/blocks.js           blocs de contenu communs à RémiOS et à la vue jury
src/tui/                interface façon whiptail : boîte, menu, rubriques, fiches, visionneuse
src/boot/               séquence de démarrage : GRUB, journal du noyau, systemd, connexion
src/jury/               vue rapide jury, sobre et imprimable
src/terminal/           terminal caché : fenêtre, commandes, système de fichiers simulé
src/audio/              sons générés avec la Web Audio API
src/ui/                 barre fixe en haut à droite (vue jury, bouton son)
src/utils/              petites fonctions partagées (HTML sûr, dates, clavier, réglages mémorisés)
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

## Déployer sur le homelab (Docker + nginx)

### Principe

```
Navigateur ──► reverse proxy nginx du homelab ──► conteneur « remios-portfolio »
                (HTTPS, nom de domaine)              nginx:alpine + le dossier dist/
                                                     port 80 du conteneur = port 8080 de la machine
```

Le `Dockerfile` construit l'image en deux étapes (*multi-stage*) : une image Node fabrique le site, puis seule le dossier `dist/` est copié dans une image `nginx:alpine`. L'image finale ne contient ni Node, ni le code source : elle est légère et expose le minimum.

Fichiers concernés :

| Fichier | Rôle |
|---|---|
| `Dockerfile` | construction de l'image (build Node → service nginx) |
| `docker/nginx.conf` | service du site : gzip, cache d'un an sur les fichiers hashés, `index.html` jamais en cache, 404 pour les adresses inconnues |
| `docker/security-headers.conf` | en-têtes de sécurité (CSP stricte, anti-clickjacking, nosniff…) |
| `docker-compose.yml` | lancement : port 8080, redémarrage automatique, conteneur en lecture seule, pas d'élévation de privilèges |
| `.dockerignore` | fichiers non envoyés à Docker (node_modules, dist, .git…) |

### Étape 1 : copier le projet sur le serveur

Prérequis sur le serveur : Docker et son plugin compose (`docker compose version` doit répondre).

Depuis le Mac, dans le dossier du projet (remplacer `remi@homelab` par l'utilisateur et l'adresse du serveur) :

```bash
rsync -av --exclude node_modules --exclude dist ./ remi@homelab:~/remios-portfolio/
```

L'image est construite sur le serveur lui-même : peu importe que ce soit un PC (amd64) ou un Raspberry Pi (arm64), les images `node:24-alpine` et `nginx:alpine` existent pour les deux.

### Étape 2 : construire et lancer le conteneur

```bash
ssh remi@homelab
cd ~/remios-portfolio
docker compose up -d --build
```

### Étape 3 : vérifier

```bash
docker ps                          # STATUS doit passer à « (healthy) » au bout de 30 s
curl -I http://localhost:8080/     # HTTP/1.1 200 OK + en-têtes de sécurité
docker compose logs -f             # journaux de nginx (Ctrl+C pour quitter)
```

Depuis un autre poste du réseau local : `http://<adresse-IP-du-homelab>:8080`.

Pour vérifier la compression : `curl -sI -H "Accept-Encoding: gzip" http://localhost:8080/ | grep -i content-encoding` doit afficher `gzip`.

### Étape 4 : brancher le reverse proxy nginx

**Sans nom de domaine** (situation actuelle) : publier le site dans un sous-dossier de l'adresse du homelab, par exemple `http://192.168.1.10/portfolio/`. Dans le bloc `server` existant du reverse proxy :

```nginx
# « /portfolio » sans barre finale → redirection vers « /portfolio/ »
location = /portfolio {
    return 301 /portfolio/;
}

location /portfolio/ {
    # Le « / » final retire « /portfolio/ » avant de transmettre au conteneur
    proxy_pass http://127.0.0.1:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Ça fonctionne sans rien changer au site grâce aux chemins relatifs (`base: './'`). Recharger ensuite nginx : `sudo nginx -t && sudo systemctl reload nginx`.

**Avec un nom de domaine** (plus tard) :

```nginx
server {
    listen 80;
    server_name portfolio.exemple.fr;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name portfolio.exemple.fr;

    ssl_certificate     /etc/letsencrypt/live/portfolio.exemple.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portfolio.exemple.fr/privkey.pem;

    # HTTPS obligatoire pendant un an (à mettre ici : c'est le proxy qui gère le HTTPS)
    add_header Strict-Transport-Security "max-age=31536000" always;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Puis renseigner `urlPublique: 'https://portfolio.exemple.fr/'` dans `content/site.config.js` et reconstruire (étape 5) : les aperçus de lien (image, adresse) seront alors complets.

**Si le reverse proxy tourne lui-même dans un conteneur**, `127.0.0.1` désigne ce conteneur et non la machine. Il faut mettre les deux conteneurs sur un même réseau Docker :

```bash
docker network create proxy        # une seule fois (inutile s'il existe déjà)
```

Ajouter à la fin de `docker-compose.yml` :

```yaml
networks:
  default:
    name: proxy
    external: true
```

Brancher aussi le conteneur du reverse proxy sur ce réseau, puis utiliser `proxy_pass http://remios-portfolio:80;` (le nom du conteneur sert d'adresse). La ligne `ports:` devient alors facultative.

### Étape 5 : mettre à jour le site

Après une modification (nouvelle fiche, captures…), depuis le Mac :

```bash
rsync -av --exclude node_modules --exclude dist ./ remi@homelab:~/remios-portfolio/
ssh remi@homelab "cd ~/remios-portfolio && docker compose up -d --build && docker image prune -f"
```

`docker image prune -f` supprime les anciennes versions de l'image.

### Dépannage

- **Le port 8080 est déjà pris** : `PORTFOLIO_PORT=8090 docker compose up -d` (et adapter `proxy_pass`).
- **Le build échoue** : lire le message, il indique souvent une fiche mal remplie ; le corriger et relancer. Le même message apparaît en local avec `npm run build`.
- **Le conteneur redémarre en boucle** : `docker compose logs`. Si nginx se plaint d'un système de fichiers en lecture seule, mettre en commentaire les lignes `read_only`, `tmpfs` et leurs dossiers dans `docker-compose.yml`, puis relancer.
- **Seul le reverse proxy doit accéder au conteneur** : remplacer la ligne de port par `"127.0.0.1:${PORTFOLIO_PORT:-8080}:80"` (le site n'est plus joignable directement depuis le réseau).

## Choix techniques

- **Vite + JavaScript sans framework.** Le site n'a pas besoin de React ou Vue : quelques modules JavaScript suffisent, le code reste court et facile à expliquer, et le navigateur n'a presque rien à télécharger. Vite apporte le serveur de développement (rechargement instantané) et le build optimisé : fichiers minifiés et noms de fichiers « hashés » (`index-3f9a2c.js`), ce qui permet au serveur de demander aux navigateurs de les garder en cache très longtemps.
- **Chemins relatifs (`base: './'`).** Le site généré fonctionne à la racine d'un domaine comme dans un sous-dossier derrière un reverse proxy, sans reconfiguration.
- **Aucune dépendance au moment de l'exécution.** Les outils (Vite, et plus tard le lecteur de Markdown) ne servent qu'à fabriquer le site ; ils sont déclarés en `devDependencies` et ne sont pas envoyés aux visiteurs.
- **Contenu en Markdown, converti au build.** Chaque réalisation est un fichier texte lisible et modifiable sans connaître le code. Un plugin Vite maison (`plugins/vite-plugin-content.js`) lit le bloc d'en-tête avec `gray-matter`, convertit le texte en HTML avec `marked` et vérifie les champs. Ces deux bibliothèques ne tournent qu'au build : le visiteur reçoit du HTML déjà prêt.
- **Routage par hash.** Tout le site tient dans `index.html` ; la partie après `#` indique l'écran à afficher (`#/veille`, `#/realisations/nas`). Chaque écran a une URL partageable, les boutons Précédent/Suivant fonctionnent, et le serveur n'a besoin d'aucune règle de réécriture.
- **Un contenu, deux habillages.** Les rubriques sont produites par `src/blocks.js` ; l'interface RémiOS et la vue jury l'habillent différemment. Le tableau croisé réalisations × compétences est généré à partir des fiches : il est toujours à jour.
- **Accessibilité du menu.** Les rubriques sont de vrais liens `<a>` et les actions de vrais `<button>` : souris, tactile, clavier et lecteurs d'écran fonctionnent sans code spécial. À l'ouverture d'une boîte, le focus passe sur son titre et une zone `aria-live` annonce la rubrique ouverte.
- **Boot en calque, par-dessus le menu.** Le menu est affiché dès le chargement ; le boot est un calque noir posé dessus pendant 5 secondes au maximum. « Passer » (bouton, n'importe quelle touche, clic ou toucher) retire simplement le calque. Le navigateur, les lecteurs d'écran et Lighthouse voient le contenu principal tout de suite. Pendant le boot, le menu est rendu « inerte » (attribut `inert`) pour que la touche Tab ne s'y perde pas.
- **Boot fluide à 60 images/s, sans décalage de mise en page.** Une seule boucle `requestAnimationFrame` traite à chaque image les lignes dont l'heure est venue. L'écran du journal est une grille fixe de lignes, créées une seule fois (autant que l'écran en contient) : pour faire défiler, on réécrit seulement leur texte. Aucun élément n'est ajouté ni déplacé, donc aucun « décalage de mise en page » (mesure CLS de Lighthouse, passée de 0,44 à 0 grâce à ce choix). Le seul effet animé, le fondu final, n'utilise que l'opacité.
- **Boot seulement à l'accueil.** Un lien direct (`#/jury`, `#/realisations/nas`) affiche la page sans attendre. Si le système demande de réduire les animations, il n'y a pas de boot du tout. Le service `veille-techno.service` passe de `[ WARN ]` à `[  OK  ]` dès qu'un sujet est renseigné dans `site.config.js`.
- **Terminal caché, entièrement simulé.** Touche `` ` `` (ou `²` sur un clavier AZERTY PC), `Ctrl+Alt+T`, ou le bouton `[tty2]` de la barre du haut (seul moyen sur mobile). Les fiches y sont des fichiers (`cat realisations/perso/nas.md`) : l'arborescence est construite en mémoire à partir du contenu du site. Aucune commande n'est exécutée et rien n'est envoyé à un serveur ; tout ce que tape le visiteur est affiché avec `textContent`, donc jamais interprété comme du HTML (pas d'injection possible). Commandes : `help`, `whoami`, `neofetch`, `ls`, `cd`, `pwd`, `cat`, `open`, `jury`, `history`, `clear`, `reboot`, `exit`… et quelques surprises.
- **Sons synthétisés, coupés par défaut.** Bip POST, clics de disque pendant le journal et bip de validation sont fabriqués par la Web Audio API (oscillateurs et bruit filtré) : aucun fichier audio. Les navigateurs interdisent le son avant une interaction ; le contexte audio n'est donc créé qu'au premier clic ou à la première touche. Au tout premier chargement, le bip POST ne peut pas sonner : il sonne sur `<Redémarrer>`, ou dès que le son est activé pendant le boot. Le choix est mémorisé dans `localStorage`, dont chaque accès est protégé (navigation privée, stockage bloqué : le site fonctionne quand même).
- **Déploiement durci.** Image multi-stage (aucun outil de build dans l'image finale), conteneur en lecture seule, pas d'élévation de privilèges, version de nginx masquée, en-têtes de sécurité dont une CSP stricte (`script-src 'self'`) rendue possible parce que le site n'a aucun script ni style écrit dans le HTML. Cache d'un an sur les fichiers hashés, `index.html` jamais en cache : une nouvelle version est visible immédiatement.
- **Aperçus de lien.** L'image d'aperçu (`public/og-image.png`, une capture du menu en 1200×630) et l'adresse du site sont ajoutées automatiquement aux balises Open Graph dès que `urlPublique` est renseignée dans `content/site.config.js` : ces balises exigent des URL complètes, donc un nom de domaine.
- **Vue rapide jury.** Accessible en un clic depuis n'importe quel écran (bouton jaune en haut à droite, premier élément atteint avec Tab) ou directement par l'URL `#/jury`. Fond clair, police système, aucune animation, tout sur une page. La feuille `@media print` retire les boutons, écrit l'adresse des liens en clair et évite de couper un bloc en bas de page.
- **Visionneuse d'images native.** Les captures s'agrandissent dans un élément HTML `<dialog>` : le navigateur gère lui-même le piège du focus, la touche Échap et le retour du focus à la fermeture. Sans JavaScript, le lien ouvre simplement l'image.
- **Police auto-hébergée.** IBM Plex Mono est servie par le site lui-même, pas par Google Fonts : le site fonctionne sans accès extérieur (utile sur un réseau fermé ou en démonstration hors ligne) et aucune donnée de visite n'est transmise à un tiers. Seuls le sous-ensemble latin et deux graisses sont embarqués (≈ 30 ko au total). La police principale est préchargée pour que le boot s'affiche directement dans la bonne police.
- **Variables CSS (« tokens »).** Toutes les couleurs de la maquette sont définies une seule fois dans `tokens.css`. Les tailles de texte sont en `rem` : si le visiteur agrandit le texte dans son navigateur, le site suit (accessibilité).
- **Réduction des animations.** Si le système demande de réduire les animations (réglage d'accessibilité), les transitions CSS sont désactivées.

## Qualité mesurée

Audit Lighthouse 13 sur le build (`npm run build` puis `npm run preview`), le 24 septembre 2026 :

| Page | Performance | Accessibilité | Bonnes pratiques | SEO |
|---|---|---|---|---|
| Accueil (mobile) | 100 | 100 | 100 | 100 |
| Accueil (ordinateur) | 100 | 100 | 100 | 100 |
| Vue jury (mobile) | 100 | 100 | 100 | 100 |
| Fiche de réalisation (mobile) | 100 | 100 | 100 | 100 |

Accueil mobile : premier affichage 1,1 s, plus grand élément affiché 1,2 s, aucun blocage du navigateur (TBT 0 ms), aucun décalage de mise en page (CLS 0). Poids total de la page : 53 Ko.

Accessibilité vérifiée aussi avec axe-core (règles WCAG 2.2 AA) sur chaque écran : accueil, rubriques, fiche, erreur, vue jury, visionneuse, terminal, boot en cours, mobile. Aucune erreur. Aucune page ne défile horizontalement, même sur un écran de 320 px.

Pour refaire l'audit : ouvrir le site dans Chrome, outils de développement (F12), onglet **Lighthouse**.

## Avancement

- [x] 1. Initialisation du projet (Vite, git, configuration de base)
- [x] 2. Police auto-hébergée et thème RémiOS
- [x] 3. Contenu en Markdown et fiches d'exemple
- [x] 4. Menu principal et navigation
- [x] 5. Fiches de réalisation et visionneuse d'images
- [x] 6. Vue rapide jury imprimable
- [x] 7. Séquence de démarrage
- [x] 8. Terminal caché
- [x] 9. Sons de démarrage
- [x] 10. Responsive, accessibilité, performance
- [x] 11. Déploiement Docker + nginx
- [ ] 12. Documentation complète
