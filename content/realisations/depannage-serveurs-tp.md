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

Comme j'avais de l'avance sur le TP, j'ai proposé au professeur de m'en occuper. Avec son accord, j'ai essayé de régler le problème sur le POD02, interventions sur le switch comprises, puis j'ai préparé de quoi refaire la démarche sur les deux autres POD.

## Objectifs

- Accéder au serveur depuis un poste, sans écran ni clavier sur le serveur.
- Retrouver sa configuration réseau : adresse IP, masque, port du switch.
- Documenter la démarche et la rendre reproductible pour POD01 et POD03.

## Documentation à télécharger

La documentation sert aussi de procédure si le problème revient : elle commence par une procédure rapide et un tableau « symptôme, cause, que faire », raconte ensuite le dépannage étape par étape, et se termine par un lexique et le récapitulatif des commandes.

- **Accès sans écran au serveur Proxmox du POD02** (PDF, 14 pages) : [ouvrir](docs/depannage-serveurs-tp/documentation-acces-serveur-pod02.pdf) ou [télécharger](docs/depannage-serveurs-tp/documentation-acces-serveur-pod02.pdf "Télécharger")
- **Get-InfosPod.ps1** (script PowerShell, pour POD01 et POD03) : [télécharger](docs/depannage-serveurs-tp/Get-InfosPod.ps1 "Télécharger")

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

**PortFast.** À chaque branchement, le protocole STP bloque le port environ 30 secondes, le temps de vérifier qu'il n'y a pas de boucle réseau. J'ai activé PortFast sur les ports du serveur et du poste (`spanning-tree portfast`), pour qu'ils transmettent tout de suite, puis j'ai sauvegardé la configuration avec `write memory`. IOS l'enregistre sous la forme `spanning-tree portfast edge` : *edge* désigne un port relié à une machine, jamais à un autre switch.

**Trouver le serveur.** Wireshark ne montrait aucune requête ARP du serveur, qui m'aurait donné son IP. Sur le switch, `show mac address-table interface gi1/0/14` donnait sa MAC (un préfixe Dell), et ses compteurs ne montraient que 34 paquets reçus : un serveur qui n'a besoin de joindre personne reste presque muet.

**La solution : l'IPv6 lien local.** Sous Linux, chaque carte réseau a une adresse IPv6 « lien local » (fe80::…), même quand rien n'est configuré, et Debian, la base de Proxmox, la calcule à partir de la MAC (méthode EUI-64). Par exemple, une MAC fictive 00:11:22:33:44:55 donne fe80::211:22ff:fe33:4455. J'ai calculé l'adresse du serveur de la même façon, puis je me suis connecté en SSH depuis le PC Windows : `ssh root@fe80::…%12`, où 12 est le numéro de la carte Ethernet du PC. La commande `ip a` a donné l'adresse IPv4 du serveur, en /16, portée par vmbr0, le switch virtuel de Proxmox.

*Les adresses IP et MAC du réseau de l'école sont masquées dans cette fiche, sur les photos et dans les documents à télécharger.*

![Terminal SSH connecté au serveur POD02 : ip a affiche l'adresse IPv4 de vmbr0 et l'adresse IPv6 lien local, floutées](captures/depannage-serveurs-tp/ssh-ip-a.webp "Connecté en SSH au serveur : ip a donne son adresse (floutée)")

**Pour POD01 et POD03.** Un script PowerShell, Get-InfosPod.ps1 (à télécharger plus haut), refait toute la démarche depuis le PC Windows : il trouve la carte Ethernet, découvre le serveur en IPv6, lit sa configuration en SSH, interroge le switch par la console (option -Cisco), met le poste dans le bon sous-réseau (option -ConfigurerPC) et écrit un rapport.

Dépannage mené avec l'aide de **Claude** (IA), qui a aussi écrit le script et mis en forme la documentation. Mon rôle : faire les manipulations sur le matériel, faire les choix et tester.

## Résultats et tests

- **Switch** : démarré, ports actifs, tous dans le VLAN 1. PortFast est dans la configuration de démarrage (`show startup-config | include portfast`), qui est rechargée à chaque démarrage.
- **Serveur** : joint en IPv6 (`ping -6`), puis connexion SSH réussie (root@POD02). Son adresse IPv4 est maintenant connue et notée dans la documentation remise.
- **Interface web** : accès vérifié sur le port 8006 du serveur (https), depuis un poste placé dans le même sous-réseau /16.
- **Script** : vérifié en simulation (sans le matériel), à lancer plus tard sur POD01 et POD03. [À COMPLÉTER : résultat du script sur POD01 et POD03]

## Difficultés rencontrées

**Un adaptateur Ethernet invisible sur le Mac.** Le Mac ne voyait pas l'adaptateur USB-C vers RJ45 : les « Ethernet Adapter » listés par `networksetup -listallhardwareports` étaient des interfaces virtuelles d'Apple Silicon. Sous Windows, le même type d'adaptateur est reconnu sans pilote (« Realtek USB FE Family Controller ») : j'ai continué sur un PC Windows. La commande `Get-NetAdapter` m'a aussi permis de repérer la bonne carte parmi les cartes virtuelles (VirtualBox, VPN).

![PowerShell : Get-NetAdapter liste Ethernet 5 (Realtek USB FE Family Controller, Up, 100 Mbps) et Ethernet 6 (VirtualBox Host-Only Ethernet Adapter)](captures/depannage-serveurs-tp/get-netadapter.webp "Repérer la vraie carte Ethernet parmi les cartes virtuelles")

**Des filtres Wireshark refusés.** `dhcp` et `udp.port == 67` passaient en rouge : je les tapais dans le filtre de capture, qui n'a pas la même syntaxe que le filtre d'affichage (`arp or udp port 67` d'un côté, `arp || dhcp` de l'autre). Solution : capturer sans filtre, puis filtrer à l'affichage.

**« Invalid input » sur le switch.** La configuration de PortFast était refusée : j'étais en mode utilisateur (`Switch>`), qui ne permet que de consulter. Il faut d'abord passer en mode privilégié avec `enable` (`Switch#`), puis `configure terminal`.

**Un serveur trop silencieux pour Wireshark.** Sans trafic à capturer, impossible de lire son IP dans les requêtes ARP. C'est ce qui m'a mené à l'IPv6 lien local, calculée à partir de la MAC lue sur le switch.

**Point resté ouvert.** Pourquoi le switch s'arrête-t-il au bootloader ? `show boot` écarte la piste du démarrage manuel (`Manual Boot : no`), et le chemin de l'image IOS est bien renseigné. En revanche, `Enable Break : yes` : un signal « Break » reçu par la console pendant le démarrage, par exemple au branchement d'un câble console, peut suffire à l'interrompre. Prochaine étape, avec l'accord du professeur : vérifier que l'image existe (`dir flash:`), désactiver cette option (`no boot enable-break`), puis tester un redémarrage (`reload`).

## Compétences mises en œuvre

- Diagnostic réseau méthodique, du physique au logique : LED, lien, VLAN, adressage, service
- Administration d'un switch Cisco par la console : bootloader, modes utilisateur et privilégié, VLAN, table MAC, STP et PortFast
- Adressage IPv4 (sous-réseau /16, IP fixe) et IPv6 lien local (EUI-64)
- Capture et filtrage du trafic avec Wireshark
- Accès SSH à un serveur Proxmox (Debian) et lecture de sa configuration réseau
- Automatisation d'une procédure avec PowerShell
- Rédaction d'une documentation technique et d'une procédure de dépannage réutilisable
