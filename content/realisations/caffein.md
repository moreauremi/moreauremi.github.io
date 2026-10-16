---
titre: "CAFFEIN — ERP modulaire assisté par IA"
slug: caffein
type: perso  # entreprise, formation ou perso
date: 2026-01/2026-10  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "v2.0 publiée en open source, ERP modulaire en cours"  # ex. en cours, terminé, en pause
resume: "Logiciel de gestion libre pour TPE, devenu un ERP modulaire (ventes, achats, stock, production, RH, CRM, projets, qualité, maintenance, comptabilité) : données en tables SQL, calculs en Python, droits réglés module par module, et une IA qui rédige devis et factures à partir d'une phrase. Prototypé avec n8n, réécrit en Python (FastAPI, React), auto-hébergé sur un serveur Linux derrière Nginx."
technos:
  - "Python"
  - "FastAPI"
  - "SQLite"
  - "SQL"
  - "React"
  - "API Claude"
  - "n8n"
  - "Linux"
  - "systemd"
  - "Nginx"
  - "DNS"
  - "Hostinger"
  - "Docker"
  - "GitHub Actions"
  - "Claude Code"
competences: [B1.1, B1.4, B1.5]  # codes du référentiel, ex. [B1.1, B1.4]
---

<!--
  Guide de rédaction
  - Captures : déposer l'image dans public/captures/caffein/, puis écrire
      ![Description de l'image](captures/caffein/nom-du-fichier.webp "Légende affichée")
  - competences : codes définis dans content/site.config.js, ex. [B1.1, B1.4]
  - Contenu rédigé d'après le dépôt GitHub (README, docs/architecture.md, CHANGELOG,
    code, scripts de déploiement, CI), les workflows n8n de la v1 et la roadmap :
    c'est la référence, le CV sera aligné dessus.
-->

## Contexte

Ce projet annexe, baptisé CAFFEIN, est né de mon intérêt pour les CRM, les ERP et l'intelligence artificielle, et de l'envie de réunir ces trois sujets.

