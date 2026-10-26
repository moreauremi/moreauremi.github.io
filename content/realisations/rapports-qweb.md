---
titre: "Rapports Open-Prod avec QWeb"
slug: rapports-qweb
type: entreprise  # entreprise, formation ou perso
date: 2026-10  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "en cours"  # ex. en cours, terminé, en pause
resume: "Formation de deux journées chez 1Life sur QWeb, le moteur de modèles d'Odoo sur lequel repose Open-Prod : création d'un rapport, modification d'un modèle de rapport existant, et recherche des données à afficher dans les tables SQL de la base."
technos:
  - "Open-Prod 10"
  - "Odoo"
  - "QWeb"
  - "XML"
  - "SQL"
  - "PostgreSQL"
competences: [B1.6]  # codes du référentiel, ex. [B1.1, B1.4]
brouillon: true  # visible avec npm run dev, absente du site publié : à retirer après la seconde journée, une fois la fiche complétée et relue par le tuteur
---

<!--
  Guide de rédaction
  - Rédigée d'après ce que Rémi a décrit de la première journée (15 octobre 2026) :
    création d'un rapport, modification d'un modèle de rapport, données retrouvées
    dans les tables SQL. Seconde journée prévue fin octobre 2026. Pas d'attestation.
  - Remplacer chaque [À COMPLÉTER] par le vrai contenu (ou supprimer la ligne).
    Une fois la fiche publiée, les repères restants et les sections vides
    n'apparaissent pas sur le site en ligne.
  - Captures : sur une base de démonstration, sans nom de client ni donnée réelle,
    avec l'accord du tuteur. Déposer l'image dans public/captures/rapports-qweb/, puis écrire
      ![Description de l'image](captures/rapports-qweb/nom-du-fichier.webp "Légende affichée")
    à la place de l'image provisoire « a-venir.svg » correspondante, ci-dessous.
  - competences : B1.6 (formation, développement professionnel). Ajouter B1.5 si un
    rapport est testé puis livré pour un vrai usage (tests d'acceptation, mise à
    disposition des utilisateurs).
-->

## Contexte

Les clients de 1Life produisent chaque jour avec Open-Prod des documents imprimables : devis, factures, bons de livraison… Ce sont des **rapports**, mis en page par **QWeb**, le moteur de modèles d'Odoo, sur lequel Open-Prod est construit. Savoir créer un rapport ou adapter un modèle existant permet de répondre aux **besoins d'un client** sans attendre un développeur : c'est l'objet de cette **formation de deux journées**, la première le 15 octobre 2026, la seconde fin octobre.

[À COMPLÉTER : qui a donné la formation, sur quelle base (démonstration ?), avec quels outils]

## Objectifs

- Comprendre comment un rapport est construit : son modèle QWeb et les données de l'ERP qu'il affiche.
- Créer un rapport.
- Modifier un modèle de rapport existant.
- Retrouver dans les tables SQL de la base les données à afficher.

## Mise en œuvre

Un rapport QWeb est un **modèle écrit en XML** : il décrit la mise en page du document et indique, par des instructions propres à QWeb (**boucles**, **conditions**, **champs à afficher**), où placer les données de l'ERP.

### Création d'un rapport

[À COMPLÉTER : quel rapport, pour quel document, quelles informations il affiche]

### Modification d'un modèle de rapport

[À COMPLÉTER : quel modèle (devis, facture…), ce qui a été changé, et comment la modification s'ajoute au modèle d'origine]

### Les données, dans les tables SQL

[À COMPLÉTER : comment les tables et les champs utiles ont été retrouvés (requêtes SQL sur la base PostgreSQL ?), et comment ils sont repris dans le rapport]

### Seconde journée

[À COMPLÉTER après la seconde journée, fin octobre 2026]

## Captures d'écran

![Emplacement réservé pour une capture du modèle QWeb du rapport créé](captures/a-venir.svg "Le modèle QWeb du rapport créé (capture à venir)")

![Emplacement réservé pour une capture du rapport modifié, en PDF](captures/a-venir.svg "Le rapport modifié, généré en PDF depuis une base de démonstration (capture à venir)")

## Résultats et tests

[À COMPLÉTER : ce qui a été vérifié (rapport généré en PDF, données affichées comparées à celles de l'ERP…), et avec quel résultat]

## Difficultés rencontrées

[À COMPLÉTER : problèmes rencontrés et solutions trouvées]

## Compétences mises en œuvre

- Lecture, création et modification d'un modèle de rapport QWeb (XML)
- Recherche des données d'un ERP dans une base de données relationnelle, avec SQL
