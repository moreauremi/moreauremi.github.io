---
titre: "Hermes Dashboard (dashu) — espace de travail auto-hébergé"
slug: dashu
type: perso  # entreprise, formation ou perso
date: 2026-11  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "en service, version 1.0.0 publiée"  # ex. en cours, terminé, en pause
resume: "Mon espace de travail tout-en-un : tableau de bord, notes, emploi du temps Pronote et fichiers rangés en dossiers, répartis en espaces (Perso, École, Taff…). J'en ai écrit le cahier des charges, puis je l'ai déployé sur mon homelab Proxmox, joignable sur app.dashu.dev par un tunnel Cloudflare et par Tailscale, avec une sauvegarde nocturne vérifiée par une vraie restauration. Depuis la version 1.0.0, n'importe qui peut l'installer en une commande, et Claude s'y branche comme connecteur."
technos:
  - "Rust"
  - "htmx"
  - "SQLite"
  - "ffmpeg"
  - "Proxmox"
  - "LXC"
  - "Debian"
  - "systemd"
  - "Cloudflare"
  - "Tailscale"
  - "Docker"
  - "OpenID Connect"
  - "GitHub Actions"
  - "Lighthouse"
  - "Claude Code"
competences: [B1.1, B1.4, B1.5, B1.6]  # codes du référentiel, ex. [B1.1, B1.4]
---

<!--
  Guide de rédaction
  - Captures : déposer l'image dans public/captures/dashu/, puis écrire
      ![Description de l'image](captures/dashu/nom-du-fichier.webp "Légende affichée")
  - competences : codes définis dans content/site.config.js, ex. [B1.1, B1.4]
  - Contenu rédigé d'après le dépôt github.com/moreauremi/dashu : SPEC.md (cahier
    des charges), STATUS.md (critères vérifiés, mesures, écarts) et README.md
    (déploiement, sauvegardes). C'est la référence.
  - Captures du 11 novembre 2026 : une copie de dashu remplie de données de
    démonstration (faux cours, fausses notes, compte demo@dashu.dev), pas mes
    vraies données. La capture de la restauration est la sortie réelle sur le
    serveur, remise en forme.
  - Mise à jour du 15 novembre 2026 : la v2 (fichiers, conversions, dossiers),
    la barre de commandes et le nouvel éditeur, d'après STATUS.md.
  - Mise à jour du 24 novembre 2026 : connecteur Claude, API complète,
    corbeille et installation simple (version 1.0.0), d'après STATUS.md.
    Captures du premier lancement et de Réglages › Instance : une copie de
    dashu toute neuve, compte demo@dashu.dev. Captures de l'installation et
    de la mise à jour : sorties réelles (conteneur de test, puis serveur),
    remises en forme et abrégées.
-->

## Contexte

Entre le BTS (emploi du temps sur Pronote Campus), l'alternance chez 1Life et le perso, mes notes, mes tâches et mes agendas étaient éparpillés entre plusieurs applications. Je voulais un seul endroit, à moi et hébergé chez moi : une sorte de Microsoft 365 personnel, fait sur mesure plutôt qu'un tableau de bord tout fait.

J'en ai aussi fait un exercice de gestion de projet : écrire un vrai cahier des charges, avec des critères d'acceptation vérifiables, le faire réaliser par une IA (Claude), et garder la main sur les choix, le déploiement et la validation.

Depuis le 12 novembre 2026, l'application s'affiche sous le nom Hermes Dashboard, comme mes autres projets ; dashu reste son nom de code (dépôt, programme, commandes).

## Objectifs

