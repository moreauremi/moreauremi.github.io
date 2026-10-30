---
titre: "Reprise de données dans Open-Prod"
slug: reprise-donnees-open-prod
type: entreprise  # entreprise, formation ou perso
date: 2026-10  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "terminé"  # ex. en cours, terminé, en pause
resume: "Reprise de données sur ma base de test Open-Prod, après la formation MCD et reprise de données chez 1Life : catégories d'articles, articles (sans les obsolètes), gammes, nomenclatures, clients, prospects et fournisseurs, soit environ 1 100 lignes préparées dans Excel avec RECHERCHEV et RECHERCHEX, puis importées avec l'outil d'import d'Open-Prod."
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

J'ai repris les données de base d'une entreprise industrielle : catégories d'articles, articles, gammes, nomenclatures, clients, prospects et fournisseurs, soit environ **1 100 lignes** au total.

Les fichiers de départ sont ceux d'une **base école** fournie pour la formation : des données fictives qui reproduisent celles d'un vrai client.

## Objectifs

- Comprendre où va chaque information dans Open-Prod, à partir de son **modèle conceptuel de données** (MCD).
- Préparer des fichiers Excel au format attendu par l'import d'Open-Prod.
- Faire correspondre les fichiers entre eux pour que les données importées soient reliées correctement.
- Importer les données, puis vérifier le résultat dans l'ERP.

## Mise en œuvre

### Lecture du MCD

Le **MCD** représente les informations d'un système et les liens entre elles : par exemple, un article appartient à une catégorie, une commande est liée à un client. Le lire permet de savoir quelles données importer, et dans quel ordre : un article qui fait référence à une catégorie ne peut être importé qu'une fois la catégorie créée.

L'ordre d'import suit les liens entre les données :

1. **Catégories d'articles** : chaque article est rangé dans une catégorie, elle doit donc exister avant lui.
2. **Articles** : triés au préalable pour **ne pas reprendre les articles obsolètes**, qui ne servent plus et encombreraient la nouvelle base.
3. **Gammes** : la liste des opérations de fabrication d'un article (étapes, postes de travail, temps). Elles font référence aux articles.
4. **Nomenclatures** : la liste des composants nécessaires pour fabriquer un article. Elles relient des articles entre eux, donc tous doivent déjà être importés.
5. **Clients, prospects et fournisseurs**.

Pour le tri des articles, je me suis appuyé sur leur **statut** dans le fichier de départ : *en développement*, *en vie* ou *obsolète*. J'ai choisi de reprendre tous les articles sauf les obsolètes : ceux en développement seront bientôt fabriqués, il faut donc qu'ils existent dans le nouvel ERP.

### Préparation et mise en correspondance des fichiers

Les données de départ sont réparties dans plusieurs fichiers Excel. Pour les relier, j'ai utilisé **RECHERCHEV** et **RECHERCHEX** : ces fonctions cherchent une valeur (un code client, une référence article…) dans un autre fichier et ramènent l'information correspondante.

[À COMPLÉTER : un exemple concret de correspondance (quel fichier, quelle colonne, quelle formule)]

### Import dans Open-Prod

L'import se fait avec l'**outil d'import d'Open-Prod** : on lui donne le fichier Excel, puis on associe chaque colonne du fichier au champ correspondant dans l'ERP (par exemple, la colonne « Référence » au champ référence de l'article). Cette étape s'appelle le **mappage des colonnes** : si une colonne est associée au mauvais champ, la donnée est importée au mauvais endroit.

Avant l'import, j'ai corrigé dans les fichiers les valeurs qui ne correspondaient pas à celles attendues par Open-Prod (voir les difficultés rencontrées). L'import n'a ensuite signalé **aucune erreur**.

## Captures d'écran

![Emplacement réservé pour une capture d'un fichier Excel préparé pour l'import](captures/a-venir.svg "Un fichier Excel préparé pour l'import, avec ses formules de correspondance (capture à venir)")

![Emplacement réservé pour une capture des données importées dans Open-Prod](captures/a-venir.svg "Les données importées dans Open-Prod, sur la base de test (capture à venir)")

## Résultats et tests

Environ **1 100 lignes** importées au total.

Un import sans erreur ne prouve pas que les données sont **utilisables** : un article peut être créé avec une nomenclature ou une gamme incomplète. Pour vérifier plus loin, nous avons choisi un article importé au hasard et **lancé sa production** dans Open-Prod. L'ordre de fabrication s'est créé avec ses composants (nomenclature) et ses opérations (gamme) : les données reprises fonctionnent ensemble, pas seulement chacune de leur côté.

## Difficultés rencontrées

**Valeurs en français, attendues en anglais.** Dans les catégories de ressources (les moyens utilisés par les gammes), le fichier de départ indiquait « Humaine » et « Machine », alors qu'Open-Prod attend les valeurs techniques anglaises `human` et `machine`. Importées telles quelles, ces lignes auraient été refusées ou mal classées. J'ai remplacé toutes les valeurs dans le fichier avec **Rechercher et remplacer** (Ctrl + H) dans Excel, avant l'import.

Ce problème montre qu'un fichier client lisible par un humain n'est pas forcément au format attendu par l'ERP : il faut comparer les valeurs du fichier avec celles qu'accepte chaque champ avant d'importer.

## Compétences mises en œuvre

- Lecture d'un modèle conceptuel de données (MCD)
- Préparation et mise en correspondance de données dans Excel (RECHERCHEV, RECHERCHEX)
- Tri des données à reprendre selon leur statut (articles obsolètes écartés)
- Mise au format attendu par l'ERP (valeurs techniques des champs)
- Import de données dans un ERP avec mappage des colonnes, dans l'ordre imposé par les liens entre les données
- Contrôle fonctionnel du résultat : lancement d'une production sur un article importé
