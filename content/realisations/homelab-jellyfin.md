---
titre: "Homelab Jellyfin"
slug: homelab-jellyfin
type: perso  # entreprise, formation ou perso
date: 2026-07  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "terminé"  # ex. en cours, terminé, en pause
resume: "Serveur multimédia auto-hébergé sous Proxmox : Jellyfin diffuse mes propres vidéos, accessibles depuis n'importe où par un VPN Tailscale."
technos:
  - "Proxmox"
  - "Docker"
  - "Linux"
  - "Tailscale"
  - "Jellyfin"
  - "Swiftfin"
  - "VS Code"
  - "Claude Code"
competences: []  # codes du référentiel, ex. [B1.1, B1.4]
---

<!--
  Guide de rédaction
  - Remplacer chaque [À COMPLÉTER] par le vrai contenu (ou supprimer la ligne).
  - Captures : déposer l'image dans public/captures/homelab-jellyfin/, puis écrire
      ![Description de l'image](captures/homelab-jellyfin/nom-du-fichier.webp "Légende affichée")
    et supprimer l'image « a-venir.svg » ci-dessous.
    Ne montrer que des vidéos personnelles dans les captures (pas d'affiches de
    films ou de séries du commerce).
  - competences : codes définis dans content/site.config.js, ex. [B1.1, B1.4]
-->

## Contexte

Je voulais centraliser mes propres vidéos et pouvoir les regarder depuis n'importe où, sans dépendre d'un service en ligne. Point de départ : un vieux PC récupéré gratuitement, et un budget nul. Principale contrainte : ce matériel ancien limitait les capacités de virtualisation.

## Objectifs

Construire un serveur multimédia personnel, une sorte de « Netflix fait maison » pour mes propres vidéos : une bibliothèque organisée, consultable depuis n'importe quel appareil, chez moi comme à distance.

## Mise en œuvre

J'ai d'abord découpé le projet en étapes clés, puis choisi l'architecture. Le serveur tourne sous **Proxmox**, un hyperviseur qui permet de faire fonctionner plusieurs services isolés sur une même machine : les services du homelab y sont répartis entre des **conteneurs Docker** et des **machines virtuelles**.

- **Jellyfin**, serveur multimédia libre, organise la bibliothèque de vidéos et les diffuse dans le navigateur ou avec l'application **Swiftfin** ;
- **Tailscale**, un VPN, relie mes appareils au homelab par un réseau privé chiffré : le serveur est accessible à distance sans être exposé sur Internet.

![Schéma d'architecture du homelab : mes appareils (navigateur web, application Swiftfin), chez moi comme à distance, rejoignent le homelab par le VPN Tailscale, un réseau privé chiffré, sans que le serveur soit exposé sur Internet. Le homelab est un vieux PC récupéré sous Proxmox VE, qui fait tourner Jellyfin (bibliothèque de vidéos) et le NAS (stockage de fichiers), répartis entre conteneurs Docker et machines virtuelles.](schemas/homelab-architecture.svg "Architecture du homelab")

[À COMPLÉTER : quels services tournent en conteneurs Docker et lesquels en machines virtuelles, où sont stockées les vidéos (sur le NAS ?), comment elles sont ajoutées à la bibliothèque]

## Captures d'écran

![Emplacement réservé : capture d'écran à venir](captures/a-venir.svg "[À COMPLÉTER : légende de la capture]")

## Résultats et tests

Le projet est terminé et le serveur est opérationnel.

[À COMPLÉTER : ce qui a été vérifié (lecture à distance par Tailscale, appareils testés, fluidité, transcodage…), et avec quel résultat]

## Difficultés rencontrées

[À COMPLÉTER : problèmes rencontrés et solutions trouvées (par exemple les limites du vieux PC)]

## Compétences mises en œuvre

- Mise en place d'un serveur, virtualisé avec Proxmox
- Conteneurisation des services avec Docker
- Accès distant sécurisé par VPN (Tailscale)
- Configuration et sécurisation du réseau
