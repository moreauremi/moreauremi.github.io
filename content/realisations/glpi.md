---
# Gabarit d'une réalisation (le même pour toutes les fiches).
# Textes en minuscules, sauf noms propres et sigles. Phrases courtes.
#   type     formation, entreprise ou perso (section de la page projets)
#   domaine  applicatif (dev, SQL, paramétrage ERP) ou infra : l'applicatif
#            est affiché en premier dans chaque section
#   resume   une phrase, 20 mots au plus
#   contexte une ligne
#   actions  « ce que j'ai fait » : 3 puces au plus
#   tags     compétences (technos, notions, codes du référentiel B1.x)
#   liens    GitHub, démo… (la fiche détaillée est toujours liée)
#   ia       facultatif : clé d'une mention de « mentionsIa » (site.config.js)
#   documents, illustrations : facultatifs, affichés sur la fiche détaillée
# Un texte inconnu s'écrit [À COMPLÉTER : …] : surligné avec npm run dev,
# retiré du site publié.
titre: "GLPI : gestion des tickets sur un serveur Debian"
slug: glpi
type: formation
domaine: infra
date: 2026-09
statut: "terminé"
resume: "installation de GLPI 11 sur un serveur Debian 13, puis traitement de tickets de bout en bout."
contexte: "TP de BTS SIO, en lab sur une machine virtuelle VirtualBox."
actions:
  - "monté un serveur Debian 13 avec Apache, PHP-FPM et MariaDB, puis installé et sécurisé GLPI 11"
  - "traité des tickets avec trois profils : création, qualification, priorisation, solution, clôture"
  - "rédigé trois documentations pas à pas : Debian, GLPI, utilisation"
tags: [Debian, Apache, PHP, MariaDB, GLPI, ITIL, B1.1, B1.2, B1.5]
documents:
  - { libelle: "installation de Debian 13 sur VirtualBox (PDF, 4 pages)", url: "docs/glpi/installation-debian-virtualbox.pdf" }
  - { libelle: "installation de GLPI 11 sur Debian 13 (PDF, 8 pages)", url: "docs/glpi/installation-glpi-debian.pdf" }
  - { libelle: "TP GLPI : utilisation et gestion des tickets (PDF, 10 pages)", url: "docs/glpi/tp-glpi-tickets.pdf" }
illustrations:
  - { src: "captures/glpi/installation-web.webp", legende: "GLPI joint depuis le PC hôte, par la redirection du port 8080 vers la VM" }
  - { src: "captures/glpi/qualification-ticket.webp", legende: "qualification : urgence moyenne et impact bas donnent une priorité basse" }
  - { src: "captures/glpi/liste-des-tickets.webp", legende: "les tickets du scénario, avec leur statut et leur priorité" }
---
