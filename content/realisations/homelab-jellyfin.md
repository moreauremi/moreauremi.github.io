---
titre: "Homelab Jellyfin"
slug: homelab-jellyfin
type: perso  # entreprise, formation ou perso
date: 2026-07  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "terminé"  # ex. en cours, terminé, en pause
resume: "Serveur multimédia auto-hébergé sous Proxmox : Jellyfin, Sonarr, Radarr et Prowlarr pour regarder films et séries depuis n'importe où, sans abonnement de streaming."
technos:
  - "Proxmox"
  - "Docker"
  - "Linux"
  - "Tailscale"
  - "Jellyfin"
  - "Sonarr"
  - "Radarr"
  - "Prowlarr"
  - "Real-Debrid"
  - "Swiftfin"
  - "VS Code"
  - "Claude Code"
competences: []  # codes du référentiel, ex. [C1, C4] (grille officielle à venir)
---

<!--
  Guide de rédaction
  - Remplacer chaque [À COMPLÉTER] par le vrai contenu (ou supprimer la ligne).
  - Captures : déposer l'image dans public/captures/homelab-jellyfin/, puis écrire
      ![Description de l'image](captures/homelab-jellyfin/nom-du-fichier.webp "Légende affichée")
    et supprimer l'image « a-venir.svg » ci-dessous.
  - competences : codes définis dans content/site.config.js, ex. [C1, C4]
-->

## Contexte

Je voulais arrêter de payer des abonnements aux plateformes de streaming en construisant ma propre solution. Point de départ : un vieux PC récupéré gratuitement, et un budget nul. Principale contrainte : ce matériel ancien limitait les capacités de virtualisation.

## Objectifs

Construire un « Netflix fait maison » : un serveur multimédia qui récupère films et séries à la demande et permet de les regarder depuis n'importe où.

## Mise en œuvre

J'ai d'abord découpé le projet en étapes clés, puis choisi l'architecture. Le serveur tourne sous **Proxmox**, un hyperviseur qui permet de faire fonctionner plusieurs services isolés sur une même machine : les services du homelab y sont répartis entre des **conteneurs Docker** et des **machines virtuelles**. L'accès à distance passe par un VPN, **Tailscale**, qui relie mes appareils au homelab par un réseau privé chiffré.

Rôle de chaque brique :

- **Prowlarr** centralise les sources de recherche (indexeurs) et les met à disposition de Sonarr et Radarr ;
- **Sonarr** (séries) et **Radarr** (films) recherchent et récupèrent les contenus demandés ;
- **Real-Debrid** fournit les fichiers depuis ses propres serveurs, à haute vitesse, au lieu de les télécharger en local (voir « Difficultés rencontrées ») ;
- **Jellyfin** organise la bibliothèque et diffuse les films et séries, dans le navigateur ou avec l'application **Swiftfin**.

[À COMPLÉTER : quels services tournent en conteneurs Docker et lesquels en machines virtuelles, comment Real-Debrid est relié à Jellyfin]

## Captures d'écran

![Emplacement réservé : capture d'écran à venir](captures/a-venir.svg "[À COMPLÉTER : légende de la capture]")

## Résultats et tests

Le projet est terminé et le serveur est opérationnel. Les tests d'utilisation ont fait apparaître trois limites :

- **Limite de téléchargement** : trop de demandes de films rapprochées peuvent entraîner un blocage ;
- **Temps de lancement** : une vidéo met 10 à 15 secondes à démarrer ;
- **Langue** : la version française n'est pas disponible pour tous les films et séries.

## Difficultés rencontrées

Au départ, sans Real-Debrid, le serveur téléchargeait les films en temps réel par torrent, souvent en REMUX 4K UHD, c'est-à-dire avec la qualité du disque d'origine et sans limitation de débit. Un film pesait alors environ 40 Go : le téléchargement prenait beaucoup de temps avant de pouvoir le regarder.

Solution : passer par Real-Debrid. Au lieu de télécharger les torrents moi-même, le serveur utilise la bibliothèque déjà disponible sur les serveurs de Real-Debrid, téléchargeable à haute vitesse.

## Compétences mises en œuvre

- Mise en place d'un serveur, virtualisé avec Proxmox
- Conteneurisation des services avec Docker
- Accès distant sécurisé par VPN (Tailscale)
- Configuration et sécurisation du réseau
