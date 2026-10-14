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
    Captures extraites de ces documents (TP du 23 septembre 2026).
-->

## Contexte

TP de BTS SIO, en deux temps : installer soi-même un outil de gestion des services informatiques, puis l'utiliser comme le ferait un support informatique. L'outil choisi est **GLPI**, logiciel libre très utilisé en entreprise pour l'inventaire du parc et le suivi des demandes des utilisateurs (tickets).

Tout se fait dans un lab : une machine virtuelle sous VirtualBox, sur mon PC.

## Objectifs

- Installer un serveur Debian 13 dans une machine virtuelle, prêt pour le lab.
- Y installer GLPI 11 sur une pile LAMP (Apache, PHP, MariaDB), puis le sécuriser.
- Rendre GLPI accessible depuis le navigateur du PC hôte.
- Traiter des tickets de bout en bout avec trois profils : demandeur, technicien et administrateur.
- Prioriser plusieurs demandes, alimenter la base de connaissances et lire les statistiques du support.
- Rédiger une documentation que quelqu'un d'autre peut suivre pas à pas.

## Mise en œuvre

**La machine virtuelle.** Debian 13 (netinst amd64) sur VirtualBox : 4 Go de mémoire, 2 processeurs, disque de 20 Go. L'installation automatique de VirtualBox est désactivée, pour faire ses propres choix : partitionnement assisté, miroir deb.debian.org, serveur SSH et utilitaires usuels, plus le bureau KDE Plasma. La carte réseau reste en NAT, avec une redirection de port : le port 8080 du PC hôte mène au port 80 de la VM. Un snapshot est pris avant l'installation de GLPI, puis un autre juste avant l'installation web.

**La pile LAMP.**

- **Apache 2.4** avec **PHP 8.4 en PHP-FPM**, et les extensions demandées par GLPI 11 (dont bcmath et mbstring, devenues obligatoires).
- **MariaDB**, sécurisé avec mariadb-secure-installation. GLPI a sa propre base (glpi, en utf8mb4) et son propre compte, limité à cette base, plus la lecture des fuseaux horaires.
- Un hôte virtuel Apache dont la racine est **/var/www/glpi/public**, et non le dossier de GLPI entier : le reste du code n'est pas accessible depuis le navigateur. Le site par défaut d'Apache est désactivé.
- Le cookie de session PHP est protégé (session.cookie_httponly), ce que GLPI vérifie à l'installation.

**L'installation web**, depuis le navigateur du PC hôte (adresse localhost:8080) : contrôle des prérequis, connexion à la base, initialisation. La procédure se termine par la sécurisation : changer les mots de passe des quatre comptes créés par défaut (GLPI le rappelle tant que ce n'est pas fait) et supprimer le fichier d'installation.

**Le traitement des tickets**, avec trois comptes :

| Compte | Profil | Rôle dans le TP |
|---|---|---|
| post-only | Self-Service | Demandeur |
| tech | Technicien | Traitement des tickets |
| glpi | Super-Admin | Préparation |

1. **Préparation** : une installation neuve n'a aucune catégorie de ticket. J'ai créé Matériel (et Périphériques en dessous), Réseau, Logiciel, Serveurs et Sécurité.
2. **Création** : un incident « Écran externe non détecté », avec son urgence. Le ticket arrive au statut Nouveau.
3. **Prise en charge** : le technicien s'attribue le ticket, qui passe automatiquement « En cours (attribué) ».
4. **Qualification** : le technicien renseigne l'impact. GLPI calcule la priorité en croisant l'urgence (donnée par le demandeur) et l'impact (donné par le technicien) : urgence moyenne et impact bas donnent une priorité basse.
5. **Solution et clôture** : un suivi, puis la solution. Le ticket passe Résolu, et c'est le demandeur qui approuve la solution pour le clore, comme le prévoit ITIL.
6. **Plusieurs tickets à la fois** : quatre demandes (Wi-Fi inaccessible, installation de logiciel, serveur de fichiers inaccessible, renouvellement de licence) à classer par priorité, puis à traiter jusqu'à la clôture.
7. **Base de connaissances et statistiques** : une procédure de reconnexion au Wi-Fi publiée dans la FAQ, puis les statistiques des tickets (nombre, délais de résolution et de clôture).

