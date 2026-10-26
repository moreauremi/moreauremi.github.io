---
titre: "Homelab sous Proxmox : Jellyfin, NAS et VM de projet partagée"
slug: homelab
type: perso  # entreprise, formation ou perso
date: 2026-07  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "en cours"  # ex. en cours, terminé, en pause
resume: "Mon homelab auto-hébergé sous Proxmox, sur un vieux PC récupéré : un serveur multimédia Jellyfin, un NAS pour mes fichiers, et une machine virtuelle accessible par Tailscale à mes camarades de classe, pour nos projets communs."
technos:
  - "Proxmox"
  - "Docker"
  - "Linux"
  - "Tailscale"
  - "Jellyfin"
  - "Swiftfin"
  - "[À COMPLÉTER : logiciel du NAS]"
  - "VS Code"
  - "Claude Code"
competences: [B1.1, B1.4, B1.5, B1.6]  # codes du référentiel, ex. [B1.1, B1.4]
# Adresses des deux fiches réunies ici (Homelab Jellyfin, NAS Homelab) : les
# liens déjà partagés vers elles mènent à cette fiche.
anciennesAdresses: [homelab-jellyfin, nas]
---

<!--
  Guide de rédaction
  - Fiche qui réunit les anciennes fiches « Homelab Jellyfin » et « NAS Homelab »,
    avec la machine virtuelle de projet partagée avec les camarades de classe.
  - Remplacer chaque [À COMPLÉTER] par le vrai contenu (ou supprimer la ligne).
    La fiche est publiée : les repères restants n'apparaissent pas sur le site
    en ligne (seulement avec npm run dev), une section vide non plus.
  - Captures : déposer l'image dans public/captures/homelab/, puis écrire
      ![Description de l'image](captures/homelab/nom-du-fichier.webp "Légende affichée")
    à la place de l'image provisoire « a-venir.svg » correspondante, ci-dessous.
    Ne montrer que des vidéos personnelles dans les captures (pas d'affiches de
    films ou de séries du commerce).
  - competences : codes définis dans content/site.config.js, ex. [B1.1, B1.4]
-->

## Contexte

Je voulais centraliser mes propres vidéos et mes fichiers, et pouvoir y accéder depuis n'importe où, sans dépendre d'un service en ligne payant. Point de départ : un **vieux PC récupéré** gratuitement, et un **budget nul**. Principale contrainte : ce matériel ancien limitait les capacités de virtualisation.

Le homelab sert aussi à mes cours : pour les projets de groupe du BTS, j'y ai créé une machine virtuelle à laquelle mes camarades de classe peuvent se connecter.

[À COMPLÉTER : disques utilisés pour le NAS]

## Objectifs

- Construire un **serveur multimédia personnel**, une sorte de « Netflix fait maison » pour mes propres vidéos, consultable depuis n'importe quel appareil, chez moi comme à distance.
- Disposer d'un **espace de stockage centralisé** (NAS), hébergé chez moi et accessible depuis n'importe où.
- Mettre à disposition de mes camarades de classe une **machine virtuelle commune**, pour travailler ensemble sur nos projets.
- Rendre tout cela accessible à distance **sans exposer le serveur sur Internet**.

## Mise en œuvre

J'ai d'abord découpé le projet en étapes clés, puis choisi l'architecture. Le serveur tourne sous **Proxmox**, un hyperviseur qui permet de faire fonctionner plusieurs services isolés sur une même machine : les services du homelab y sont répartis entre des **conteneurs Docker** et des **machines virtuelles**.

L'accès à distance passe par **Tailscale**, un VPN : il crée un **réseau privé chiffré** entre les appareils autorisés et le homelab. Les services sont joignables comme s'ils se trouvaient sur le réseau local, sans être exposés sur Internet.

![Schéma d'architecture du homelab : mes appareils (navigateur web, application Swiftfin), chez moi comme à distance, et les ordinateurs de mes camarades de classe rejoignent le homelab par le VPN Tailscale, un réseau privé chiffré, sans que le serveur soit exposé sur Internet. Le homelab est un vieux PC récupéré sous Proxmox VE, qui fait tourner Jellyfin (bibliothèque de vidéos), le NAS (stockage de fichiers) et une machine virtuelle de projet partagée avec mes camarades.](schemas/homelab-architecture.svg "Architecture du homelab")

[À COMPLÉTER : quels services tournent en conteneurs Docker et lesquels en machines virtuelles]

### Le serveur multimédia : Jellyfin

**Jellyfin**, serveur multimédia libre, organise la bibliothèque de vidéos et les diffuse dans le navigateur ou avec l'application **Swiftfin**, chez moi comme à distance par Tailscale.

[À COMPLÉTER : où sont stockées les vidéos (sur le NAS ?), comment elles sont ajoutées à la bibliothèque]

### Le stockage : le NAS

Plutôt que de payer un service de stockage en ligne, j'héberge moi-même mes fichiers : le NAS tourne sur le même hyperviseur Proxmox, et Tailscale le rend accessible à distance comme s'il était sur le réseau local.

[À COMPLÉTER : logiciel ou service utilisé pour le NAS, organisation des disques (RAID, sauvegardes), partages et droits d'accès]

### Une machine virtuelle partagée pour les projets de classe

Pour les projets en groupe du BTS SIO, j'ai mis en place sur le homelab une **machine virtuelle dédiée**, accessible par **Tailscale** : mes camarades de classe s'y connectent depuis leur ordinateur, et nous travaillons ensemble sur le même serveur pour nos projets communs, sans que rien soit exposé sur Internet.

[À COMPLÉTER : système installé sur la VM, projet(s) réalisé(s) dessus, nombre de camarades, comment l'accès leur est donné (partage de la machine dans Tailscale, comptes, droits) et ce à quoi ils ont accès]

## Captures d'écran

![Emplacement réservé pour une capture de l'interface de Proxmox](captures/a-venir.svg "Proxmox : les conteneurs et machines virtuelles du homelab (capture à venir)")

![Emplacement réservé pour une capture de la bibliothèque de vidéos dans Jellyfin](captures/a-venir.svg "Bibliothèque de vidéos dans Jellyfin (capture à venir)")

![Emplacement réservé pour une capture de la lecture à distance dans Swiftfin](captures/a-venir.svg "Lecture à distance dans l'application Swiftfin, par le VPN Tailscale (capture à venir)")

![Emplacement réservé pour une capture de l'interface d'administration du NAS](captures/a-venir.svg "Interface d'administration du NAS (capture à venir)")

![Emplacement réservé pour une capture de la VM de projet partagée dans Tailscale](captures/a-venir.svg "La VM de projet, partagée avec mes camarades dans Tailscale (capture à venir)")

## Résultats et tests

Le serveur multimédia est **terminé et opérationnel**. Le NAS est **en cours de mise en place**.

[À COMPLÉTER : ce qui a été vérifié pour Jellyfin (lecture à distance par Tailscale, appareils testés, fluidité, transcodage…) et pour le NAS (accès depuis l'extérieur, débits, droits d'accès…), et avec quel résultat]

[À COMPLÉTER : la VM de projet en pratique : le projet mené dessus et le nombre de camarades qui s'y sont connectés]

## Difficultés rencontrées

[À COMPLÉTER : problèmes rencontrés et solutions trouvées (par exemple les limites du vieux PC, ou l'ouverture de l'accès à mes camarades)]

## Compétences mises en œuvre

- Mise en place d'un serveur, virtualisé avec Proxmox
- Conteneurisation des services avec Docker
- Accès distant sécurisé par VPN (Tailscale)
- Mise à disposition d'une machine virtuelle à d'autres utilisateurs, pour un travail en équipe
- Configuration et sécurisation du réseau
