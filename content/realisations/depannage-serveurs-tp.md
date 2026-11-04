---
titre: "Dépannage des serveurs Proxmox de la salle de TP"
slug: depannage-serveurs-tp
type: formation  # entreprise, formation ou perso
date: 2026-11-04  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "terminé"  # ex. en cours, terminé, en pause
resume: "Les serveurs Proxmox de la baie de TP étaient inaccessibles (ni écran, ni réseau, adresse IP inconnue) : diagnostic du switch Cisco par la console, découverte du serveur par son adresse IPv6 lien local, accès SSH rétabli, puis un script PowerShell et une documentation pour les autres POD."
technos:
  - "Cisco IOS"
  - "Proxmox"
  - "Debian"
  - "Wireshark"
  - "PowerShell"
  - "netsh"
  - "Windows"
  - "Claude"
# B1.2 : incident sur les services réseau et système, traité de bout en bout.
# B1.1 : ressources recensées et identifiées (modèles, MAC, IP, ports),
#        continuité du service (démarrage du switch, PortFast, étiquetage).
# B1.5 : tests d'accès au serveur et mise à disposition pour le TP.
competences: [B1.1, B1.2, B1.5]  # codes du référentiel, ex. [B1.1, B1.4]
---

<!--
  Guide de rédaction
  - Captures : déposer l'image dans public/captures/depannage-serveurs-tp/, puis écrire
      ![Description de l'image](captures/depannage-serveurs-tp/nom-du-fichier.webp "Légende affichée")
  - competences : codes définis dans content/site.config.js, ex. [B1.1, B1.4]
  - Contenu rédigé d'après ma documentation (PDF dans public/docs/depannage-serveurs-tp/),
    dépannage du 4 novembre 2026. Photos prises sur place.
-->

## Contexte

TP de BTS SIO. Pour ce TP, nous avions besoin des serveurs installés dans la baie de la salle : un par POD (POD01, POD02 et POD03), chacun relié à son propre switch Cisco. Les serveurs venaient d'être mis en place, mais ils ne fonctionnaient pas : reliés à aucun réseau, sans écran, et personne ne connaissait leur adresse IP. Impossible de s'y connecter pour commencer le TP.

Comme j'avais de l'avance sur le TP, j'ai essayé de régler le problème sur le POD02, puis j'ai préparé de quoi refaire la démarche sur les deux autres POD.

## Objectifs

- Accéder au serveur depuis un poste, sans écran ni clavier sur le serveur.
- Retrouver sa configuration réseau : adresse IP, masque, port du switch.
- Documenter la démarche et la rendre reproductible pour POD01 et POD03.

## Le matériel

| Élément | Modèle | Rôle |
|---|---|---|
| Switch | Cisco Catalyst 2960-XR, IOS 15.2(5b)E | Relie les machines du POD |
| Serveur | Dell Precision Tower 5810, Proxmox VE | Hyperviseur du TP |
| Postes | MacBook, PC portable Windows | Postes d'administration, avec un adaptateur USB-C vers RJ45 et un câble console USB-série |

Le réseau du POD est isolé : pas de box ni de serveur DHCP, donc aucune adresse attribuée automatiquement.

![Baie du POD02 : switch Cisco Catalyst 2960-XR en haut, routeur Cisco 1921 en dessous, câble bleu du poste branché sur le switch](captures/depannage-serveurs-tp/baie-pod02.webp "La baie du POD02 : switch Catalyst 2960-XR et routeur Cisco 1921")

## Mise en œuvre

**Le principe.** Sans DHCP, un poste ne peut parler au serveur que s'il est dans le même sous-réseau que lui, avec une adresse IP fixe. Il fallait donc brancher un poste sur le switch et, avant tout, trouver l'adresse IP du serveur.

**Le switch, par la console.** Aucun voyant de port ne s'allumait et la LED SYST clignotait en vert : d'après la documentation Cisco, le switch était encore en autotest de démarrage (POST). Par le câble console (screen à 9600 bauds), j'ai vu qu'il restait bloqué sur l'invite `switch:` du bootloader, sans avoir chargé son système. La commande `boot` a chargé IOS et le switch a démarré. Avec `show interfaces status` (après `terminal length 0`, qui supprime la pagination) : aucun port désactivé, tous dans le VLAN 1, le serveur sur Gi1/0/14 et le poste sur Gi1/0/16.

![Façade du switch Cisco Catalyst 2960-XR : LED SYST, bouton MODE, ports MGMT et console RJ45, port console mini-USB](captures/depannage-serveurs-tp/facade-switch.webp "La façade du switch : LED SYST, port MGMT et ports console")

**PortFast.** À chaque branchement, le protocole STP bloque le port environ 30 secondes, le temps de vérifier qu'il n'y a pas de boucle réseau. J'ai activé PortFast sur les ports du serveur et du poste (`spanning-tree portfast`), pour qu'ils transmettent tout de suite.

**Trouver le serveur.** Wireshark ne montrait aucune requête ARP du serveur, qui m'aurait donné son IP. Sur le switch, `show mac address-table interface gi1/0/14` donnait sa MAC (64:00:6a:69:13:30, un préfixe Dell), et ses compteurs ne montraient que 34 paquets reçus : un serveur qui n'a besoin de joindre personne reste presque muet.

**La solution : l'IPv6 lien local.** Sous Linux, chaque carte réseau a une adresse IPv6 « lien local » (fe80::…), même quand rien n'est configuré, et Debian, la base de Proxmox, la calcule à partir de la MAC (méthode EUI-64). J'en ai déduit fe80::6600:6aff:fe69:1330, puis je me suis connecté en SSH depuis le PC Windows : `ssh root@fe80::6600:6aff:fe69:1330%12`, où 12 est le numéro de la carte Ethernet du PC. La commande `ip a` a donné l'adresse du serveur : **10.2.0.253/16**, portée par vmbr0, le switch virtuel de Proxmox.

![Terminal SSH connecté au serveur POD02 : ip a affiche vmbr0 en 10.2.0.253/16 et l'adresse IPv6 fe80::6600:6aff:fe69:1330](captures/depannage-serveurs-tp/ssh-ip-a.webp "Connecté en SSH au serveur : son IP est 10.2.0.253/16")

**Pour POD01 et POD03.** Un script PowerShell, [Get-InfosPod.ps1](docs/depannage-serveurs-tp/Get-InfosPod.ps1), refait toute la démarche depuis le PC Windows : il trouve la carte Ethernet, découvre le serveur en IPv6, lit sa configuration en SSH, interroge le switch par la console (option -Cisco), met le poste dans le bon sous-réseau (option -ConfigurerPC) et écrit un rapport.

Documentation complète : [Accès sans écran au serveur Proxmox du POD02](docs/depannage-serveurs-tp/documentation-acces-serveur-pod02.pdf) (PDF, 13 pages, avec un lexique et le récapitulatif des commandes).

Dépannage mené avec l'aide de **Claude** (IA), qui a aussi écrit le script et mis en forme la documentation. Mon rôle : faire les manipulations sur le matériel, faire les choix et tester.

## Résultats et tests

- **Switch** : démarré, ports actifs, tous dans le VLAN 1.
- **Serveur** : joint en IPv6 (`ping -6`), puis connexion SSH réussie (root@POD02). Son adresse, 10.2.0.253/16, est maintenant connue et notée.
- [À COMPLÉTER : **Interface web** : accès à https://10.2.0.253:8006 vérifié depuis un poste en 10.2.0.100/16]
- **Script** : vérifié en simulation (sans le matériel). [À COMPLÉTER : résultat du script sur POD01 et POD03]

## Difficultés rencontrées

**Un adaptateur Ethernet invisible sur le Mac.** Le Mac ne voyait pas l'adaptateur USB-C vers RJ45 : les « Ethernet Adapter » listés par `networksetup -listallhardwareports` étaient des interfaces virtuelles d'Apple Silicon. Sous Windows, le même type d'adaptateur est reconnu sans pilote (« Realtek USB FE Family Controller ») : j'ai continué sur un PC Windows. La commande `Get-NetAdapter` m'a aussi permis de repérer la bonne carte parmi les cartes virtuelles (VirtualBox, VPN).

![PowerShell : Get-NetAdapter liste Ethernet 5 (Realtek USB FE Family Controller, Up, 100 Mbps) et Ethernet 6 (VirtualBox Host-Only Ethernet Adapter)](captures/depannage-serveurs-tp/get-netadapter.webp "Repérer la vraie carte Ethernet parmi les cartes virtuelles")

**Des filtres Wireshark refusés.** `dhcp` et `udp.port == 67` passaient en rouge : je les tapais dans le filtre de capture, qui n'a pas la même syntaxe que le filtre d'affichage (`arp or udp port 67` d'un côté, `arp || dhcp` de l'autre). Solution : capturer sans filtre, puis filtrer à l'affichage.

**« Invalid input » sur le switch.** La configuration de PortFast était refusée : j'étais en mode utilisateur (`Switch>`), qui ne permet que de consulter. Il faut d'abord passer en mode privilégié avec `enable` (`Switch#`), puis `configure terminal`.

**Un serveur trop silencieux pour Wireshark.** Sans trafic à capturer, impossible de lire son IP dans les requêtes ARP. C'est ce qui m'a mené à l'IPv6 lien local, calculée à partir de la MAC lue sur le switch.

**Point resté ouvert.** Je n'ai pas identifié pourquoi le switch s'arrête au bootloader. Piste, avec l'accord du professeur : vérifier `show boot`, désactiver le démarrage manuel (`no boot manual`) et sauvegarder la configuration.

## Compétences mises en œuvre

- Diagnostic réseau méthodique, du physique au logique : LED, lien, VLAN, adressage, service
- Administration d'un switch Cisco par la console : bootloader, modes utilisateur et privilégié, VLAN, table MAC, STP et PortFast
- Adressage IPv4 (sous-réseau /16, IP fixe) et IPv6 lien local (EUI-64)
- Capture et filtrage du trafic avec Wireshark
- Accès SSH à un serveur Proxmox (Debian) et lecture de sa configuration réseau
- Automatisation d'une procédure avec PowerShell
- Rédaction d'une documentation technique