## Captures d'écran

Captures de mon lab, le 23 septembre 2026.

![Navigateur du PC hôte sur localhost:8080 : page « GLPI Installation », avec le bouton « Aller à la page d'installation »](captures/glpi/installation-web.webp "GLPI joint depuis le PC hôte, grâce à la redirection du port 8080 vers la VM")

![Tableau de bord de GLPI juste après l'installation : compteurs à zéro, 4 utilisateurs, 2 tickets, et un bandeau qui demande de changer les mots de passe par défaut des comptes glpi, post-only, tech et normal](captures/glpi/tableau-de-bord.webp "Après l'installation : GLPI rappelle de changer les mots de passe par défaut")

![Formulaire du ticket « Écran externe non détecté » : type Incident, catégorie Matériel > Périphérique, statut En cours (attribué), urgence Moyenne, impact Bas, priorité Basse](captures/glpi/qualification-ticket.webp "Qualification : urgence moyenne et impact bas donnent une priorité basse")

![Fil du ticket : la description de l'incident, un suivi « le problème persiste également avec un autre câble HDMI », puis la solution « Mise à jour du pilote graphique et test avec un second câble HDMI : le problème est résolu »](captures/glpi/suivi-et-solution.webp "Le fil du ticket : description, suivi, puis solution")

![Liste des tickets du TP : Wi-Fi inaccessible et Serveur de fichier inaccessible clos, Renouvellement de licence et Installation logicielle nouveaux, Écran externe non détecté clos, chacun avec sa priorité](captures/glpi/liste-des-tickets.webp "Les tickets du scénario, avec leur statut et leur priorité")

![Statistiques des tickets : courbes du nombre de tickets ouverts, résolus et clos, puis des délais moyens de clôture et de résolution, en heures](captures/glpi/statistiques.webp "Statistiques du support : nombre de tickets et délais moyens")

## Résultats et tests

- Contrôles avant l'installation web : configuration d'Apache vérifiée (apache2ctl configtest, « Syntax OK ») et PHP-FPM actif.
- GLPI 11 est installé, tous les prérequis au vert, et joignable depuis le PC hôte à l'adresse localhost:8080.
- Le cycle de vie complet d'un ticket a été vérifié : Nouveau, En cours (attribué), Résolu, puis Clos après approbation du demandeur.
- Trois tickets ont été traités jusqu'à la clôture : l'écran externe, puis, dans l'ordre de priorité, le serveur de fichiers et le Wi-Fi.
- Une procédure est publiée dans la base de connaissances, visible dans la FAQ des utilisateurs.

**Priorisation des quatre tickets.** Ordre retenu : serveur de fichiers (priorité très haute, plusieurs utilisateurs bloqués), Wi-Fi (incident qui bloque un utilisateur maintenant), licence, puis installation de logiciel (simple demande). La priorité calculée par GLPI ne suffit pas toujours : pour la licence, elle est moyenne, mais si c'est la licence de l'antivirus qui expire, tout le parc perd sa protection. L'impact réel est plus haut, et le ticket mérite une échéance.

## Documentation

Mes trois documentations complètes, en PDF :

- [Installation de Debian 13 sur VirtualBox](docs/glpi/installation-debian-virtualbox.pdf) (4 pages)
- [Installation de GLPI 11 sur Debian 13](docs/glpi/installation-glpi-debian.pdf) (8 pages, avec un tableau de dépannage)
- [TP GLPI : utilisation et gestion des tickets](docs/glpi/tp-glpi-tickets.pdf) (10 pages, avec mes réponses aux questions du TP)

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
- Gestion des incidents et des demandes selon ITIL : qualification, priorisation, résolution, clôture
- Profils et droits dans GLPI : demandeur, technicien, administrateur
- Base de connaissances et indicateurs du support
- Rédaction de documentations techniques pas à pas
