---
titre: "Flux de production avec sous-traitance dans Open-Prod"
slug: flux-production-sous-traitance
type: entreprise  # entreprise, formation ou perso
date: 2026-10-16  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "terminé"  # ex. en cours, terminé, en pause
resume: "Présentation à l'équipe des consultants et à la direction d'un flux complet dans Open-Prod, de la vente d'un sac aux factures : ordre de fabrication, achat du cuir et des boutons, trois ordres de travail dont le conditionnement sous-traité, déclarations de production sur tablette avec une douchette, livraisons et réceptions."
technos:
  - "Open-Prod 10"
  - "Odoo"
  - "MES"
  - "QWeb"
  - "Lecteur de codes-barres"
competences: [B1.5, B1.6]  # codes du référentiel, ex. [B1.1, B1.4]
---

<!--
  Guide de rédaction
  - Rédigée d'après ce que Rémi a décrit de sa présentation du 16 octobre 2026.
  - Remplacer chaque [À COMPLÉTER] par le vrai contenu (ou supprimer la ligne).
    Les repères restants et les sections vides n'apparaissent pas sur le site en ligne.
  - Le rapport PDF de l'ordre de travail : si c'est celui créé pendant la formation
    QWeb, le dire ici et dans la fiche rapports-qweb.md.
  - Captures : sur la base de démonstration, avec l'accord du tuteur. Déposer l'image
    dans public/captures/flux-production-sous-traitance/, puis écrire
      ![Description de l'image](captures/flux-production-sous-traitance/nom-du-fichier.webp "Légende affichée")
    à la place de l'image provisoire « a-venir.svg » correspondante, ci-dessous.
  - competences : B1.5 (flux testé de bout en bout, présenté aux futurs utilisateurs
    de la démonstration), B1.6 (développement professionnel). Ajouter B1.4 si la
    présentation a demandé une vraie préparation planifiée.
-->

## Contexte

Chez 1Life, les nouveaux consultants se forment sur Open-Prod avec des bases de démonstration avant d'intervenir chez les clients. Le 16 octobre 2026, j'ai présenté un flux complet dans Open-Prod à toute l'équipe des consultants, au directeur technique, au directeur de projet et au directeur de région : de la vente d'un produit fabriqué jusqu'à sa facture, avec une étape confiée à un sous-traitant.

Pour rendre le flux concret, un exemple simple : la fabrication et la vente d'un sac en cuir.

[À COMPLÉTER : pourquoi cette présentation (étape de la formation, demande du tuteur ?), sa durée, et le temps de préparation]

## Objectifs

- Dérouler dans Open-Prod un flux de production complet, de la vente à la facture.
- Y intégrer une étape sous-traitée : le conditionnement du produit.
- Montrer les deux façons de déclarer la production : la vue formulaire, et la vue MES pour tablette, avec une douchette.
- Expliquer chaque étape à des consultants et à la direction.

## Mise en œuvre

### Le scénario

Un client commande un sac. Pour le fabriquer, il faut du cuir et des boutons, achetés auprès de fournisseurs.

- **Nomenclature** : la liste des composants du sac, le cuir et les boutons.
- **Gamme** : la suite des opérations de fabrication, le micro-perçage puis le montage, avant le conditionnement : l'emballage du sac, confié à un sous-traitant.

[À COMPLÉTER : ce que j'ai dû créer ou paramétrer dans la base de démonstration (articles, fournisseurs, sous-traitant, postes de charge…)]

### Le déroulé dans Open-Prod

1. **La vente** : la commande du client pour le sac.
2. **L'ordre de fabrication (OF)**, créé en brouillon, puis validé.
3. **Le premier ordre de travail (OT)** : sa validation crée un ordre d'achat (OA) en brouillon pour les matières premières, le cuir et les boutons.
4. **L'achat des matières premières** : validation de l'ordre d'achat.
5. **Les déclarations de consommation et de production** du premier ordre de travail.
6. **Le deuxième ordre de travail.**
7. **Le troisième ordre de travail, sous-traité** : il déclenche un achat de sous-traitance, créé en brouillon, puis validé.
8. **L'aller-retour chez le sous-traitant** : traitement du bon de livraison (BL), qui envoie le sac au sous-traitant, puis du bon de réception (BR) à son retour.
9. **La production finie** : le sac est terminé.
10. **La livraison au client** : traitement du bon de livraison de la vente.
11. **Les factures** : celle du fournisseur des matières premières, celle du sous-traitant et celle du client. Le flux est terminé.

Les déclarations de production se font de deux façons : dans la vue formulaire, et dans la **vue MES** (pour *Manufacturing Execution System*, le système de suivi de l'atelier), une vue simplifiée pour tablette, utilisée avec une **douchette**, le lecteur de codes-barres de l'atelier. L'ordre de travail a son rapport PDF, mis en page avec QWeb, avec des QR codes. Les mouvements de stock générés à chaque étape sont visibles dans Open-Prod.

[À COMPLÉTER : à quoi servent les QR codes du rapport de l'ordre de travail]

## Captures d'écran

![Emplacement réservé pour une capture de la nomenclature et de la gamme du sac](captures/a-venir.svg "La nomenclature et la gamme du sac : micro-perçage, montage, conditionnement sous-traité (capture à venir)")

![Emplacement réservé pour une capture de la vue MES sur tablette](captures/a-venir.svg "La vue MES, simplifiée pour tablette : déclarations de production avec la douchette (capture à venir)")

![Emplacement réservé pour une capture du rapport PDF de l'ordre de travail](captures/a-venir.svg "Le rapport PDF de l'ordre de travail, avec ses QR codes (capture à venir)")

![Emplacement réservé pour une capture des mouvements de stock](captures/a-venir.svg "Les mouvements de stock générés par le flux (capture à venir)")

## Résultats et tests

Le flux a été déroulé de bout en bout devant l'équipe, de la commande du client jusqu'aux trois factures : fournisseur, sous-traitant et client.

[À COMPLÉTER : retours de l'équipe et de la direction]

## Difficultés rencontrées

[À COMPLÉTER : problèmes rencontrés pendant la préparation ou la présentation, et solutions trouvées]

## Compétences mises en œuvre

- Nomenclature et gamme d'un produit fabriqué, avec une opération sous-traitée
- Suivi d'un flux de bout en bout dans un ERP : vente, achats, production, stock et facturation
- Circuit de la sous-traitance : achat de sous-traitance, bons de livraison et de réception, facture du sous-traitant
- Déclarations de production en atelier : vue MES sur tablette et lecteur de codes-barres
- Présentation d'un processus métier à des consultants et à la direction
