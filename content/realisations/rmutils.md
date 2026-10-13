---
titre: "RMutils — boîte à outils de maintenance Windows"
slug: rmutils
type: perso  # entreprise, formation ou perso
date: 2026-10  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "v1 publiée sur GitHub"  # ex. en cours, terminé, en pause
resume: "Outil de maintenance Windows qui tient sur une clé USB : un seul fichier .bat par version et un menu au clavier pour mettre à jour, diagnostiquer, nettoyer, réparer et sauvegarder un PC, avec une trace de chaque intervention (journaux, rapports HTML)."
technos:
  - "Batch (cmd.exe)"
  - "PowerShell"
  - "Windows Update (API COM)"
  - "winget"
  - "DISM"
  - "SFC"
  - "netsh"
  - "GitHub"
  - "Claude Code"
competences: [B1.1, B1.2, B1.5]  # codes du référentiel, ex. [B1.1, B1.4]
---

<!--
  Guide de rédaction
  - Captures : déposer l'image dans public/captures/rmutils/, puis écrire
      ![Description de l'image](captures/rmutils/nom-du-fichier.webp "Légende affichée")
  - competences : codes définis dans content/site.config.js, ex. [B1.1, B1.4]
  - Contenu rédigé d'après le dépôt GitHub (README, RMutils.bat, RMutils_Lite.bat,
    .gitignore, .gitattributes) : c'est la référence, le CV sera aligné dessus.
  - À ajouter quand c'est possible : une capture du menu et d'un rapport HTML
    (sur un PC sans données personnelles), et les PC sur lesquels l'outil a été testé.
-->

## Contexte

Dépanner un PC sous Windows demande souvent les mêmes gestes : installer les mises à jour, vérifier l'état des disques et de la batterie, faire de la place, réparer les fichiers système ou réinitialiser le réseau. Les outils existent dans Windows, mais ils sont dispersés entre les Paramètres, l'invite de commandes et PowerShell, et il faut connaître les bonnes commandes.

RMutils les réunit dans un seul outil, à copier sur une clé USB et à lancer sur n'importe quel PC, sans rien installer.

## Objectifs

- Lancer l'outil depuis une clé USB, sans installation : un seul fichier par version.
- Regrouper les opérations courantes de maintenance dans un menu utilisable au clavier.
- Proposer une version sans droits administrateur, pour les postes où l'on n'a pas ces droits.
- Garder une trace de chaque intervention : un journal par session, et des rapports enregistrés sur la clé dans un dossier par PC.
- Limiter les risques : diagnostic en lecture seule, et point de restauration avant chaque réparation.

## Mise en œuvre

**Deux versions.** RMutils.bat demande les droits administrateur au lancement (fenêtre UAC) et donne accès à tout. RMutils_Lite.bat fonctionne sans ces droits, avec des fonctions adaptées : liste des mises à jour en attente, nettoyage des fichiers du compte et des caches des navigateurs, cache DNS. Les deux partagent la même liste d'applications et les mêmes dossiers sur la clé.

**Sept rubriques dans le menu** de la version complète :

- **Mises à jour** : Windows Update sans passer par les Paramètres (recherche, téléchargement, puis installation une par une avec un statut pour chacune), et mise à jour silencieuse des applications avec winget.
- **Diagnostic**, sans rien modifier sur le PC : infos système (modèle, numéro de série, activation de Windows, processeur, mémoire, BIOS), santé des disques (SMART : température, usure des SSD, erreurs de lecture), capacité de la batterie, tests réseau dans l'ordre box, Internet, DNS puis web (le premier test en échec indique où ça coince), et un rapport HTML complet enregistré sur la clé.
- **Nettoyage** : fichiers temporaires, cache de Windows Update, miniatures, rapports d'erreurs, corbeille, puis nettoyage des composants Windows avec DISM.
- **Réparation**, avec un point de restauration créé avant chaque action : DISM /RestoreHealth puis sfc /scannow, réinitialisation de Windows Update et du réseau (Winsock, piles IPv4 et IPv6), vérification du disque avec chkdsk.
- **Sauvegarde et restauration** : les pilotes tiers, à exporter avant une réinstallation, et les profils Wi-Fi.
- **Installation** : un pack d'applications installées en silencieux avec winget, depuis une liste modifiable. Les applications déjà présentes sont ignorées.
- **Outils** : le mot de passe d'un réseau Wi-Fi enregistré, affiché avec son QR code directement dans le terminal, pour connecter un téléphone en le scannant.

