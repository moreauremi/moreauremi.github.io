---
titre: "Hermes Dashboard (dashu)"
slug: dashu
type: perso
domaine: applicatif
date: 2026-11
statut: "en service, version 1.0.0"
resume: "espace de travail auto-hébergé : notes, agenda Pronote et fichiers, installable en une commande, avec connecteur Claude."
contexte: "notes, tâches et agendas éparpillés entre école, alternance et perso : je voulais un seul outil, hébergé chez moi."
actions:
  - "écrit le cahier des charges : périmètre, modèle de données, sécurité, 14 critères d'acceptation"
  - "déployé sur mon homelab Proxmox (LXC, tunnel Cloudflare, Tailscale), sauvegarde nocturne vérifiée par restauration"
  - "piloté chaque évolution par pull request, avec 390 tests automatiques, jusqu'à la version 1.0.0"
tags: [Rust, htmx, SQLite, Proxmox, systemd, Cloudflare, Tailscale, GitHub Actions, B1.1, B1.4, B1.5]
liens:
  - { libelle: "github", url: "https://github.com/moreauremi/dashu" }
  - { libelle: "dashu.dev", url: "https://dashu.dev" }
ia: claude-code
illustrations:
  - { src: "schemas/dashu-architecture.svg", legende: "architecture : deux accès sans port ouvert, un conteneur LXC sur mon homelab" }
  - { src: "captures/dashu/dashboard.webp", legende: "dashboard de l'espace École : prochains cours, tâches du jour, notes récentes" }
  - { src: "captures/dashu/telephone.webp", legende: "sur iPhone, en application sur l'écran d'accueil" }
  - { src: "captures/dashu/restauration.webp", legende: "exercice de restauration sur le serveur, le 11 novembre 2026" }
---
