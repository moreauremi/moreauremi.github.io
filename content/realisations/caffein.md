---
titre: "WebApp — SaaS de facturation"
slug: caffein
type: perso  # entreprise, formation ou perso
date: 2026-01/2026-08  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "en pause"  # ex. en cours, terminé, en pause
resume: "SaaS de facturation pour micro-entrepreneurs et artisans du BTP, piloté par un assistant IA qui rend les outils CRM et ERP accessibles : il réalise à la place de l'utilisateur les tâches demandées dans le logiciel."
technos:
  - "Python"
  - "HTML"
  - "API Claude"
  - "Whisper"
  - "n8n"
  - "Claude Code"
  - "Hostinger"
  - "Linux"
  - "Nginx"
  - "DNS"
competences: []  # codes du référentiel, ex. [C1, C4] (grille officielle à venir)
---

<!--
  Guide de rédaction
  - Remplacer chaque [À COMPLÉTER] par le vrai contenu (ou supprimer la ligne).
  - Captures : déposer l'image dans public/captures/caffein/, puis écrire
      ![Description de l'image](captures/caffein/nom-du-fichier.webp "Légende affichée")
    et supprimer l'image « a-venir.svg » ci-dessous.
  - competences : codes définis dans content/site.config.js, ex. [C1, C4]
-->

## Contexte

Ce projet annexe, baptisé CAFFEIN, est né de mon intérêt pour les CRM, les ERP et l'intelligence artificielle, et de l'envie de réunir ces trois sujets. L'idée : permettre à des personnes peu à l'aise avec la technologie, ou qui manquent de temps, de réaliser des tâches plus ou moins complexes dans leur logiciel de gestion, simplement en les demandant. Il s'adresse aux micro-entrepreneurs et aux artisans du BTP.

## Objectifs

Construire un SaaS complet, centré sur un assistant IA capable de piloter les différents modules du logiciel.

## Mise en œuvre

L'application repose sur les briques suivantes :

- **Python** pour le code de l'application ;
- **HTML** pour l'interface web ;
- **l'API Claude** pour l'assistant IA, qui comprend les demandes de l'utilisateur et réalise les tâches correspondantes dans le logiciel ;
- **Whisper** pour la transcription de la voix en texte, afin de pouvoir s'adresser à l'assistant à l'oral ;
- **n8n**, un outil d'automatisation de workflows ;
- un **serveur Linux** hébergé chez **Hostinger**, avec **Nginx**, et un nom de domaine dédié configuré dans les **DNS** ;
- **Claude Code** comme assistant de développement pendant l'écriture du code.

![Schéma d'architecture de CAFFEIN : l'utilisateur, artisan du BTP ou micro-entrepreneur, écrit ou parle à l'assistant depuis son navigateur. Le nom de domaine mène au serveur Linux hébergé chez Hostinger, où Nginx sert l'application Python : interface web en HTML, assistant IA et modules facturation, CRM et ERP. À l'oral, l'API Whisper transcrit la voix en texte ; l'API Claude comprend la demande, puis l'assistant réalise la tâche dans le logiciel. n8n automatise des workflows.](schemas/caffein-architecture.svg "Architecture de CAFFEIN : parcours d'une demande, de l'utilisateur au logiciel")

[À COMPLÉTER : rôle précis de n8n et de Nginx, étapes du développement, modules réalisés (devis, factures, clients…), organisation du code, stockage des données]

## Captures d'écran

![Emplacement réservé : capture d'écran à venir](captures/a-venir.svg "[À COMPLÉTER : légende de la capture]")

## Résultats et tests

Le développement s'est déroulé de janvier à août 2026 ; le projet est aujourd'hui en pause.

Les tests se sont révélés complexes : tous les modules fonctionnent ensemble et l'assistant IA agit sur chacun d'eux. Un problème à un endroit peut donc faire dysfonctionner l'ensemble du logiciel.

## Difficultés rencontrées

Le coût : l'API Claude, l'API Whisper, le serveur et le nom de domaine sont tous payants. Piste retenue : auto-héberger le maximum de briques pour réduire ces coûts.

## Compétences mises en œuvre

- Développement en Python
- Mise en place et administration d'un serveur Linux chez Hostinger, avec Nginx
- Configuration d'un nom de domaine (DNS)
- Automatisation avec n8n
- Intégration d'API d'intelligence artificielle (Claude, Whisper)
