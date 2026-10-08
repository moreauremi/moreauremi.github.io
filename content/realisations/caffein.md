---
titre: "CAFFEIN — facturation assistée par IA"
slug: caffein
type: perso  # entreprise, formation ou perso
date: 2026-01/2026-10  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "v2.0 publiée en open source"  # ex. en cours, terminé, en pause
resume: "Logiciel de gestion pour freelances, micro-entrepreneurs et TPE, où l'IA rédige devis et factures à partir d'une phrase : prototypé avec n8n, puis réécrit en Python (FastAPI, React), libre et auto-hébergé sur un serveur Linux derrière Nginx."
technos:
  - "Python"
  - "FastAPI"
  - "SQLite"
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

## Objectifs

- Créer un devis ou une facture à partir d'une simple phrase, par exemple « Mission logo pour Jean Martin, 800 €, livraison le 15 ».
- Automatiser les tâches répétitives : génération du PDF, envoi au client, relance des factures impayées, classement des justificatifs.
- Suivre la TVA à reverser et les cotisations URSSAF sans saisie supplémentaire : tout est déduit des factures et des justificatifs.
- Mettre le service en ligne sur un serveur Linux, de façon sécurisée et facile à maintenir.

## Mise en œuvre

**Version 1 : un prototype assemblé avec n8n (janvier à août 2026).** La première version reposait sur **n8n**, un outil d'automatisation par workflows. Une dizaine de workflows géraient l'envoi des factures, les relances, la génération des PDF (avec Gotenberg), la première connexion d'un utilisateur, les notifications et le paiement de l'abonnement (Stripe). Les données étaient stockées dans **Supabase**, les documents classés dans Google Drive, et l'IA passait par des nœuds OpenAI et Claude. Ce prototype a permis de construire les premières fonctions, mais il dépendait de nombreux services extérieurs et devenait difficile à tester.

**Version 2 : une réécriture libre et auto-hébergeable (publiée le 7 octobre 2026).** J'ai regroupé toute la logique dans une seule application :

- **Serveur** : une API en **Python** avec **FastAPI** et une base **SQLite**, dont le schéma évolue par migrations automatiques. Les PDF sont générés en Python (ReportLab).
- **Interface** : une application **React** (Vite, React Router, Recharts), servie par le même processus, en français ou en anglais, avec un thème clair ou sombre.
- **Assistant IA** : **l'API Claude** transforme une phrase en brouillon structuré (client, lignes, montants, dates), lit les factures fournisseurs déposées (PDF ou photo) pour en extraire le fournisseur, les montants, la catégorie et l'échéance, et rédige les relances. Sans clé API, une analyse locale prend le relais : le logiciel reste utilisable hors ligne et aucune donnée ne quitte le serveur.
- **Automatisations** : les workflows n8n sont remplacés par **8 scripts Python**, lancés par un planificateur intégré au serveur (toutes les minutes, chaque jour à heure fixe ou sur un événement) : traitement des justificatifs, génération des PDF, envoi des factures, relances d'impayés sur trois niveaux (rappel amical, relance ferme, mise en demeure), alertes TVA, emails d'accueil… Chaque exécution est historisée, et chaque email envoyé reste consultable dans une boîte d'envoi.
- **Modules** : devis et factures (numérotation continue, mentions légales, transformation d'un devis en facture, page en ligne pour le client), clients, justificatifs, suivi de la TVA, tableau de bord URSSAF (chiffre d'affaires encaissé, cotisations, plafond de la micro-entreprise et seuil de franchise de TVA), gestion des utilisateurs avec deux rôles (administrateur et membre).
- **Emails** : envoi par **SMTP** ; sans serveur mail configuré, les emails sont simulés.

**Mise en ligne et sécurité.**

- **Serveur Linux** : le service tourne sur un serveur Linux loué chez **Hostinger**, joignable par un nom de domaine dédié configuré dans les **DNS**.
- **Script d'installation** (Debian, Ubuntu, Fedora, RHEL, Arch, openSUSE) : il crée un utilisateur système dédié, installe le code dans /opt/caffein, la configuration dans /etc/caffein et les données dans /var/lib/caffein, puis déclare le service **systemd** caffein.service. Les mises à jour font une sauvegarde avant d'appliquer les migrations ; un second script désinstalle proprement.
- **Durcissement du service** : pas d'élévation de privilèges, système de fichiers en lecture seule sauf le dossier des données, dossier temporaire privé, redémarrage automatique en cas de panne.
- **Nginx en reverse proxy** : l'application n'écoute qu'en local (127.0.0.1:8000). **Nginx** reçoit le trafic, redirige HTTP vers HTTPS (certificat Let's Encrypt obtenu avec certbot), ajoute l'en-tête HSTS et limite la taille des fichiers envoyés.
- **Docker** : une alternative en conteneur, avec une image construite en deux étapes, un utilisateur non root et un contrôle de santé.
- **Sécurité de l'application** : mots de passe hachés (scrypt), sessions dans un cookie HttpOnly, limitation des tentatives de connexion par adresse IP, protection CSRF, en-têtes de sécurité (CSP stricte, anti-iframe), données sensibles des justificatifs chiffrées en AES-256-GCM.
- **Sauvegardes** : une commande sauvegarde la base, les documents et la clé de chiffrement dans une archive, et une autre la restaure ; la sauvegarde peut être planifiée chaque nuit avec cron.

**Claude Code** m'a assisté pendant l'écriture du code.

![Schéma d'architecture de CAFFEIN : le freelance décrit sa facture en une phrase depuis son navigateur. Le nom de domaine mène au serveur Linux hébergé chez Hostinger, où Nginx, en reverse proxy HTTPS, relaie la requête vers le service caffein.service (API FastAPI, interface React, 8 scripts planifiés qui remplacent n8n). L'API Claude transforme la phrase en brouillon, avec une analyse locale en repli. La facture et son PDF sont enregistrés dans les données locales (SQLite, justificatifs chiffrés), puis les scripts l'envoient au client final par SMTP et gèrent les relances.](schemas/caffein-architecture.svg "Architecture de CAFFEIN : parcours d'une demande, de la phrase à la facture envoyée")

Code source (licence AGPL-3.0) : [github.com/moreauremi/caffein](https://github.com/moreauremi/caffein)

## Captures d'écran

Captures de la version 2.0, sur l'instance de démonstration (données fictives).

![Assistant d'installation, étape 1 sur 3 : formulaire « Votre entreprise » (nom, mention légale, SIRET, adresse, email)](captures/caffein/installation.webp "Premier lancement : l'assistant d'installation crée l'entreprise puis le compte administrateur")

![Accueil : documents traités, TVA collectée, balance due, temps économisé, factures à encaisser, prochaines échéances et actualités](captures/caffein/accueil.webp "Accueil : chiffres clés, échéances à venir et ce que Caffein a fait en arrière-plan")

![Page Factures et devis : champ « Décrivez, Caffein rédige » avec des exemples de phrases, indicateurs d'encaissement et liste des factures](captures/caffein/factures.webp "Factures et devis : une phrase suffit pour générer le brouillon")

![Page Automatisations : état de l'IA, des emails et du planificateur, puis les scripts avec leur fréquence et leur dernière exécution](captures/caffein/automatisations.webp "Les scripts Python qui remplacent les workflows n8n, avec leur dernière exécution")

![Tableau de bord URSSAF : prochaine déclaration, chiffre d'affaires encaissé, cotisations, graphique mensuel et seuils de l'année](captures/caffein/urssaf.webp "Tableau de bord URSSAF : chiffre d'affaires à déclarer, cotisations et seuils de l'année")

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