**Un seul fichier, deux langages.** Le début du fichier est un script batch : cmd.exe vérifie les droits, se relance en administrateur si besoin, lance PowerShell puis s'arrête. PowerShell relit le même fichier et exécute tout ce qui suit le marqueur #PSBEGIN. Il n'y a donc qu'un fichier à copier, sans script .ps1 à côté que la stratégie d'exécution de PowerShell pourrait bloquer.

**Choix techniques.**

- Windows Update est piloté par son API COM, ce qui permet d'installer les mises à jour une par une et d'afficher un statut pour chacune.
- Le QR code est produit par un petit encodeur écrit en C#, compilé à la volée par PowerShell, puis dessiné avec des caractères de bloc.
- Les scripts sont en ASCII, sans accents, avec des fins de ligne Windows : cmd.exe gère mal l'UTF-8 et les fins de ligne Unix. Le fichier .gitattributes empêche Git de les convertir.

**Claude Code** m'a assisté pendant l'écriture du code.

![Schéma du fonctionnement de RMutils : la clé USB contient RMutils.bat, RMutils_Lite.bat et la liste d'applications. Sur le PC Windows, cmd.exe vérifie les droits et se relance en administrateur, puis PowerShell exécute le code placé après #PSBEGIN et affiche le menu au clavier. Le menu pilote les outils de Windows (Windows Update, winget, DISM et SFC, netsh et pnputil), et le journal, les rapports et les sauvegardes sont écrits sur la clé, dans un dossier par PC.](schemas/rmutils-fonctionnement.svg "Fonctionnement de RMutils : du double-clic sur la clé USB au rapport enregistré sur la clé")

Code source : [github.com/moreauremi/RMutils](https://github.com/moreauremi/RMutils)

## Résultats

- Première version publique sur GitHub le 12 octobre 2026, avec une documentation complète : fonctionnalités, utilisation, sécurité, fonctionnement et limites.
- Deux versions prêtes à l'emploi, qui partagent la même liste d'applications et les mêmes dossiers sur la clé.
- Chaque intervention laisse une trace sur la clé : un journal par session, nommé avec le nom du PC et la date, et pour chaque PC un dossier avec les rapports HTML, le rapport de batterie et les sauvegardes.

## Sécurité

- Les profils Wi-Fi exportés contiennent les mots de passe en clair : la clé est à traiter comme un support sensible.
- L'outil « Mot de passe Wi-Fi » affiche le mot de passe à l'écran, mais ne l'écrit jamais dans le journal.
- Les journaux et les rapports contiennent des informations sur les PC dépannés (nom, numéro de série, adresses IP et MAC). Le fichier .gitignore les exclut du dépôt, pour qu'ils ne soient jamais publiés.

## Difficultés rencontrées

**Tenir dans un seul fichier.** Un script PowerShell lancé par double-clic est souvent bloqué par la stratégie d'exécution de Windows. Solution retenue : un fichier batch qui contient aussi le code PowerShell, et que PowerShell relit lui-même.

**Les caractères spéciaux dans cmd.exe.** cmd.exe gère mal l'UTF-8 et les fins de ligne Unix. Solution retenue : des scripts entièrement en ASCII, avec des fins de ligne Windows protégées par le fichier .gitattributes.

**Lire la sortie de winget.** winget ne donne pas de résultat structuré : RMutils lit son tableau texte et repère les colonnes à partir de l'en-tête. Quand winget tronque un identifiant trop long, l'application est marquée « IGNORE » plutôt que de risquer de mettre à jour la mauvaise.

**La limite des points de restauration.** Windows refuse de créer un point de restauration si un autre a été créé dans les dernières 24 heures. RMutils lève cette limite le temps de la création, puis remet le réglage d'origine, et active la protection du système si elle était coupée.

## Limites connues

- Windows 10 et 11 uniquement.
- Selon le disque ou le contrôleur (boîtier USB, RAID), certaines infos SMART ne remontent pas.
- Les réseaux Wi-Fi d'entreprise, avec identifiant personnel, n'ont pas de mot de passe stocké : pas de QR code possible.
- Une application ouverte peut échouer à se mettre à jour : mieux vaut fermer les applications avant.

## Compétences mises en œuvre

- Maintenance d'un poste Windows : mises à jour, nettoyage, réparation des fichiers système (DISM, SFC), vérification des disques (chkdsk)
- Diagnostic matériel et réseau : SMART, batterie, tests de connectivité par étapes
- Sauvegarde et restauration : pilotes, profils Wi-Fi, points de restauration
- Déploiement d'applications avec winget
- Scripts batch et PowerShell, élévation des droits avec l'UAC
- Protection des données des PC dépannés et des mots de passe Wi-Fi
- Documentation et publication d'un projet sur GitHub
