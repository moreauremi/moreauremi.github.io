---
titre: "Reprise de données dans Open-Prod"
slug: reprise-donnees-open-prod
type: entreprise  # entreprise, formation ou perso
date: 2026-10  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "terminé"  # ex. en cours, terminé, en pause
resume: "Reprise de données sur ma base de test Open-Prod, après la formation MCD et reprise de données chez 1Life : préparation de fichiers Excel, mise en correspondance des fichiers entre eux avec RECHERCHEV et RECHERCHEX, puis import dans l'ERP."
technos:
  - "Open-Prod 10"
  - "Odoo"
  - "Excel"
  - "MCD"
competences: [B1.5, B1.6]  # codes du référentiel, ex. [B1.1, B1.4]
brouillon: true  # visible avec npm run dev, absente du site publié : à retirer une fois la fiche complétée et relue par le tuteur
---

<!--
  Guide de rédaction
  - Rédigée d'après ce que Rémi a décrit : formation MCD et reprise de données
    chez 1Life (octobre 2026), puis une reprise refaite seul sur sa base de test.
  - Remplacer chaque [À COMPLÉTER] par le vrai contenu (ou supprimer la ligne).
    Une fois la fiche publiée, les repères restants et les sections vides
    n'apparaissent pas sur le site en ligne.
  - Captures : sur la base de test, avec des données fictives, sans nom de client
    ni donnée réelle, avec l'accord du tuteur. Déposer l'image dans
    public/captures/reprise-donnees-open-prod/, puis écrire
      ![Description de l'image](captures/reprise-donnees-open-prod/nom-du-fichier.webp "Légende affichée")
    à la place de l'image provisoire « a-venir.svg » correspondante, ci-dessous.
  - competences : B1.5 (données importées puis contrôlées dans l'ERP : tests
    d'intégration), B1.6 (formation, développement professionnel). Ajouter B1.4
    si la reprise a suivi un planning ou une méthode de projet.
-->

## Contexte

Quand une entreprise passe à Open-Prod, ses données existantes (clients, fournisseurs, articles, stocks…) sont souvent dans des fichiers Excel ou dans son ancien logiciel. Les transférer dans le nouvel ERP s'appelle la **reprise de données** : c'est une étape obligatoire de tout projet d'intégration, et une erreur à ce moment se retrouve ensuite dans toutes les commandes et factures.

Après une formation sur le sujet chez 1Life, j'ai refait une reprise complète sur ma base de test Open-Prod.

[À COMPLÉTER : quelles données ont été reprises (clients, articles, nomenclatures…), d'où venaient les fichiers de départ]

## Objectifs

- Comprendre où va chaque information dans Open-Prod, à partir de son **modèle conceptuel de données** (MCD).
- Préparer des fichiers Excel au format attendu par l'import d'Open-Prod.
- Faire correspondre les fichiers entre eux pour que les données importées soient reliées correctement.
- Importer les données, puis vérifier le résultat dans l'ERP.

## Mise en œuvre

### Lecture du MCD

Le **MCD** représente les informations d'un système et les liens entre elles : par exemple, un article appartient à une catégorie, une commande est liée à un client. Le lire permet de savoir quelles données importer, et dans quel ordre : un article qui fait référence à une catégorie ne peut être importé qu'une fois la catégorie créée.

[À COMPLÉTER : quelles parties du MCD ont servi, et l'ordre d'import retenu]

### Préparation et mise en correspondance des fichiers

Les données de départ sont réparties dans plusieurs fichiers Excel. Pour les relier, j'ai utilisé **RECHERCHEV** et **RECHERCHEX** : ces fonctions cherchent une valeur (un code client, une référence article…) dans un autre fichier et ramènent l'information correspondante.

[À COMPLÉTER : un exemple concret de correspondance (quel fichier, quelle colonne, quelle formule)]

### Import dans Open-Prod

[À COMPLÉTER : comment l'import a été fait dans Open-Prod, et les erreurs signalées au premier essai]

## Captures d'écran

![Emplacement réservé pour une capture d'un fichier Excel préparé pour l'import](captures/a-venir.svg "Un fichier Excel préparé pour l'import, avec ses formules de correspondance (capture à venir)")

![Emplacement réservé pour une capture des données importées dans Open-Prod](captures/a-venir.svg "Les données importées dans Open-Prod, sur la base de test (capture à venir)")

## Résultats et tests

[À COMPLÉTER : combien de lignes importées, comment le résultat a été contrôlé (comptage, vérification de quelques fiches dans l'ERP…), et avec quel résultat]

## Difficultés rencontrées

[À COMPLÉTER : problèmes rencontrés (formats, doublons, références introuvables…) et solutions trouvées]

## Compétences mises en œuvre

- Lecture d'un modèle conceptuel de données (MCD)
- Préparation et mise en correspondance de données dans Excel (RECHERCHEV, RECHERCHEX)
- Import de données dans un ERP et contrôle du résultat