- Une seule porte d'entrée : identifiant et mot de passe, ou compte Google. Inscription fermée : seules les adresses autorisées entrent.
- Des espaces, Perso, École et Taff au départ : chaque note, tâche, fichier ou agenda appartient à un espace, et Perso réunit le contenu de tous les espaces.
- Des notes Markdown avec recherche, les tâches du jour, et l'emploi du temps importé de Pronote Campus.
- En v2, un endroit pour mes fichiers (cours, scans, photos d'iPhone), rangés en dossiers, et des conversions qui ne mettent jamais le serveur en danger.
- Rapide (score Lighthouse mobile d'au moins 95) et utilisable sur téléphone comme une application.
- Hébergé sur mon homelab, joignable de partout sans ouvrir de port sur la box.
- Facile à exploiter : sauvegarde chaque nuit, vérifiée par une vraie restauration, et mise à jour en une commande avec retour arrière automatique.

## Mise en œuvre

**Le cahier des charges.** J'ai rédigé la spécification : périmètre de la v1 et ce qui en est exclu, technologies, modèle de données, exigences de performance et de sécurité, déploiement, et 14 critères d'acceptation. Un fichier de suivi indique, pour chaque critère, s'il est vérifié, où et comment, et liste les écarts au cahier des charges avec leur justification. Chaque évolution suivante (fichiers, espaces et outils, barre de commandes, dossiers) a eu sa propre section, avec ses critères, écrite avant le code.

**L'application.** Un seul programme écrit en Rust, qui fabrique les pages côté serveur ; la bibliothèque htmx rend la navigation fluide, sans recharger la page. Les données sont dans une base SQLite, avec une recherche plein texte. Les notes s'éditent mises en forme, comme dans Notion (un menu « / » insère titres, listes, tableaux ou images), mais restent enregistrées en Markdown. L'emploi du temps est synchronisé toutes les heures depuis le lien iCal de Pronote Campus. Une barre de commandes, ouverte par « / », permet de tout faire au clavier. Une API JSON, protégée par un jeton, permet à Hermès, mon agent IA, de gérer mes tâches et mes notes, et de lire mon agenda.

**La sécurité.**

- Mots de passe hachés avec Argon2id, et 5 tentatives de connexion par minute au plus pour une même adresse IP.
- Connexion Google par OpenID Connect, avec un client OAuth que j'ai créé dans la Google Cloud Console. Une adresse absente de la liste autorisée est refusée.
- Politique de sécurité du contenu (CSP) stricte : aucun script ni style en ligne. Le contenu des notes est nettoyé pour empêcher l'injection de script.
- Le service tourne sous un utilisateur système sans droits, n'écoute que sur la machine elle-même (127.0.0.1) et voit le système de fichiers en lecture seule (durcissement systemd).
- Hermès n'a qu'un accès SSH limité à six actions (état, journaux, redémarrage, mise à jour, suivi de la mise à jour, sauvegarde), imposées par une commande forcée.

**La v2 : les fichiers et les dossiers.**

- J'ai vidé le second disque du serveur (465 Go, une ancienne installation de Proxmox) et je l'ai déclaré comme stockage LVM-thin dans Proxmox. Deux volumes y sont montés dans le conteneur : 45 Go pour les fichiers, 5 Go pour les sauvegardes de la base, qui ne sont donc plus sur le même disque qu'elle. Un troisième volume, sur le premier disque cette fois, reçoit chaque nuit la copie des fichiers : chaque donnée existe sur deux disques. Cette copie est incrémentale (un fichier déjà sauvegardé n'est pas recopié, il est relié au précédent par un lien dur avec rsync), gardée 14 jours, et restaurer la base d'une nuit remet aussi les fichiers de cette nuit-là.
- Un fichier part en morceaux de 50 Mo, car l'offre gratuite de Cloudflare refuse les requêtes de plus de 100 Mo. Sur le disque, il porte un nom aléatoire, jamais celui choisi par l'utilisateur. Il n'est jamais exécuté dans la page : seuls les types sans code (images, vidéos, sons) s'affichent, le reste est servi en téléchargement, avec une CSP « sandbox ».
- Les conversions (photos HEIC d'iPhone, vidéos, sons, PDF, et documents Markdown avec pandoc et Typst) tournent dans un service à part : un autre utilisateur système, sans réseau, qui ne voit ni la base ni les fichiers rangés, limité à 1,5 Go de mémoire. Le service web, limité à 256 Mo, ne lance jamais d'outil lui-même.
- Des dossiers et sous-dossiers, trois niveaux au plus, rangent les fichiers et les notes. Ils n'existent que dans la base : rien ne bouge sur le disque, et un nom de dossier ne peut désigner aucun autre fichier. On range par une fenêtre qui montre tout l'arborescence, ou en glissant à la souris ; supprimer un dossier qui n'est pas vide passe par un avertissement.
- Les fichiers ont les mêmes tags que les notes, et une recherche sur le nom (index plein texte de SQLite, accents ignorés) dans le dossier ouvert et ses sous-dossiers. Un fichier se renomme depuis son aperçu ou la liste : seule la partie avant l'extension change, le type du fichier reste celui de l'envoi.
- Un fichier se partage par un lien valable 1 heure, 1 jour ou 7 jours, et révocable. Le lien contient 32 octets aléatoires ; la base n'en garde que l'empreinte SHA-256, donc la lire ne permet pas de reconstituer un lien. La page du lien ne montre que le nom et la taille, et télécharge le fichier ; expiré, révoqué ou inconnu, c'est la même page, et le nombre de requêtes par adresse IP est limité.

**Claude et l'API complète.**

- Un connecteur Claude (le protocole MCP, qui permet à une IA de découvrir et d'appeler les outils d'une application) : chaque compte branche son propre Claude, sur claude.ai, l'app iPhone ou Claude Code. L'autorisation passe par OAuth, comme « Se connecter avec Google » : Claude n'a jamais le mot de passe, et chaque accès se révoque dans les réglages.
- L'API JSON fait maintenant tout ce que fait le site (fichiers, dossiers, liens de partage, conversions, agenda, espaces et membres), avec des jetons personnels. Hermès et Claude passent par les mêmes fonctions que le site : une règle de sécurité s'écrit une fois et vaut partout.
- Avant d'ouvrir les suppressions à une IA, une corbeille de 30 jours : une erreur de l'assistant, ou une consigne glissée dans une note partagée, se rattrape. Vider la corbeille reste réservé au site.

**L'installation en une commande (version 1.0.0).** Jusque-là, installer dashu demandait de compiler et de suivre le README pas à pas. J'en ai écrit le cahier des charges, puis il a été livré en cinq pull requests :

- **Des binaires tout faits** : à chaque fusion, la CI compile dashu pour Linux en x86_64 et en ARM 64 bits (Raspberry Pi), chacun sur une machine de son architecture, en binaire statique qui tourne sur toute distribution. Elle publie les archives avec leur empreinte SHA-256, et une image Docker pour les deux architectures. Deux canaux : `v1` suit chaque fusion (c'est celui de mon serveur), le canal stable suit les versions numérotées. Licence AGPL.
- **Un script qui pose les questions** (`curl … | sudo bash`) : comment accéder à dashu (réseau de la maison, Tailscale, Tailscale Funnel ou un nom de domaine par un tunnel Cloudflare : aucun domaine n'est obligatoire), les fichiers, les conversions. Les secrets se tapent sans s'afficher et ne passent jamais en argument d'une commande. Relancé, il propose un menu, et annule tout changement qui empêcherait dashu de démarrer.
- **Le premier lancement dans le navigateur** : tant qu'aucun compte n'existe, toute page mène à un assistant. Il demande d'abord un code d'installation que dashu écrit dans son journal à chaque démarrage : le premier venu qui tomberait sur la page ne peut pas prendre l'instance. Puis le compte administrateur, l'adresse et, si on veut, Google. dashu se relance tout seul pour prendre ces réglages.
- **Réglages › Instance**, pour l'administrateur : l'adresse, Google et les adresses autorisées. Une valeur fixée dans le fichier de configuration du serveur reste prioritaire et s'affiche verrouillée : mon serveur, configuré ainsi, n'a rien vu changer.

**Le déploiement sur mon homelab.**

- Un conteneur LXC Debian 13 sur Proxmox, avec dashu lancé comme service systemd. Depuis le 24 novembre 2026, c'est le binaire publié par la CI ; avant, il était compilé sur place.
- Un tunnel Cloudflare : le conteneur ouvre une connexion sortante vers Cloudflare, qui publie app.dashu.dev en HTTPS. Aucun port n'est ouvert sur la box. J'ai confié la gestion DNS du domaine dashu.dev à Cloudflare.
- Tailscale : un second accès, par mon VPN, qui marche même si Cloudflare tombe.
- dashu.dev affiche une page publique qui présente le projet (GitHub Pages).

**L'exploitation.**

- Une sauvegarde à chaud de la base chaque nuit à 3 h 30 (minuterie systemd), vérifiée par SQLite et gardée 14 jours, puis la copie des fichiers sur l'autre disque.
- dashu-restore remet une sauvegarde en service : il met d'abord la base actuelle de côté, et revient en arrière tout seul si dashu ne redémarre pas.
- dashu-update télécharge la dernière version, vérifie son empreinte, sauvegarde la base, remplace le programme et vérifie que le service répond. Sinon, il remet la version précédente et la base d'avant. Quelques secondes, au lieu de 4 à 20 minutes de compilation.
- À chaque modification, GitHub Actions vérifie le format et la qualité du code, lance les tests automatiques (390 aujourd'hui), rejoue le bac à sable systemd du serveur, puis construit dashu pour x86_64 et ARM et l'installe pour de vrai sur une machine de chaque architecture : questions du script, premier lancement, mises à jour, archive abîmée refusée, retour arrière.

**Le suivi du projet.** Après la v1, chaque évolution est passée par une pull request, testée avant d'être fusionnée : l'API pour Hermès, la vue d'ensemble de l'agenda dans Perso, une navigation sans écran noir, un sélecteur d'espace façon « Dynamic Island » avec changement d'espace par balayage, une barre de raccourcis sur téléphone, l'installation en application sur l'écran d'accueil de l'iPhone. Puis des espaces à la carte (jusqu'à huit), un dashboard modulaire, la v2 des fichiers, la barre de commandes qui remplace la palette Ctrl+K, le nouvel éditeur de notes et les dossiers. En novembre, le connecteur Claude, la corbeille, l'API complète et l'installation en une commande, chacun en plusieurs pull requests à fusionner dans l'ordre.

Réalisé avec **Claude Code**. Mon rôle : définir le besoin, faire les choix et tester. Le déploiement et l'exploitation (Proxmox, Cloudflare, Tailscale, Google, sauvegarde et restauration), je les ai faits moi-même sur mon serveur, guidé pas à pas.

![Schéma de l'architecture de dashu : mon ordinateur et mon iPhone joignent dashu par le tunnel Cloudflare (app.dashu.dev, aucun port ouvert) ou par le VPN Tailscale. Hermès, mon agent IA, passe par Tailscale pour l'API JSON et pour un SSH limité à six actions. Sur le serveur Proxmox, un conteneur LXC Debian fait tourner cloudflared et tailscale serve, qui relaient vers dashu (binaire Rust, service systemd), sa base SQLite sauvegardée chaque nuit, et les scripts d'exploitation.](schemas/dashu-architecture.svg "Architecture : deux accès sans port ouvert, un conteneur LXC sur mon homelab")

Code source : [github.com/moreauremi/dashu](https://github.com/moreauremi/dashu) · Présentation : [dashu.dev](https://dashu.dev)

## Captures d'écran

Captures de la v1, le 11 novembre 2026, sur une copie de dashu remplie de données de démonstration (faux cours, fausses notes). Depuis, l'éditeur ne montre plus qu'une vue mise en forme, et la palette Ctrl+K est devenue la barre de commandes. Les captures du 24 novembre suivent, puis la sortie réelle de la restauration sur mon serveur.

![Dashboard de l'espace École en thème sombre : prochains cours avec horaires et salles, tâches du jour avec une case cochée, notes récentes et horloge. En haut, l'île avec les trois espaces, École sélectionné.](captures/dashu/dashboard.webp "Dashboard de l'espace École : prochains cours, tâches du jour, notes récentes")

![Agenda de l'espace Perso en thème clair, semaine du 16 novembre : les cours de l'espace École le lundi et le mardi, le planning de l'espace Taff du mercredi au vendredi, et les rendez-vous perso. Chaque événement porte le nom de son espace.](captures/dashu/agenda-vue-ensemble.webp "Agenda de Perso : la vue d'ensemble de tous les espaces")

![Éditeur de la note « VLAN et trunk 802.1Q » : le Markdown à gauche, l'aperçu à droite avec titres, liste, bloc de commandes Cisco et tableau des VLAN, et les tags #bts et #réseau.](captures/dashu/editeur.webp "Éditeur Markdown, avec aperçu en direct et sauvegarde automatique")

![Palette de commandes ouverte par Ctrl+K : la recherche « vlan » trouve la note « VLAN et trunk 802.1Q » de l'espace École, mot recherché surligné.](captures/dashu/palette.webp "Palette Ctrl+K : recherche dans toutes les notes, au clavier")

![Trois écrans d'iPhone en thème sombre : le dashboard de l'espace École, l'agenda de Perso qui défile horizontalement, et la liste des notes avec les tags. En bas, la barre de raccourcis : Dashboard, Notes, Agenda, Rechercher.](captures/dashu/telephone.webp "Sur iPhone, en application sur l'écran d'accueil : île en haut, raccourcis en bas")

Captures de l'installation simple, le 24 novembre 2026. Le premier lancement et Réglages › Instance viennent d'une copie de dashu toute neuve ; l'installation (sur un conteneur de test de mon Proxmox) et la mise à jour (sur mon serveur) sont les sorties réelles, remises en forme et abrégées.

![Terminal : la commande curl lance le script d'installation sur un conteneur Debian neuf. Il demande comment accéder à dashu (réseau de la maison, Tailscale, Tailscale Funnel ou nom de domaine), puis les fichiers et les conversions. Il télécharge la version 1.0.0, vérifie son empreinte SHA-256, démarre les services, puis donne l'adresse de l'assistant et le code d'installation.](captures/dashu/installation.webp "Installation en une commande, sur un conteneur Debian neuf")

![Trois écrans du premier lancement, en thème sombre. En haut à gauche, le champ « Code d'installation », avec l'endroit où le trouver (journalctl -u dashu, ou docker logs). À droite, l'assistant : 1. le compte, qui devient l'administrateur, 2. l'adresse de dashu, 3. la connexion avec Google, dépliée, avec les étapes de la console Google et l'adresse de retour à déclarer. En bas à gauche, la page de fin : dashu redémarre, et prévient que l'adresse ne répond pas depuis le serveur (ici une adresse de démonstration), sans bloquer.](captures/dashu/premier-lancement.webp "Premier lancement : le code du journal, puis le compte, l'adresse et Google sur une seule page")

![Carte Instance des réglages : l'adresse publique, la connexion avec Google à activer, et trois adresses autorisées. L'administratrice ne peut pas retirer sa propre adresse ; une autre n'a pas encore de compte.](captures/dashu/instance.webp "Réglages › Instance, pour l'administrateur")

![Terminal du serveur : echo binaire dans /etc/dashu/source puis dashu-update, qui télécharge la version du canal v1, sauvegarde la base (27 notes) et installe la nouvelle version ; dashu-admin status montre ensuite le service actif, la version et « mise à jour par : binaire, canal v1 ».](captures/dashu/mise-a-jour.webp "Mon serveur passe au binaire téléchargé : la mise à jour prend quelques secondes")

![Terminal du serveur : dashu-restore liste les sauvegardes de la plus récente à la plus ancienne, puis restaure dashu-2026-11-11_183222.db. La base actuelle est d'abord sauvegardée et vérifiée, puis la restauration se termine et indique la commande pour revenir en arrière.](captures/dashu/restauration.webp "Exercice de restauration sur le serveur, le 11 novembre 2026")

## Résultats et tests

- Les 14 critères d'acceptation du cahier des charges sont vérifiés, la plupart sur le serveur réel.
- 96 tests automatiques à la fin de la v1, 390 aujourd'hui (connexion, isolation des données entre deux comptes, notes, lecture de l'agenda heure d'été comprise, API, flux OAuth complet du connecteur Claude, corbeille, premier lancement, injection de script, fichiers piégés, dossiers, liens de partage expirés ou révoqués), lancés par GitHub Actions à chaque pull request.
- Version 1.0.0 publiée le 24 novembre 2026 : archives x86_64 et ARM, image Docker de 10 Mo (x86_64) et 21 Mo (ARM), téléchargeables par tout le monde. Installation essayée le même jour sur un conteneur Debian neuf de mon Proxmox, joint depuis mon PC par Tailscale.
- Mon serveur est passé au binaire téléchargé : /login répond en 0,66 ms (médiane sur 20 requêtes) au lieu de 0,55 ms avec le binaire compilé sur place, une différence attendue avec ce type de binaire, très loin de la cible de 20 ms.
- Lighthouse mobile sur le serveur (v1), via Cloudflare, en 4G simulée : 99 pour le dashboard, 100 pour les notes, 100 pour l'agenda, 99 pour l'éditeur.
- À la fin de la v1, le service occupait 7,6 Mo de mémoire et répondait en 0,5 ms ; l'image Docker faisait 7 Mo.
- Connexion Google testée avec mon compte (le même que par mot de passe) et avec un compte non autorisé, qui est refusé.
- Restauration réelle le 11 novembre 2026 : une note créée après la sauvegarde disparaît à la restauration, puis revient quand on l'annule.
- Compression vérifiée sur le serveur, à travers le service isolé : une photo HEIC de 4032 × 3024 devient un JPEG de 2560 × 1920 (816 Ko → 391 Ko), un PDF passe de 626 Ko à 57 Ko, une vidéo 4K HDR de 10 s devient un MP4 1080p de 3,7 Mo au lieu de 54,8 Mo. Pendant une conversion, le service ne voit que l'interface réseau locale.
- Dossiers essayés sur le serveur le 15 novembre 2026, depuis mon iPhone et mon ordinateur.
- Hermes Dashboard me sert au quotidien depuis novembre 2026, sur ordinateur et sur iPhone.

## Difficultés rencontrées

**Le site injoignable depuis le Wi-Fi de la maison.** app.dashu.dev marchait en 4G, mais pas chez moi. Le DNS de la box gardait en mémoire une ancienne réponse, « ce nom n'existe pas », d'avant le passage du domaine chez Cloudflare. Je l'ai vu en comparant les réponses du DNS de la box et de celui de Cloudflare (1.1.1.1). Sur Mac, nslookup interroge directement le serveur DNS, alors que le navigateur passe par le cache du système : dscacheutil m'a montré ce que voyait vraiment le navigateur. Solution : mes appareils utilisent les serveurs DNS imposés par Tailscale, plutôt que celui de la box.

**Une mise à jour qui pouvait se tromper.** En relisant le script de mise à jour, un défaut est apparu : si la compilation échouait, le code source était déjà à jour mais pas le programme en service, et la mise à jour suivante répondait « Déjà à jour » sans recompiler. Correction : la version réellement en service est notée à part, et la commande d'état signale tout écart.

**Une sauvegarde jamais restaurée ne prouve rien.** La sauvegarde tournait chaque nuit, mais rien ne montrait qu'on pouvait la remettre en place. J'ai fait l'exercice sur le serveur sans rien perdre : la base actuelle est mise de côté avant chaque restauration, et une note témoin prouve que les données viennent bien de la sauvegarde.

**Le zoom sur iPhone.** Ajoutée à l'écran d'accueil, l'application se laissait zoomer comme une page web, et iOS ignore la consigne standard depuis iOS 10. Solution : un manifeste d'application, et un blocage du pincement uniquement en mode application. Dans Safari, le zoom reste possible, pour l'accessibilité.

**Une compression qui marchait partout, sauf sur le serveur.** Le bouton « Compresser » échouait en production alors que tous les tests passaient. Deux causes, propres au bac à sable systemd du service, absent en local et dans les tests : RestrictSUIDSGID=yes refuse tout chmod qui pose le bit setgid, et chaque dossier déclaré en ReadWritePaths est un point de montage à part, si bien qu'un simple renommage d'un dossier à l'autre échoue (EXDEV). Correction : plus de bit setgid, et une copie suivie d'un effacement quand le renommage échoue. Pour que l'erreur ne revienne pas, la CI rejoue maintenant ce bac à sable.

**Un test qui ne rendait jamais la main.** Pour tester le script d'installation comme une vraie personne, la CI lui envoyait les réponses dans un terminal simulé. Elle est restée bloquée 20 minutes : le terminal simulé attendait la fin de son entrée, qui ne venait jamais. Je l'ai remplacé par un petit programme Python qui attend que chaque question s'affiche avant d'y répondre, s'arrête avec le script, et échoue clairement sur une question imprévue. L'étape a aussi reçu une limite de temps.

**Un retour arrière qui ne vérifiait rien.** Ce même test l'a montré : quand une nouvelle version ne démarrait pas, dashu-update remettait l'ancienne mais rendait la main sans vérifier qu'elle répondait. Il l'attend maintenant, et remet à zéro le compteur de redémarrages de systemd, que la version ratée a pu épuiser.

**La page d'accueil qui ne se publiait plus.** Du jour au lendemain, la publication de dashu.dev échouait : l'étape de publication ne trouvait plus le site envoyé juste avant. Ma première correction (un droit de plus) n'a rien changé. En comparant une publication réussie et une ratée, ligne à ligne, j'ai vu que tout était identique sauf ce résultat : un changement côté GitHub. Séparer l'envoi et la publication en deux étapes, comme le modèle officiel de GitHub, l'a réglé.

**Une mesure faussée.** Le premier Lighthouse du dashboard donnait environ 94, sous la cible : les extensions de mon navigateur ajoutaient du travail au chargement de la page. Mesure refaite trois fois dans une fenêtre Invité, sans extension : médiane de 99.

## Pistes d'amélioration

- Faire l'exercice de restauration avec un fichier sur le serveur : en supprimer un, puis le faire revenir avec la sauvegarde de la nuit.
- Surveiller le service avec Uptime Kuma, dans son propre conteneur (la procédure est écrite), pour être prévenu d'une panne.
- Essayer le connecteur Claude depuis claude.ai et l'iPhone : le parcours complet est testé automatiquement, l'essai réel reste à faire.
- Signer les versions publiées (avec minisign, par exemple) : l'empreinte SHA-256 protège d'un téléchargement abîmé, pas d'une version publiée par quelqu'un d'autre.

## Compétences mises en œuvre

- **B1.1** : gérer des sauvegardes (sauvegarde nocturne vérifiée, restauration réelle, sauvegardes croisées : la base sur le second disque, les fichiers sur le premier) ; mettre en place et vérifier les niveaux d'habilitation (adresses autorisées, jeton d'API, accès SSH d'Hermès limité à six actions, liens de partage temporaires et révocables) ; vérifier la continuité du service (deux accès, retour arrière automatique des mises à jour, adresse de contrôle /health) ; corbeille de 30 jours avant d'ouvrir les suppressions à une IA.
- **B1.4** : rédiger un cahier des charges avec des critères d'acceptation, découper le travail en pull requests, suivre l'avancement critère par critère et analyser les écarts au cahier des charges.
- **B1.5** : réaliser les tests d'intégration et d'acceptation (tests automatiques, critères vérifiés sur le serveur, mesures Lighthouse, installation rejouée par la CI sur deux architectures), publier des versions (binaires, image Docker, script d'installation), déployer le service (Proxmox, LXC, stockage LVM-thin et points de montage, systemd, service de conversion isolé, Cloudflare, Tailscale, DNS, OAuth Google) et documenter son installation et son exploitation.
- **B1.6** : mettre en place mon environnement de travail personnel, avec mes cours, mes notes de révision et mon emploi du temps au même endroit, et m'en servir au quotidien.
