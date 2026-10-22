---
titre: "Réseau de six machines virtuelles sous VirtualBox"
slug: reseau-vm-virtualbox
type: formation  # entreprise, formation ou perso
date: 2026-10  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "terminé"  # ex. en cours, terminé, en pause
resume: "Six machines virtuelles sous VirtualBox (Windows 11, Windows Server 2025, Ubuntu, Linux Mint, Kali) sur un même réseau NAT : installation, clonage avec Sysprep, adressage IP, tests de connectivité, pare-feu et instantanés."
technos:
  - "VirtualBox"
  - "Windows 11"
  - "Windows Server 2025"
  - "Ubuntu"
  - "Linux Mint"
  - "Kali Linux"
  - "Nmap"
competences: [B1.1, B1.5]  # codes du référentiel, ex. [B1.1, B1.4]
---

<!--
  Guide de rédaction
  - Captures : déposer l'image dans public/captures/reseau-vm-virtualbox/, puis écrire
      ![Description de l'image](captures/reseau-vm-virtualbox/nom-du-fichier.webp "Légende affichée")
  - competences : codes définis dans content/site.config.js, ex. [B1.1, B1.4]
  - Contenu rédigé d'après ma documentation (PDF dans public/docs/reseau-vm-virtualbox/) :
    guide pas à pas du TP, captures extraites de ce document (TP d'octobre 2026).
-->

## Contexte

TP de BTS SIO (bloc 1). Technicien stagiaire chez InfoServ, entreprise fictive, je dois créer six machines virtuelles sous VirtualBox, deux postes Windows, un serveur Windows et trois Linux, puis vérifier qu'elles communiquent sur un même réseau.

J'en ai tiré un guide pas à pas : il reprend le sujet dans l'ordre, avec les clics à faire, un point de contrôle et une capture à chaque étape, et un tableau de dépannage.

## Objectifs

- Préparer VirtualBox : virtualisation matérielle, Extension Pack et réseau NAT dédié.
- Installer chaque système à la main, sans l'installation automatique de VirtualBox, avec des noms normalisés.
- Créer le second poste Windows par clonage, proprement, avec Sysprep.
- Donner une adresse fixe au serveur, laisser les postes en DHCP, puis tester le réseau.
- Sauvegarder chaque VM par un instantané et vérifier la restauration.

## Les machines

Toutes sont rangées dans le groupe TP-OS-MOREAU, avec des disques à allocation dynamique, et branchées sur le réseau NAT **RN-TPOS** (192.168.50.0/24, DHCP activé).

| VM | Système | Adresse IP |
|---|---|---|
| WIN-CLI-01 | Windows 11 Professionnel | 192.168.50.3 (DHCP) |
| WIN-CLI-02 | Windows 11 Professionnel, clone du premier | 192.168.50.4 (DHCP) |
| WIN-SRV-01 | Windows Server 2025 Standard (Expérience de bureau) | 192.168.50.10 (fixe) |
| LNX-UBU-01 | Ubuntu Desktop 26.04 LTS | 192.168.50.6 (DHCP) |
| LNX-MINT-01 | Linux Mint 22.3 Cinnamon | 192.168.50.7 (DHCP) |
| LNX-KALI-01 | Kali Linux 2026.2 (Xfce) | 192.168.50.8 (DHCP) |

![Gestionnaire de réseau de VirtualBox, onglet NAT Networks : réseau RN-TPOS, préfixe IPv4 192.168.50.0/24, case Enable DHCP cochée](captures/reseau-vm-virtualbox/reseau-nat-rn-tpos.webp "Le réseau NAT RN-TPOS, partagé par les six VM")

## Mise en œuvre

**Préparer VirtualBox.** Virtualisation matérielle vérifiée dans le Gestionnaire des tâches, VirtualBox 7.2 et son Extension Pack du même numéro de version, dossier des VM sur le disque le plus libre, puis le réseau RN-TPOS. Il faut choisir « Réseau NAT » et non « NAT » : en NAT simple, chaque VM a son propre réseau et ne voit pas les autres.

**Le premier poste Windows 11 (WIN-CLI-01).** La VM est en EFI, avec Secure Boot et TPM 2.0, exigés par Windows 11. Installation de l'édition Pro, compte local admin-local (option « Joindre le domaine à la place », qui évite le compte Microsoft), renommage du PC, Windows Update jusqu'à « Vous êtes à jour », puis un instantané 01-Installation-OK.

![Configuration de WIN-CLI-01, Système : TPM Version 2.0, UEFI et Secure Boot cochés](captures/reseau-vm-virtualbox/efi-secure-boot-tpm.webp "EFI, Secure Boot et TPM 2.0, exigés par Windows 11")

**Le second poste, par clonage (WIN-CLI-02).** Un clone brut garderait l'identité du premier poste. Sysprep (mode OOBE, « Généraliser », arrêt) la lui fait oublier avant un clone intégral, avec de nouvelles adresses MAC pour toutes les cartes. Au redémarrage, chaque poste refait sa première configuration, et le second est renommé.

![Bureau de WIN-CLI-01 avec l'outil Sysprep : Entrer en mode OOBE, Généraliser coché, Arrêter le système](captures/reseau-vm-virtualbox/sysprep.webp "Sysprep : OOBE, Généraliser, Arrêter")

**Le serveur (WIN-SRV-01).** Windows Server 2025 Standard, avec l'Expérience de bureau : sans elle, le serveur n'a pas d'interface graphique. Dans le Gestionnaire de serveur, rubrique Serveur local : nom, adresse fixe 192.168.50.10/24 (passerelle et DNS en 192.168.50.1) et fuseau horaire de Paris.

![Gestionnaire de serveur, Serveur local : nom WIN-SRV-01, adresse 192.168.50.10 et fuseau horaire UTC+01:00 surlignés](captures/reseau-vm-virtualbox/serveur-local.webp "Le serveur : nom, adresse fixe et fuseau horaire")

**Les trois Linux.** Chaque VM a 128 Mo de mémoire vidéo et un utilisateur etudiant.

- **Ubuntu Desktop** : installation normale, mise à jour complète (apt full-upgrade), prérequis des Guest Additions (build-essential, dkms, en-têtes du noyau) et serveur SSH actif.
- **Linux Mint** : miroirs de mise à jour les plus rapides en France, toutes les mises à jour, et un premier instantané système avec Timeshift, à ne pas confondre avec l'instantané VirtualBox, pris de l'extérieur.
- **Kali Linux** : Graphical install, partitionnement assisté sur tout le disque, bureau Xfce et outils par défaut, GRUB sur /dev/sda, puis mise à jour.

Chaque Linux a enfin son instantané 01-Installation-OK, comme WIN-CLI-01 et le serveur.

Documentation complète : [TP VirtualBox, guide pas à pas](docs/reseau-vm-virtualbox/tp-virtualbox-guide-pas-a-pas.pdf) (PDF, 48 pages, avec un tableau de dépannage).

## Résultats et tests

**Clonage.** Sur chaque poste, whoami /user et ipconfig /all : le SID machine (tout le SID sauf le dernier nombre) et l'adresse MAC sont différents sur les deux postes. Le clonage avec Sysprep a bien fonctionné.

![Invite de commandes de WIN-CLI-01 : whoami /user affiche le SID, ipconfig /all l'adresse physique 08-00-27-4B-CD-14](captures/reseau-vm-virtualbox/sid-mac-win-cli-01.webp "WIN-CLI-01 : SID et adresse MAC")

![Invite de commandes de WIN-CLI-02 : un SID différent et l'adresse physique 08-00-27-B4-37-8A](captures/reseau-vm-virtualbox/sid-mac-win-cli-02.webp "WIN-CLI-02 : un autre SID et une autre adresse MAC")

**Connectivité.** Trois VM allumées (WIN-SRV-01, un poste Windows et Kali). Depuis chacune, quatre pings :

- vers les deux autres VM : elles se voient sur RN-TPOS ;
- vers 8.8.8.8 : elles sortent sur Internet ;
- vers www.debian.org : la résolution de noms (DNS) fonctionne.

![Terminal de LNX-KALI-01 : ping vers 192.168.50.10, 8.8.8.8 et www.debian.org, tous avec 0 % de perte](captures/reseau-vm-virtualbox/pings-kali.webp "Depuis Kali : le serveur, Internet, puis un nom de domaine")

**Découverte du réseau.** Depuis Kali, un scan nmap -sn 192.168.50.0/24, limité au réseau du TP : utiliser ces outils sur un autre réseau est interdit (articles 323-1 et suivants du Code pénal). Il retrouve les VM allumées (.3, .8 et .10) et les adresses de VirtualBox lui-même.

![Terminal de LNX-KALI-01 : nmap -sn 192.168.50.0/24, 5 hôtes actifs, dont 192.168.50.3, 192.168.50.8 et 192.168.50.10](captures/reseau-vm-virtualbox/scan-nmap.webp "Scan de découverte, limité au réseau du TP")

**Restauration.** Sur LNX-UBU-01, un fichier test.txt créé sur le bureau, puis l'instantané 01-Installation-OK restauré : le fichier a disparu, la VM est revenue à l'état de l'instantané.

![Liste des VM de VirtualBox : le groupe TP-OS-MOREAU, avec WIN-CLI-02, WIN-SRV-01, WIN-CLI-01, LNX-UBU-01 et LNX-MINT-01 éteintes, la plupart sur leur instantané 01-Installation-OK](captures/reseau-vm-virtualbox/groupe-tp-os.webp "Le groupe TP-OS-MOREAU dans VirtualBox")

## Difficultés rencontrées

**Sysprep bloqué par BitLocker.** Sysprep refusait de valider l'installation de Windows. Son journal (setupact.log, dans C:\Windows\System32\Sysprep\Panther) donnait la cause : BitLocker était actif sur le disque C:. Solution : manage-bde -off C: dans un terminal administrateur, attendre la fin du déchiffrement, puis relancer Sysprep. J'ai ajouté ce cas au guide et à son tableau de dépannage.

![Journal setupact.log de Sysprep, avec la ligne surlignée « Turn BitLocker off to run Sysprep »](captures/reseau-vm-virtualbox/sysprep-journal-bitlocker.webp "Le journal de Sysprep : BitLocker est actif sur C:")

**Des pings sans réponse vers Windows.** Les postes Windows et le serveur ne répondaient pas au ping, alors qu'ils étaient bien sur le réseau : le pare-feu Windows bloque par défaut les demandes d'écho ICMP entrantes. Solution : activer la règle « Partage de fichiers et d'imprimantes (Demande d'écho - Trafic entrant ICMPv4) », dans le pare-feu avec fonctions avancées de sécurité, ou en PowerShell avec Enable-NetFirewallRule -Name FPS-ICMP4-ERQ-In.

![Pare-feu Windows Defender avec fonctions avancées de sécurité, Règles de trafic entrant : menu contextuel « Activer la règle » sur une règle Partage de fichiers et d'imprimantes](captures/reseau-vm-virtualbox/regle-pare-feu-icmp.webp "Activation de la règle ICMPv4 entrante")

![Terminal de LNX-KALI-01 : un premier ping vers 192.168.50.10 perd 100 % des paquets, le second, après activation de la règle, reçoit les 4 réponses](captures/reseau-vm-virtualbox/ping-avant-apres-pare-feu.webp "Le ping vers le serveur, avant puis après la règle")

## Compétences mises en œuvre

- Virtualisation de postes et de serveurs avec VirtualBox : EFI, Secure Boot, TPM 2.0, disques dynamiques, réseau NAT
- Installation de systèmes Windows (client et serveur) et Linux (Ubuntu, Mint, Kali)
- Préparation d'un poste Windows au clonage avec Sysprep : SID et adresses MAC uniques
- Adressage IP : DHCP pour les postes, adresse fixe pour le serveur
- Tests de connectivité et de résolution de noms (ping), découverte du réseau (nmap) dans le cadre légal du TP
- Pare-feu Windows Defender : règle ICMPv4 entrante
- Sauvegarde et restauration par instantanés (VirtualBox, Timeshift)
- Rédaction d'une documentation technique pas à pas
