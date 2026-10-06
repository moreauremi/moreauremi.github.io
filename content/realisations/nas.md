---
titre: "NAS Homelab"
slug: nas
type: perso  # entreprise, formation ou perso
date: 2026  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "en cours"  # ex. en cours, terminé, en pause
resume: "Stockage réseau auto-hébergé sur mon homelab Proxmox, accessible à distance par VPN avec Tailscale, en alternative aux services de stockage en ligne payants."
technos:
  - "Proxmox"
  - "Linux"
  - "Tailscale"
  - "[À COMPLÉTER : logiciel du NAS]"
competences: []  # codes du référentiel, ex. [C1, C4] (grille officielle à venir)
---

<!--
  Guide de rédaction
  - Remplacer chaque [À COMPLÉTER] par le vrai contenu (ou supprimer la ligne).
  - Captures : déposer l'image dans public/captures/nas/, puis écrire
      ![Description de l'image](captures/nas/nom-du-fichier.webp "Légende affichée")
    et supprimer l'image « a-venir.svg » ci-dessous.
  - competences : codes définis dans content/site.config.js, ex. [C1, C4]
-->

## Contexte

Plutôt que de payer un service de stockage en ligne, je voulais héberger moi-même mes fichiers. Le NAS fait partie de mon homelab auto-hébergé : il tourne sur le même hyperviseur Proxmox que mon serveur multimédia Jellyfin.

[À COMPLÉTER : matériel et disques utilisés, budget]

## Objectifs

Disposer d'un espace de stockage centralisé, hébergé chez moi, et accessible depuis n'importe où.

## Mise en œuvre

- **Hébergement** : le NAS est hébergé sur l'hyperviseur **Proxmox** du homelab, qui fait tourner à la fois des conteneurs Docker et des machines virtuelles ;
- **Accès à distance** : par VPN, avec **Tailscale**. Tailscale crée un réseau privé chiffré entre mes appareils et le homelab : le NAS est accessible à distance comme s'il se trouvait sur le réseau local.

![Schéma d'architecture du homelab : mes appareils (navigateur web, application Swiftfin), chez moi comme à distance, rejoignent le homelab par le VPN Tailscale, un réseau privé chiffré, sans que le serveur soit exposé sur Internet. Le homelab est un vieux PC récupéré sous Proxmox VE, qui fait tourner Jellyfin (bibliothèque de vidéos) et le NAS (stockage de fichiers), répartis entre conteneurs Docker et machines virtuelles.](schemas/homelab-architecture.svg "Architecture du homelab, dont le NAS fait partie")

[À COMPLÉTER : logiciel ou service utilisé pour le NAS, organisation des disques (RAID, sauvegardes), partages et droits d'accès]

## Captures d'écran

![Emplacement réservé : capture d'écran à venir](captures/a-venir.svg "[À COMPLÉTER : légende de la capture]")

## Résultats et tests

[À COMPLÉTER : ce qui a été vérifié (accès depuis l'extérieur, débits, droits d'accès…), et avec quel résultat]

## Difficultés rencontrées

[À COMPLÉTER : problèmes rencontrés et solutions trouvées]

## Compétences mises en œuvre

- Virtualisation avec Proxmox
- Mise en place d'un accès distant sécurisé par VPN (Tailscale)
