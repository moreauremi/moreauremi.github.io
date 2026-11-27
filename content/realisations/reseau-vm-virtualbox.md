---
titre: "réseau de six machines virtuelles sous VirtualBox"
slug: reseau-vm-virtualbox
type: formation
domaine: infra
date: 2026-10
statut: "terminé"
resume: "six machines virtuelles Windows et Linux sur un même réseau NAT, clonées avec Sysprep et testées."
contexte: "TP de BTS SIO : technicien stagiaire chez InfoServ, une entreprise fictive."
actions:
  - "installé deux postes Windows 11, un Windows Server 2025 et trois Linux sur le réseau RN-TPOS"
  - "cloné le second poste avec Sysprep, puis vérifié que SID et adresses MAC diffèrent"
  - "testé ping, DNS et nmap, ouvert l'ICMP dans le pare-feu, restauré un instantané"
tags: [VirtualBox, Windows Server, Linux, Sysprep, Nmap, B1.1, B1.5]
documents:
  - { libelle: "TP VirtualBox, guide pas à pas (PDF, 48 pages)", url: "docs/reseau-vm-virtualbox/tp-virtualbox-guide-pas-a-pas.pdf" }
illustrations:
  - { src: "captures/reseau-vm-virtualbox/reseau-nat-rn-tpos.webp", legende: "le réseau NAT RN-TPOS, partagé par les six VM" }
  - { src: "captures/reseau-vm-virtualbox/sysprep-journal-bitlocker.webp", legende: "le journal de Sysprep : BitLocker actif sur C:, cause du blocage" }
  - { src: "captures/reseau-vm-virtualbox/ping-avant-apres-pare-feu.webp", legende: "le ping vers le serveur, avant puis après la règle ICMPv4" }
---
