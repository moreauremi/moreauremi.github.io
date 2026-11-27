---
titre: "RMutils : boîte à outils de maintenance Windows"
slug: rmutils
type: perso
domaine: infra
date: 2026-10
statut: "v1 publiée sur GitHub"
resume: "outil de maintenance Windows sur clé USB : mises à jour, diagnostic, nettoyage, réparation et sauvegarde."
contexte: "dépanner un PC Windows demande toujours les mêmes gestes, dispersés entre plusieurs outils."
actions:
  - "réuni sept rubriques dans un menu au clavier, en un seul fichier .bat qui lance PowerShell"
  - "limité les risques : diagnostic en lecture seule, point de restauration avant chaque réparation"
  - "gardé une trace de chaque intervention : journal par session et rapports HTML sur la clé"
tags: [Batch, PowerShell, winget, DISM, SFC, B1.1, B1.2, B1.5]
liens:
  - { libelle: "github", url: "https://github.com/moreauremi/RMutils" }
ia: claude-code
illustrations:
  - { src: "schemas/rmutils-fonctionnement.svg", legende: "du double-clic sur la clé USB au rapport enregistré sur la clé" }
  - { src: "captures/rmutils/menu-principal.webp", legende: "menu principal : flèches pour naviguer, chiffres pour un accès direct" }
  - { src: "captures/rmutils/diagnostic.webp", legende: "diagnostic réseau : le premier test en échec indique où ça coince" }
---
