---
titre: "GLPI — gestion des tickets sur un serveur Debian"
slug: glpi
type: formation  # entreprise, formation ou perso
date: 2026-09  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "terminé"  # ex. en cours, terminé, en pause
resume: "Installation de GLPI 11 sur une machine virtuelle Debian 13 (Apache, PHP-FPM, MariaDB), puis traitement de tickets de bout en bout : création, qualification, priorisation, solution, clôture, base de connaissances et statistiques."
technos:
  - "Debian 13"
  - "VirtualBox"
  - "Apache"
  - "PHP"
  - "MariaDB"
  - "GLPI"
competences: [B1.1, B1.2, B1.5]  # codes du référentiel, ex. [B1.1, B1.4]
---

<!--
  Guide de rédaction
  - Captures : déposer l'image dans public/captures/glpi/, puis écrire
      ![Description de l'image](captures/glpi/nom-du-fichier.webp "Légende affichée")
  - competences : codes définis dans content/site.config.js, ex. [B1.1, B1.4]
  - Contenu rédigé d'après mes trois documentations (PDF dans public/docs/glpi/) :
    installation de Debian sur VirtualBox, installation de GLPI, TP sur les tickets.
    Une partie par documentation, avec ses captures (extraites de ces documents,
    TP du 23 septembre 2026) et le lien vers le PDF.
-->

## Contexte

TP de BTS SIO, en trois étapes : monter un serveur, y installer un outil de gestion des services informatiques, puis l'utiliser comme le ferait un support informatique. L'outil choisi est **GLPI**, logiciel libre très utilisé en entreprise pour l'inventaire du parc et le suivi des demandes des utilisateurs (tickets).

Tout se fait dans un lab : une machine virtuelle sous VirtualBox, sur mon PC. Chaque étape a sa propre documentation, rédigée pour que quelqu'un d'autre puisse la suivre pas à pas.

## Objectifs

- Installer un serveur Debian 13 dans une machine virtuelle, prêt pour le lab.
- Y installer GLPI 11 sur une pile LAMP (Apache, PHP, MariaDB), puis le sécuriser.
- Rendre GLPI accessible depuis le navigateur du PC hôte.
- Traiter des tickets de bout en bout avec trois profils : demandeur, technicien et administrateur.
- Prioriser plusieurs demandes, alimenter la base de connaissances et lire les statistiques du support.

## 1. Le serveur Debian

**La machine virtuelle.** Image netinst de Debian 13 (amd64, environ 700 Mo), téléchargée sur debian.org. Dans VirtualBox, une VM « debian-glpi » : 4 Go de mémoire, 2 processeurs, disque virtuel de 20 Go, sans EFI. L'installation automatique de VirtualBox est désactivée : sinon, il choisit seul le compte, les paquets et le bureau.

**Le réseau, avant le premier démarrage.** La carte reste en NAT : la VM accède à Internet, mais le PC hôte ne peut pas la joindre. J'ai donc ajouté une redirection de port : le port 8080 du PC hôte mène au port 80 de la VM. C'est par là que GLPI sera ouvert dans le navigateur.

**L'installation de Debian**, avec l'installateur :

- langue, pays et clavier français, nom de machine debian-glpi ;
- un mot de passe root : dans ce cas, Debian n'installe pas sudo, et l'administration se fait en root avec « su - » (laissé vide, le compte root serait désactivé et le premier utilisateur aurait sudo) ;
- partitionnement assisté, tout le disque dans une seule partition ;
- miroir deb.debian.org en France, chargeur de démarrage GRUB sur le disque ;
- dans la sélection des logiciels, les utilitaires usuels du système et le bureau KDE Plasma, sans GNOME, plus lourd.

**Premiers pas** : mise à jour complète du système (apt update, puis apt upgrade), et vérification que la VM a bien une adresse IP (ip a).

![Menu de l'installateur de Debian 13 : Graphical install, Install, Advanced options, Help…](captures/glpi/installateur-debian.webp "L'installateur de Debian 13, au démarrage de la VM")

![Sélection des logiciels de l'installateur : environnement de bureau Debian, KDE Plasma et utilitaires usuels du système cochés, GNOME et les autres bureaux décochés](captures/glpi/selection-logiciels.webp "Sélection des logiciels : KDE Plasma et les utilitaires usuels")

![Terminal Konsole en root sur la VM : apt update et apt upgrade, les dépôts trixie et trixie-security sont à jour, aucun paquet à mettre à niveau](captures/glpi/mise-a-jour-debian.webp "Système à jour, sur les dépôts de Debian 13 (trixie)")

Documentation complète : [Installation de Debian 13 sur VirtualBox](docs/glpi/installation-debian-virtualbox.pdf) (PDF, 4 pages).

## 2. L'installation de GLPI

**Les prérequis de GLPI 11** : Apache 2.4, PHP 8.2 au minimum (Debian 13 fournit PHP 8.4), MariaDB 10.6 ou MySQL 8.0 au minimum. Un snapshot de la VM est pris avant de commencer, puis un autre juste avant l'installation web : en cas d'erreur, retour en arrière en quelques secondes.

**Les paquets** : Apache, MariaDB, PHP en PHP-FPM, et les extensions PHP demandées par GLPI (curl, gd, intl, mbstring, xml, zip, bz2, ldap, bcmath). bcmath et mbstring sont devenues obligatoires avec GLPI 11.

**La base de données.**

- MariaDB est d'abord sécurisé avec mariadb-secure-installation.
- GLPI a sa propre base, glpi, en utf8mb4 (tous les caractères, accents et emojis compris), et son propre compte, glpi, qui ne se connecte que depuis la machine elle-même et n'a de droits que sur cette base.
- Ce compte a aussi le droit de lire la table des fuseaux horaires de MariaDB, que j'ai chargée depuis ceux du système : sans cela, GLPI affiche un avertissement à l'installation.

**GLPI lui-même** : la version 11.0.8, téléchargée depuis les versions publiées sur GitHub, décompressée dans /var/www/glpi, et confiée à l'utilisateur d'Apache (www-data).

**Apache.** Un hôte virtuel dédié à GLPI :

- sa racine est **/var/www/glpi/public**, et non le dossier de GLPI entier : la configuration et le reste du code ne sont pas accessibles depuis le navigateur ;
- des règles de réécriture envoient toutes les adresses vers index.php, le point d'entrée de GLPI 11, et transmettent l'en-tête d'authentification ;
- les fichiers PHP sont confiés à PHP-FPM, par son socket.

Il faut pour cela activer les modules rewrite, proxy_fcgi et setenvif, activer le site de GLPI et désactiver le site par défaut d'Apache.

**PHP** : le cookie de session est protégé contre la lecture par JavaScript (session.cookie_httponly), ce que GLPI vérifie à l'installation, puis PHP-FPM est redémarré.

**Les vérifications avant l'installation web** : la configuration d'Apache est valide (apache2ctl configtest répond « Syntax OK ») et PHP-FPM tourne.

**L'installation web**, depuis le navigateur du PC hôte (adresse localhost:8080, grâce à la redirection de port) : langue, licence, contrôle des prérequis, connexion à la base avec le compte glpi, puis initialisation de la base.

**Après l'installation.** GLPI crée quatre comptes par défaut (glpi en Super-Admin, tech en Technicien, normal et post-only), avec des mots de passe connus de tous. La procédure se termine par la sécurisation : changer ces mots de passe ou désactiver les comptes inutiles (GLPI le rappelle tant que ce n'est pas fait), et supprimer le fichier d'installation, qui permettrait de réinstaller GLPI par-dessus.

La documentation a aussi un tableau de dépannage (mot de passe SQL oublié, page inaccessible depuis le PC, erreur d'Apache…) et une annexe pour donner les droits sudo à un utilisateur.

![Navigateur du PC hôte sur localhost:8080 : page « GLPI Installation », avec le bouton « Aller à la page d'installation »](captures/glpi/installation-web.webp "GLPI joint depuis le PC hôte, grâce à la redirection du port 8080 vers la VM")

![Page « Connexion à votre compte » de GLPI : identifiant glpi, mot de passe masqué, source de connexion Base interne GLPI](captures/glpi/connexion.webp "Première connexion, avec le compte administrateur")

![Tableau de bord de GLPI juste après l'installation : compteurs à zéro, 4 utilisateurs, 2 tickets, et un bandeau qui demande de changer les mots de passe par défaut des comptes glpi, post-only, tech et normal](captures/glpi/tableau-de-bord.webp "Après l'installation : GLPI rappelle de changer les mots de passe par défaut")

Documentation complète : [Installation de GLPI 11 sur Debian 13](docs/glpi/installation-glpi-debian.pdf) (PDF, 8 pages).

## 3. L'utilisation de GLPI

Le TP joue un support informatique complet, avec trois comptes :

| Compte | Profil | Rôle dans le TP |
|---|---|---|
| post-only | Self-Service | Demandeur |
| tech | Technicien | Traitement des tickets |
| glpi | Super-Admin | Préparation |

**Préparation.** Une installation neuve n'a aucune catégorie de ticket. J'ai créé Matériel (et Périphériques en dessous), Réseau, Logiciel, Serveurs et Sécurité, puis vérifié que la matrice de priorité était celle par défaut.

**Le cycle de vie d'un ticket.** Un ticket passe par six statuts : Nouveau, En cours (attribué), En cours (planifié), En attente, Résolu et Clos. Pour les suivre :

1. **Création** : un incident « Écran externe non détecté », avec sa catégorie et son urgence. Le ticket arrive au statut Nouveau : personne ne lui est encore attribué.
2. **Suivi** : une information ajoutée au ticket (le problème persiste avec un autre câble). L'onglet Historique trace chaque modification : qui, quand, quel champ, ancienne et nouvelle valeur.
3. **Prise en charge** : le technicien s'attribue le ticket, qui passe automatiquement « En cours (attribué) ». Il passerait « En cours (planifié) » si une tâche datée était ajoutée.
4. **Qualification** : le technicien renseigne l'impact. GLPI calcule la priorité dans une matrice qui croise l'urgence (donnée par le demandeur) et l'impact : urgence moyenne et impact bas donnent une priorité basse. La priorité « Majeure » est hors matrice : elle ne s'attribue qu'à la main.
5. **Solution** : un suivi, puis la solution, et le ticket passe Résolu.
6. **Clôture** : la solution est approuvée côté demandeur, et le ticket passe Clos, comme le prévoit ITIL. S'il la refuse, le ticket est rouvert. Sans réponse, GLPI le clôt seul après le délai réglé dans l'entité.

**Plusieurs tickets à la fois.** Quatre demandes, créées par le technicien : Wi-Fi inaccessible, installation de logiciel, serveur de fichiers inaccessible et renouvellement de licence. Ordre de traitement retenu :

1. le serveur de fichiers : priorité très haute, plusieurs utilisateurs bloqués ;
2. le Wi-Fi : même priorité que la licence, mais c'est un incident qui bloque quelqu'un maintenant, et il est arrivé le premier ;
3. la licence ;
4. l'installation de logiciel, simple demande de confort.

La priorité calculée ne suffit pas toujours : pour la licence, elle est moyenne, mais si c'est la licence de l'antivirus qui expire, tout le parc perd sa protection. L'impact réel est plus haut, et le ticket mérite une échéance.

**Incidents et problèmes.** Si plusieurs tickets signalent la même panne, on crée un « problème » à partir de l'un d'eux et on y rattache les autres : l'incident sert à rétablir le service au plus vite, le problème à chercher la cause pour que la panne ne revienne pas. Des tickets identiques peuvent aussi être liés comme doublons.

**Base de connaissances.** Une procédure de reconnexion au Wi-Fi de l'entreprise, publiée dans la FAQ, visible des utilisateurs. Elle sert à capitaliser les solutions, à résoudre plus vite dès le premier niveau, à donner des réponses homogènes entre techniciens, et à éviter des tickets : les utilisateurs y trouvent la réponse eux-mêmes.

**Statistiques.** Trois indicateurs utiles pour piloter un support : le délai moyen de prise en compte (réactivité), le délai moyen de résolution et le nombre de tickets en retard (efficacité, respect des engagements), et la satisfaction des utilisateurs, quand les enquêtes sont activées.

![Formulaire du ticket « Écran externe non détecté » : type Incident, catégorie Matériel > Périphérique, statut En cours (attribué), urgence Moyenne, impact Bas, priorité Basse](captures/glpi/qualification-ticket.webp "Qualification : urgence moyenne et impact bas donnent une priorité basse")

![Fil du ticket : la description de l'incident, un suivi « le problème persiste également avec un autre câble HDMI », puis la solution « Mise à jour du pilote graphique et test avec un second câble HDMI : le problème est résolu »](captures/glpi/suivi-et-solution.webp "Le fil du ticket : description, suivi, puis solution")

![Liste des tickets du TP : Wi-Fi inaccessible et Serveur de fichier inaccessible clos, Renouvellement de licence et Installation logicielle nouveaux, Écran externe non détecté clos, chacun avec sa priorité](captures/glpi/liste-des-tickets.webp "Les tickets du scénario, avec leur statut et leur priorité")

![Statistiques des tickets : courbes du nombre de tickets ouverts, résolus et clos, puis des délais moyens de clôture et de résolution, en heures](captures/glpi/statistiques.webp "Statistiques du support : nombre de tickets et délais moyens")

Documentation complète : [TP GLPI : utilisation et gestion des tickets](docs/glpi/tp-glpi-tickets.pdf) (PDF, 10 pages, avec mes réponses aux questions du TP).

## Résultats et tests

- Debian 13 installé et à jour, joignable depuis le PC hôte par la redirection de port.
- Contrôles avant l'installation web : configuration d'Apache vérifiée (apache2ctl configtest, « Syntax OK ») et PHP-FPM actif.
- GLPI 11 installé, tous les prérequis au vert, et joignable depuis le PC hôte à l'adresse localhost:8080.
- Le cycle de vie complet d'un ticket a été vérifié : Nouveau, En cours (attribué), Résolu, puis Clos après approbation du demandeur.
- Trois tickets ont été traités jusqu'à la clôture : l'écran externe, puis, dans l'ordre de priorité, le serveur de fichiers et le Wi-Fi.
- Une procédure est publiée dans la base de connaissances, visible dans la FAQ des utilisateurs.

## Difficultés rencontrées

**Joindre la VM depuis le PC hôte.** En NAT, le PC hôte ne voit pas la machine virtuelle. Solution : une redirection du port 8080 de l'hôte vers le port 80 de la VM, dans les réglages réseau de VirtualBox.

**Le compte root de MariaDB refusé par GLPI.** Sur Debian, root se connecte à MariaDB par le socket système, pas par mot de passe. C'est normal, et c'est plus sûr : GLPI utilise son propre compte, qui n'a de droits que sur sa base.

**Un TP écrit pour GLPI 10.** GLPI 11 a refondu l'interface des demandeurs : accueil en tuiles, création des tickets par un catalogue de services. Il a fallu retrouver chaque étape dans la nouvelle interface ; la documentation donne les deux chemins.

**Une installation neuve est vide.** Sans catégories de tickets, le scénario ne pouvait pas commencer : il a fallu les créer d'abord, avec le compte administrateur.

## Compétences mises en œuvre

- Installation d'un serveur Linux (Debian 13) dans une machine virtuelle, réseau NAT et redirection de port
- Installation et configuration d'une pile LAMP : Apache (hôte virtuel), PHP-FPM, MariaDB
- Sécurisation d'un service : compte de base de données dédié, racine web limitée, mots de passe par défaut et fichier d'installation
- Snapshots avant chaque étape à risque
- Gestion des incidents et des demandes selon ITIL : qualification, priorisation, résolution, clôture, incidents et problèmes
- Profils et droits dans GLPI : demandeur, technicien, administrateur
- Base de connaissances et indicateurs du support
- Rédaction de documentations techniques pas à pas
