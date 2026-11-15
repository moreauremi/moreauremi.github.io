---
titre: "Hermes Dashboard (dashu) — espace de travail auto-hébergé"
slug: dashu
type: perso  # entreprise, formation ou perso
date: 2026-11  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "v1 en service, v2 en cours"  # ex. en cours, terminé, en pause
resume: "Mon espace de travail tout-en-un : tableau de bord, notes, emploi du temps Pronote et fichiers rangés en dossiers, répartis en espaces (Perso, École, Taff…). J'en ai écrit le cahier des charges, puis je l'ai déployé sur mon homelab Proxmox, joignable sur app.dashu.dev par un tunnel Cloudflare et par Tailscale, avec une sauvegarde nocturne vérifiée par une vraie restauration."
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
  - Captures du 15 novembre 2026 : une copie locale de l'application remplie de
    données de démonstration (faux cours, fausses notes, faux fichiers, compte
    demo@example.test), pas mes vraies données. La capture de la restauration est
    la sortie réelle sur le serveur, le 11 novembre, remise en forme.
  - Mise à jour du 15 novembre 2026 : la v2 (fichiers, conversions, dossiers),
    la barre de commandes et le nouvel éditeur, d'après STATUS.md.
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

- J'ai vidé le second disque du serveur (465 Go, une ancienne installation de Proxmox) et je l'ai déclaré comme stockage LVM-thin dans Proxmox. Deux volumes y sont montés dans le conteneur : 45 Go pour les fichiers, 5 Go pour les sauvegardes de la base, qui ne sont donc plus sur le même disque qu'elle.
- Un fichier part en morceaux de 50 Mo, car l'offre gratuite de Cloudflare refuse les requêtes de plus de 100 Mo. Sur le disque, il porte un nom aléatoire, jamais celui choisi par l'utilisateur. Il n'est jamais exécuté dans la page : seuls les types sans code (images, vidéos, sons) s'affichent, le reste est servi en téléchargement, avec une CSP « sandbox ».
- Les conversions (photos HEIC d'iPhone, vidéos, sons, PDF) tournent dans un service à part : un autre utilisateur système, sans réseau, qui ne voit ni la base ni les fichiers rangés, limité à 1,5 Go de mémoire. Le service web, limité à 256 Mo, ne lance jamais d'outil lui-même.
- Des dossiers et sous-dossiers, trois niveaux au plus, rangent les fichiers et les notes. Ils n'existent que dans la base : rien ne bouge sur le disque, et un nom de dossier ne peut désigner aucun autre fichier. On range par une fenêtre qui montre tout l'arborescence, ou en glissant à la souris ; supprimer un dossier qui n'est pas vide passe par un avertissement.

**Le déploiement sur mon homelab.**

- Un conteneur LXC Debian 13 sur Proxmox. dashu y est compilé sur place et lancé comme service systemd.
- Un tunnel Cloudflare : le conteneur ouvre une connexion sortante vers Cloudflare, qui publie app.dashu.dev en HTTPS. Aucun port n'est ouvert sur la box. J'ai confié la gestion DNS du domaine dashu.dev à Cloudflare.
- Tailscale : un second accès, par mon VPN, qui marche même si Cloudflare tombe.
- dashu.dev affiche une page publique qui présente le projet (GitHub Pages).

**L'exploitation.**

- Une sauvegarde à chaud de la base chaque nuit à 3 h 30 (minuterie systemd), vérifiée par SQLite et gardée 14 jours.
- dashu-restore remet une sauvegarde en service : il met d'abord la base actuelle de côté, et revient en arrière tout seul si dashu ne redémarre pas.
- dashu-update récupère le code, recompile, sauvegarde la base, remplace le programme et vérifie que le service répond. Sinon, il remet la version précédente.
- À chaque modification, GitHub Actions vérifie le format et la qualité du code, lance les tests automatiques (235 aujourd'hui), rejoue le bac à sable systemd du serveur et construit une image Docker de moins de 30 Mo.

**Le suivi du projet.** Après la v1, chaque évolution est passée par une pull request, testée avant d'être fusionnée : l'API pour Hermès, la vue d'ensemble de l'agenda dans Perso, une navigation sans écran noir, un sélecteur d'espace façon « Dynamic Island » avec changement d'espace par balayage, une barre de raccourcis sur téléphone, l'installation en application sur l'écran d'accueil de l'iPhone. Puis des espaces à la carte (jusqu'à huit), un dashboard modulaire, la v2 des fichiers, la barre de commandes qui remplace la palette Ctrl+K, le nouvel éditeur de notes et les dossiers.

Réalisé avec **Claude Code**. Mon rôle : définir le besoin, faire les choix et tester. Le déploiement et l'exploitation (Proxmox, Cloudflare, Tailscale, Google, sauvegarde et restauration), je les ai faits moi-même sur mon serveur, guidé pas à pas.

![Schéma de l'architecture de dashu : mon ordinateur et mon iPhone joignent dashu par le tunnel Cloudflare (app.dashu.dev, aucun port ouvert) ou par le VPN Tailscale. Hermès, mon agent IA, passe par Tailscale pour l'API JSON et pour un SSH limité à six actions. Sur le serveur Proxmox, un conteneur LXC Debian fait tourner cloudflared et tailscale serve, qui relaient vers dashu (binaire Rust, service systemd), sa base SQLite sauvegardée chaque nuit, et les scripts d'exploitation.](schemas/dashu-architecture.svg "Architecture : deux accès sans port ouvert, un conteneur LXC sur mon homelab")

Code source : [github.com/moreauremi/dashu](https://github.com/moreauremi/dashu) · Présentation : [dashu.dev](https://dashu.dev)

## Captures d'écran

Captures du 15 novembre 2026, sur une copie de l'application remplie de données de démonstration (faux cours, fausses notes, faux fichiers). La dernière est la sortie réelle de la restauration sur mon serveur, le 11 novembre.

![Dashboard de l'espace École en thème sombre : un calendrier sur trois jours avec les cours colorés par matière, le prochain cours avec son heure et sa salle, et les tâches du jour, dont une cochée. En haut, l'île avec les trois espaces, École sélectionné ; à gauche, la barre latérale : Commandes, Dashboard, Notes, Fichiers, Agenda, Outils.](captures/dashu/dashboard.webp "Dashboard de l'espace École : calendrier, prochain cours, tâches du jour")

![Agenda de l'espace Perso en thème clair, semaine du 16 novembre : les cours de l'espace École le lundi et le mardi, le planning de l'espace Taff du mercredi au vendredi. Chaque événement porte le nom de son espace.](captures/dashu/agenda-vue-ensemble.webp "Agenda de Perso : la vue d'ensemble de tous les espaces")

![Onglet Fichiers, dossier Réseaux de l'espace École : le chemin Fichiers › École › Réseaux, les boutons Nouvelle note, Nouveau dossier et Envoyer des fichiers, la zone de dépôt qui envoie dans « École / Réseaux », puis le sous-dossier TP, deux notes et deux PDF.](captures/dashu/dossiers.webp "Fichiers : des dossiers qui rangent les fichiers et les notes")

![Fenêtre « Ranger » ouverte sur le fichier memento-cisco.pdf : les espaces Perso, École et Taff, et sous chacun ses dossiers et sous-dossiers ; le dossier actuel, Réseaux, est marqué « Ici ».](captures/dashu/ranger.webp "Ranger un fichier : tous les espaces et tous les dossiers dans une seule fenêtre")

![Éditeur de la note « VLAN et trunk 802.1Q » : le texte mis en forme (liste, bloc de commandes Cisco, tableau des VLAN, cases à cocher), et sous le titre le dossier « École / Réseaux » et les tags #bts et #réseau. Le menu des blocs est ouvert après un « / » : texte, titres, listes, liste de tâches.](captures/dashu/editeur.webp "Éditeur en une seule vue : « / » ouvre le menu des blocs")

![Barre de commandes ouverte sur le dashboard : la saisie « /open vlan » propose la note « VLAN et trunk 802.1Q » et le fichier cours-vlan.pdf de l'espace École ; en bas, l'aide des touches Tab, flèches et Entrée.](captures/dashu/commandes.webp "Barre de commandes « / » : tout se fait au clavier")

![Trois écrans d'iPhone en thème sombre : le dashboard de l'espace École avec son calendrier, la liste des notes rangée par dossier (Sans dossier, Culture générale, Cybersécurité), et le dossier Réseaux dans l'onglet Fichiers. En bas, la barre de raccourcis : Dashboard, Notes, Agenda, Commandes.](captures/dashu/telephone.webp "Sur iPhone, en application sur l'écran d'accueil")

![Terminal du serveur : dashu-restore liste les sauvegardes de la plus récente à la plus ancienne, puis restaure dashu-2026-11-11_183222.db. La base actuelle est d'abord sauvegardée et vérifiée, puis la restauration se termine et indique la commande pour revenir en arrière.](captures/dashu/restauration.webp "Exercice de restauration sur le serveur, le 11 novembre 2026")

## Résultats et tests

- Les 14 critères d'acceptation du cahier des charges sont vérifiés, la plupart sur le serveur réel.
- 96 tests automatiques à la fin de la v1, 235 aujourd'hui (connexion, isolation des données entre deux comptes, notes, lecture de l'agenda heure d'été comprise, API, injection de script, fichiers piégés, dossiers), lancés par GitHub Actions à chaque pull request.
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

**Une mesure faussée.** Le premier Lighthouse du dashboard donnait environ 94, sous la cible : les extensions de mon navigateur ajoutaient du travail au chargement de la page. Mesure refaite trois fois dans une fenêtre Invité, sans extension : médiane de 99.

## Pistes d'amélioration

- Sauvegarder aussi les fichiers chaque nuit, sur le premier disque cette fois, pour que chaque donnée existe sur deux disques, puis refaire un exercice de restauration avec un fichier.
- Surveiller le service avec Uptime Kuma, pour être prévenu d'une panne.
- Finir la v2 : partage d'un fichier par lien temporaire et révocable, tags et recherche dans les fichiers, conversion des documents (Markdown vers PDF).

## Compétences mises en œuvre

- **B1.1** : gérer des sauvegardes (sauvegarde nocturne vérifiée, restauration réelle, sauvegardes de la base sur un second disque) ; mettre en place et vérifier les niveaux d'habilitation (adresses autorisées, jeton d'API, accès SSH d'Hermès limité à six actions) ; vérifier la continuité du service (deux accès, retour arrière automatique des mises à jour, adresse de contrôle /health).
- **B1.4** : rédiger un cahier des charges avec des critères d'acceptation, découper le travail en pull requests, suivre l'avancement critère par critère et analyser les écarts au cahier des charges.
- **B1.5** : réaliser les tests d'intégration et d'acceptation (tests automatiques, critères vérifiés sur le serveur, mesures Lighthouse), déployer le service (Proxmox, LXC, stockage LVM-thin et points de montage, systemd, service de conversion isolé, Cloudflare, Tailscale, DNS, OAuth Google) et documenter son installation et son exploitation.
- **B1.6** : mettre en place mon environnement de travail personnel, avec mes cours, mes notes de révision et mon emploi du temps au même endroit, et m'en servir au quotidien.
