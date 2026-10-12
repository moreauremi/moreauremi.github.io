---
titre: "Environnement Open-Prod v10 : architecture et maintenance"
slug: 1life-realisation-1
type: entreprise  # entreprise, formation ou perso
date: 2026-09/2026-10  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "en cours"  # ex. en cours, terminé, en pause
resume: "Maintenance de ma machine virtuelle de formation chez 1Life : un serveur Ubuntu qui fait tourner l'ERP Open-Prod 10.2, construit sur Odoo, avec PostgreSQL et JasperReports. Je mets à jour ses composants avec l'outillage interne de 1Life, je synchronise les bases de données avec le code, et je duplique ou restaure les bases de démonstration."
technos:
  - "Ubuntu 24.04"
  - "Open-Prod 10"
  - "Odoo"
  - "PostgreSQL"
  - "Python"
  - "PHP"
  - "Git"
  - "Git LFS"
  - "systemd"
  - "JasperReports"
  - "SSH"
competences: [B1.1, B1.5, B1.6]  # codes du référentiel, ex. [B1.1, B1.4]
---

<!--
  Guide de rédaction
  - Captures : déposer l'image dans public/captures/1life-realisation-1/, puis ajouter
    une section « ## Captures d'écran » (après « Mise en œuvre ») avec
      ![Description de l'image](captures/1life-realisation-1/nom-du-fichier.webp "Légende affichée")
    Idées (avec l'accord du tuteur, sans adresse interne ni mot de passe) : la sortie
    d'openprod-info, le menu d'app-manager, l'interface web de gestion des bases.
  - competences : codes définis dans content/site.config.js, ex. [B1.1, B1.4]
  - Contenu rédigé d'après l'exploration de la VM (alias, openprod-info) et la lecture
    des scripts ScriptAppManager.php, ScriptSqlUpdate.php et maj_base.sh.
    Ce code appartient à 1Life : la fiche décrit son fonctionnement, sans le recopier.
  - À compléter plus tard : ce que je vérifie dans Open-Prod après une mise à jour
    (Résultats et tests), une deuxième difficulté réelle (Difficultés rencontrées).
  - À faire : faire relire la fiche par le tuteur.
-->

## Contexte

Depuis septembre 2026, je suis consultant ERP en alternance chez **1Life**, intégrateur de l'ERP **Open-Prod** au sein du groupe Visiativ. Les premières semaines sont consacrées à la formation : apprendre Open-Prod sur des bases de démonstration avant d'intervenir chez les clients. J'y ai notamment présenté un flux achat-vente, été formé à la gestion à l'affaire et préparé un flux de production.

Pour cette formation, je dispose d'une **machine virtuelle Ubuntu** sur laquelle tourne une installation complète d'Open-Prod v10. Je l'administre en **SSH** depuis mon poste, et j'utilise l'ERP dans le navigateur.

## Objectifs

- Garder l'environnement à jour avec les dernières versions d'Open-Prod et des modules de 1Life
- Remettre les bases de données en cohérence avec le code après chaque mise à jour
- Travailler sur des copies des bases de démonstration, et pouvoir revenir à un état connu
- Comprendre comment une installation Open-Prod est construite, et ce que font réellement les commandes que j'utilise

## Mise en œuvre

**L'architecture de la machine.** La machine virtuelle tourne sous **Ubuntu 24.04** et réunit plusieurs briques :

- **Serveur Open-Prod 10.2** : l'ERP lui-même, écrit en **Python** et construit sur **Odoo**, un ERP open source très répandu. Il fonctionne en arrière-plan comme service **systemd**, que l'on peut démarrer, arrêter ou interroger.
- **PostgreSQL** : le système de gestion de base de données. Chaque base contient les données d'une société de démonstration ou de formation (articles, clients, commandes, ordres de fabrication…).
- **JasperReports** : le moteur qui produit les documents imprimables, comme les factures et les bons de livraison.
- **Outillage MyFab** : un ensemble de scripts en **PHP** développés par l'équipe dev de 1Life, qui servent à installer, mettre à jour et configurer tout le reste. Chaque commande du terminal (app-manager, sql-update, openprod-info…) est un raccourci vers un même programme, qui lance le script correspondant.

![Schéma d'architecture de l'environnement Open-Prod v10 : depuis mon poste Windows, j'administre la machine virtuelle en SSH et j'utilise Open-Prod dans le navigateur. La machine virtuelle Ubuntu 24.04 fait tourner le serveur Open-Prod 10.2 (Python, construit sur Odoo, service systemd), qui stocke ses données dans PostgreSQL (bases de démonstration et de formation) et produit les documents PDF avec JasperReports. L'outillage MyFab (scripts PHP de 1Life, dont app-manager et sql-update) pilote le serveur et récupère les mises à jour depuis quatre dépôts Git. Les bases sont dupliquées, restaurées et importées depuis le navigateur.](schemas/openprod-architecture.svg "Architecture de mon environnement Open-Prod v10")

**Quatre composants suivis avec Git.** L'installation repose sur quatre dépôts **Git**, chacun avec sa propre version, que la commande openprod-info affiche :

- **Open-Prod**, le cœur de l'ERP : version 10.2
- **Modules MyFab**, les ajouts de 1Life sur Open-Prod : version 1.8.0
- **Rapports Jasper**, les modèles de documents imprimés
- **Scripts MyFab**, l'outillage d'installation et de maintenance : version 4.0.1

**Mettre à jour l'environnement.** J'utilise la commande **app-manager**, qui gère sept composants : Open-Prod, les modules MyFab et les modules spécifiques, Jasper et ses rapports, et l'outillage lui-même. Pour chacun, elle détecte s'il est installé, puis propose l'installation, la mise à jour ou la désinstallation, et lance le script correspondant. La mise à jour récupère la nouvelle version du code depuis Git, avec **Git LFS** pour les fichiers volumineux. Quand une mise à jour réussit et que le composant le demande, app-manager enchaîne à la fin sur la synchronisation des bases.

**Synchroniser les bases avec le code (sql-update).** Le nouveau code attend parfois des tables ou des colonnes qui n'existent pas encore dans les bases. La commande sql-update les remet en cohérence :

1. arrêt du service Open-Prod, pour que personne ne modifie les données pendant l'opération ;
2. choix des bases à traiter : une, plusieurs ou toutes ;
3. enregistrement dans un journal de la version de chaque dépôt, pour savoir ensuite avec quel code chaque base a été mise à jour ;
4. pour chaque base, mise à jour de tous les modules : Odoo compare le code avec la base, crée ou modifie les tables et les colonnes, recharge les menus et les écrans, et remplace les traductions ;
5. redémarrage du service, puis affichage des erreurs éventuelles.

Malgré son nom, sql-update n'exécute pas de requêtes SQL écrites à la main : c'est Odoo qui traduit les changements du code en modifications de la base. Une base doit être synchronisée avant d'être utilisée avec une nouvelle version. Un autre script de l'outillage peut aussi enregistrer, dans les paramètres système de la base, la branche et le dernier commit de chaque dépôt : on retrouve ainsi la version du code depuis la base elle-même.

**Dupliquer, restaurer et importer des bases.** Depuis l'interface web de gestion des bases, je duplique les bases de démonstration pour travailler sur une copie sans abîmer l'originale, je restaure une base pour revenir à un état connu, et j'importe d'autres bases de démonstration et de formation.

## Résultats et tests

- L'environnement est à jour : Open-Prod 10.2, au dernier commit du 9 octobre 2026.
- Les bases servent à ma formation : j'y ai présenté un flux achat-vente, et j'y prépare un flux de production.
- Pour vérifier une mise à jour, je dispose de trois contrôles : openprod-info pour les versions installées, la liste d'erreurs affichée à la fin de sql-update, et l'état du service Open-Prod.
- openprod-info signale aussi une mise à jour en attente de l'outillage MyFab, que je ferai avec l'accord de mon tuteur.

## Difficultés rencontrées

**Comprendre ce que faisaient vraiment les commandes.** Au début, j'utilisais les commandes de l'outillage sans savoir ce qu'il y avait derrière. Pour le comprendre, j'ai d'abord retrouvé où elles étaient définies (ce sont des alias du terminal), puis j'ai lu le code des scripts. J'ai ainsi découvert qu'Open-Prod est construit sur Odoo, et que sql-update ne lance pas de SQL mais une mise à jour des modules.

## Pistes d'amélioration

- Rédiger un mode opératoire « Mettre à jour une base de test Open-Prod v10 », utile aux prochains alternants
- Documenter le fonctionnement d'Open-Prod v10 en Markdown à partir de cette machine
- Réaliser une duplication de base en ligne de commande, pour comprendre ce que fait l'interface web

## Compétences mises en œuvre

- Administration à distance d'un serveur Linux en SSH
- Gestion des versions d'une application avec Git
- Mise à jour d'un ERP et synchronisation de ses bases de données PostgreSQL
- Gestion d'un service avec systemd
- Duplication, restauration et import de bases de données
- Lecture et compréhension de scripts d'administration (Bash, PHP)
