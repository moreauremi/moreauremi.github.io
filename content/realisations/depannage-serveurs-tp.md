---
titre: "dépannage des serveurs Proxmox de la salle de TP"
slug: depannage-serveurs-tp
type: formation
domaine: infra
date: 2026-11-04
statut: "terminé"
resume: "serveurs Proxmox de la salle de TP inaccessibles : switch Cisco diagnostiqué, accès rétabli, procédure documentée."
contexte: "TP de BTS SIO : serveurs sans écran ni réseau, adresse IP inconnue. dépannage proposé au professeur."
actions:
  - "démarré par la console le switch Cisco bloqué au bootloader, puis activé PortFast"
  - "retrouvé le serveur par son adresse IPv6 lien local, calculée depuis sa MAC, et rétabli l'accès SSH"
  - "livré une documentation de dépannage et un script PowerShell pour les deux autres POD"
tags: [Cisco IOS, Proxmox, IPv6, Wireshark, PowerShell, B1.1, B1.2, B1.5]
ia: claude
documents:
  - { libelle: "accès sans écran au serveur Proxmox du POD02 (PDF, 14 pages)", url: "docs/depannage-serveurs-tp/documentation-acces-serveur-pod02.pdf" }
  - { libelle: "Get-InfosPod.ps1 (script PowerShell, pour POD01 et POD03)", url: "docs/depannage-serveurs-tp/Get-InfosPod.ps1" }
illustrations:
  - { src: "captures/depannage-serveurs-tp/baie-pod02.webp", legende: "la baie du POD02 : switch Catalyst 2960-XR et routeur Cisco 1921" }
  - { src: "captures/depannage-serveurs-tp/facade-switch.webp", legende: "la façade du switch : LED SYST, port MGMT et ports console" }
  - { src: "captures/depannage-serveurs-tp/get-netadapter.webp", legende: "repérer la vraie carte Ethernet parmi les cartes virtuelles" }
---