Le constat de départ : les freelances, les micro-entrepreneurs et les très petites entreprises (TPE) passent beaucoup de temps sur leur administratif (devis, factures, relances d'impayés, TVA, déclarations URSSAF), souvent sans être à l'aise avec les logiciels de gestion. L'idée : qu'ils puissent simplement décrire ce qu'ils veulent, et que le logiciel s'occupe du reste.

Je mène ce projet seul, sur mon temps personnel, avec un budget limité : les API, le serveur et le nom de domaine sont à ma charge.

Une fois la facturation en place, j'ai voulu aller jusqu'au bout de l'idée de départ : faire de CAFFEIN un **ERP** (progiciel de gestion intégré) capable de faire tourner toute une petite entreprise, de l'achat de la matière première à la facture, en passant par le stock, la fabrication, les salariés et les clients.

## Objectifs

- Créer un devis ou une facture à partir d'une simple phrase, par exemple « Mission logo pour Jean Martin, 800 €, livraison le 15 ».
- Automatiser les tâches répétitives : génération du PDF, envoi au client, relance des factures impayées, classement des justificatifs.
- Suivre la TVA à reverser et les cotisations URSSAF sans saisie supplémentaire : tout est déduit des factures et des justificatifs.
- Mettre le service en ligne sur un serveur Linux, de façon sécurisée et facile à maintenir.
- En faire un ERP **modulaire** : chaque domaine (RH, achats, production…) est un module qu'on active ou non, avec des droits réglés par utilisateur, et ajouter un module ne doit rien casser.

## Mise en œuvre

**Version 1 : un prototype assemblé avec n8n (janvier à août 2026).** La première version reposait sur **n8n**, un outil d'automatisation par workflows. Une dizaine de workflows géraient l'envoi des factures, les relances, la génération des PDF (avec Gotenberg), la première connexion d'un utilisateur, les notifications et le paiement de l'abonnement (Stripe). Les données étaient stockées dans **Supabase**, les documents classés dans Google Drive, et l'IA passait par des nœuds OpenAI et Claude. Ce prototype a permis de construire les premières fonctions, mais il dépendait de nombreux services extérieurs et devenait difficile à tester.

**Version 2 : une réécriture libre et auto-hébergeable (publiée le 7 octobre 2026).** J'ai regroupé toute la logique dans une seule application :

- **Serveur** : une API en **Python** avec **FastAPI** et une base **SQLite**, dont le schéma évolue par migrations automatiques. Les PDF sont générés en Python (ReportLab).
- **Interface** : une application **React** (Vite, React Router, Recharts), servie par le même processus, en français ou en anglais, avec un thème clair ou sombre.
- **Assistant IA** : **l'API Claude** transforme une phrase en brouillon structuré (client, lignes, montants, dates), lit les factures fournisseurs déposées (PDF ou photo) pour en extraire le fournisseur, les montants, la catégorie et l'échéance, et rédige les relances. Sans clé API, une analyse locale prend le relais : le logiciel reste utilisable hors ligne et aucune donnée ne quitte le serveur.
- **Automatisations** : les workflows n8n sont remplacés par **8 scripts Python**, lancés par un planificateur intégré au serveur (toutes les minutes, chaque jour à heure fixe ou sur un événement) : traitement des justificatifs, génération des PDF, envoi des factures, relances d'impayés sur trois niveaux (rappel amical, relance ferme, mise en demeure), alertes TVA, emails d'accueil… Chaque exécution est historisée, et chaque email envoyé reste consultable dans une boîte d'envoi.
- **Modules** : devis et factures (numérotation continue, mentions légales, transformation d'un devis en facture, page en ligne pour le client), clients, justificatifs, suivi de la TVA, tableau de bord URSSAF (chiffre d'affaires encaissé, cotisations, plafond de la micro-entreprise et seuil de franchise de TVA), gestion des utilisateurs avec deux rôles (administrateur et membre).
- **Emails** : envoi par **SMTP** ; sans serveur mail configuré, les emails sont simulés.

**Version 3 : un ERP modulaire (octobre 2026).** J'ai réorganisé tout le logiciel en modules :

| Module | Contenu |
|---|---|
| Accueil | les chiffres à traiter (retards, ruptures, validations) puis une carte par module, et « Mes vues » |
| Données techniques | articles, nomenclatures, postes de charge, gammes, coût de revient calculé |
| RH | salariés, services, absences en jours ouvrés (jours fériés français), soldes de congés, notes de frais |
| Achats | fournisseurs, commandes, réceptions qui alimentent le stock |
| Ventes | devis et factures en une phrase, relances, commandes clients |
| CRM | prospects, opportunités pondérées, actions commerciales, devis en un clic |
| Production | ordres de fabrication, besoins en composants, charge des postes, coûts |
| Logistique | entrepôts, mouvements, stock par article, réapprovisionnement |
| Projets | tâches, temps passés, facturation des temps |
| Qualité et Maintenance | non-conformités et plans d'actions ; équipements et interventions |
| Comptabilité | TVA, URSSAF, justificatifs lus et classés automatiquement |
| Paramètres | utilisateurs, rôles et droits par module, activation des modules |

- **Les données dans des tables SQL**, une par objet (commande, ligne de commande, mouvement de stock…), avec des migrations versionnées par module : une mise à jour ne perd rien, et les lignes des factures, auparavant stockées en bloc, ont été recopiées dans leur propre table.
- **Les calculs en Python, côté serveur** : totaux, TVA, coûts de revient de proche en proche, jours ouvrés, stock disponible… L'interface ne fait qu'afficher ; même pendant la saisie, c'est le serveur qui recalcule.
- **Des écrans générés** : un module déclare ses tables, ses champs et ses actions (confirmer, livrer, valider un congé…), et CAFFEIN en déduit l'API et les écrans (liste avec recherche, filtres et export, fiche, vue en colonnes par statut). Un module complet tient en un fichier d'une soixantaine de lignes.
- **Les droits par module** : chaque utilisateur a un rôle (Commercial, Acheteur, Production, RH, Comptable, Lecture seule…) qui fixe, module par module, un niveau d'accès (aucun, lecture, écriture, gestion), avec des exceptions possibles par personne. Un module désactivé disparaît pour tout le monde, et le serveur refuse ses requêtes ; les salaires ne sont visibles qu'au niveau gestion.
- **Des modules qui se parlent sans dépendre les uns des autres** : livrer une commande sort le stock, réceptionner un achat l'alimente, terminer une fabrication consomme les composants — seulement si la Logistique est active. Une fiche utilisée par un autre module ne peut pas être supprimée.

**Mise en ligne et sécurité.**

- **Serveur Linux** : le service tourne sur un serveur Linux loué chez **Hostinger**, joignable par un nom de domaine dédié configuré dans les **DNS**.
- **Script d'installation** (Debian, Ubuntu, Fedora, RHEL, Arch, openSUSE) : il crée un utilisateur système dédié, installe le code dans /opt/caffein, la configuration dans /etc/caffein et les données dans /var/lib/caffein, puis déclare le service **systemd** caffein.service. Les mises à jour font une sauvegarde avant d'appliquer les migrations ; un second script désinstalle proprement.
- **Durcissement du service** : pas d'élévation de privilèges, système de fichiers en lecture seule sauf le dossier des données, dossier temporaire privé, redémarrage automatique en cas de panne.
- **Nginx en reverse proxy** : l'application n'écoute qu'en local (127.0.0.1:8000). **Nginx** reçoit le trafic, redirige HTTP vers HTTPS (certificat Let's Encrypt obtenu avec certbot), ajoute l'en-tête HSTS et limite la taille des fichiers envoyés.
- **Docker** : une alternative en conteneur, avec une image construite en deux étapes, un utilisateur non root et un contrôle de santé.
- **Sécurité de l'application** : mots de passe hachés (scrypt), sessions dans un cookie HttpOnly, limitation des tentatives de connexion par adresse IP, protection CSRF, en-têtes de sécurité (CSP stricte, anti-iframe), données sensibles des justificatifs chiffrées en AES-256-GCM.
- **Sauvegardes** : une commande sauvegarde la base, les documents et la clé de chiffrement dans une archive, et une autre la restaure ; la sauvegarde peut être planifiée chaque nuit avec cron.

Réalisé avec **Claude Code**. Mon rôle : définir le besoin, faire les choix et tester.

![Schéma d'architecture de CAFFEIN : le freelance décrit sa facture en une phrase depuis son navigateur. Le nom de domaine mène au serveur Linux hébergé chez Hostinger, où Nginx, en reverse proxy HTTPS, relaie la requête vers le service caffein.service (API FastAPI, interface React, 8 scripts planifiés qui remplacent n8n). L'API Claude transforme la phrase en brouillon, avec une analyse locale en repli. La facture et son PDF sont enregistrés dans les données locales (SQLite, justificatifs chiffrés), puis les scripts l'envoient au client final par SMTP et gèrent les relances.](schemas/caffein-architecture.svg "Architecture de CAFFEIN : parcours d'une demande, de la phrase à la facture envoyée")

Code source (licence AGPL-3.0) : [github.com/moreauremi/caffein](https://github.com/moreauremi/caffein)

## Captures d'écran

Captures de l'ERP sur l'instance de démonstration (données fictives d'un studio graphique qui fabrique aussi des kits de papeterie).

![Accueil : section « À traiter » (demandes RH à valider, livraisons fournisseurs en retard, factures en retard, ruptures) puis une carte par module avec ses chiffres clés](captures/caffein/accueil.webp "Accueil : ce qui demande une action en tête, puis une carte par module")

![Paramètres, page Modules : chaque module avec sa description, ses dépendances et un interrupteur pour l'activer ou le désactiver](captures/caffein/modules.webp "Paramètres → Modules : activer ou désactiver un module pour toute l'entreprise")

![Paramètres, page Rôles et droits : grille des rôles (Commercial, Acheteur, Production, RH, Comptable…) avec un niveau d'accès par module](captures/caffein/droits.webp "Rôles et droits : un niveau d'accès par module, rôle par rôle")

![CRM, opportunités en vue Tableau : une colonne par étape (découverte, qualification, proposition, négociation, gagnée) avec le nombre d'affaires et le montant de chaque colonne](captures/caffein/tableau.webp "Vue Tableau : le pipeline commercial, totaux calculés par le serveur")

![Fiche d'un ordre de fabrication : article, quantité, besoins en composants avec stock disponible et manques, opérations par poste et coûts](captures/caffein/fabrication.webp "Production : besoins, manques, temps et coûts calculés en Python")

![Page Factures et devis : champ « Décrivez, Caffein rédige » avec des exemples de phrases, indicateurs d'encaissement et liste des factures](captures/caffein/factures.webp "Ventes : une phrase suffit pour générer le brouillon d'une facture")

![Tableau de bord URSSAF : prochaine déclaration, chiffre d'affaires encaissé, cotisations, graphique mensuel et seuils de l'année](captures/caffein/urssaf.webp "Comptabilité : chiffre d'affaires à déclarer, cotisations et seuils de l'année")

![Assistant d'installation : choix des modules utiles à l'entreprise, avec leurs dépendances](captures/caffein/installation.webp "Premier lancement : l'assistant propose de choisir les modules")

## Résultats et tests

Le code de la version 2.0 a été publié en open source sur GitHub le 7 octobre 2026.

Les tests se sont révélés complexes : tous les modules fonctionnent ensemble et l'assistant IA agit sur chacun d'eux, donc un problème à un endroit peut faire dysfonctionner l'ensemble. Je les ai donc automatisés :

- **30 tests automatisés** (pytest) couvrent les calculs fiscaux, le chiffrement, l'analyse hors ligne, le cycle de vie d'une facture, les scripts, l'API, l'authentification, les rôles, la protection CSRF, l'assistant d'installation et la sauvegarde avec restauration. Ils passent tous.
- **Intégration continue** (GitHub Actions) à chaque modification : tests sous Python 3.10 et 3.13, analyse du code (Ruff, ESLint, ShellCheck), build de l'interface, construction de l'image Docker puis démarrage du conteneur.
- **Test de déploiement** : à chaque modification, la CI installe aussi Caffein sur une machine Ubuntu vierge, vérifie que le service systemd est actif, crée un administrateur, lance une sauvegarde, refait l'installation pour tester la mise à jour, puis désinstalle tout.

Le mode hors ligne permet de lancer tous ces tests sans appeler l'API Claude, donc sans coût.

## Difficultés rencontrées

**Le coût.** L'API d'IA, le serveur et le nom de domaine sont payants, et la version 1 ajoutait plusieurs services extérieurs, chacun avec son compte, sa configuration et ses risques de panne. Piste retenue : auto-héberger le maximum de briques. C'est ce qu'a fait la version 2 : SQLite remplace Supabase, un dossier local remplace Google Drive, ReportLab remplace Gotenberg et des scripts Python remplacent n8n. L'IA devient facultative, et un modèle moins cher (Claude Haiku) peut être choisi.

**Tester un système où tout est lié.** Dans la version 1, la logique était répartie entre les workflows n8n et plusieurs services en ligne, ce qui rendait les enchaînements difficiles à tester. En la regroupant dans un seul code Python, j'ai pu la couvrir par des tests automatisés et une CI qui réinstalle tout le logiciel à chaque modification.

## Pistes d'amélioration

- Dicter ses demandes à l'assistant au lieu de les écrire, avec un modèle de transcription auto-hébergé (Whisper)
- Factures au format Factur-X et export comptable FEC pour l'expert-comptable
- Copier automatiquement les sauvegardes hors du serveur, par exemple vers mon NAS

## Compétences mises en œuvre

- Développement d'une application web en Python (FastAPI) et React
- Administration d'un serveur Linux : service systemd durci, utilisateur dédié, journaux
- Reverse proxy Nginx, HTTPS avec Let's Encrypt, nom de domaine et DNS
- Conteneurisation avec Docker
- Sécurisation d'une application web : authentification, sessions, CSRF, CSP, chiffrement
- Sauvegarde et restauration des données
- Intégration continue avec GitHub Actions
- Automatisation : workflows n8n, puis scripts Python planifiés
- Intégration d'une API d'intelligence artificielle (Claude) avec sorties structurées
