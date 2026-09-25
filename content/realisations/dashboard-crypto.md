---
titre: "Dashboard Crypto"
slug: dashboard-crypto
type: perso  # entreprise, formation ou perso
date: 2025  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "terminé"  # ex. en cours, terminé, en pause
resume: "Tableau de bord web en Python qui suit en temps réel le cours de six cryptomonnaies grâce à l'API CoinGecko, avec indicateurs clés, graphique interactif et alerte de prix personnalisable."
technos:
  - "Python"
  - "Streamlit"
  - "Pandas"
  - "Plotly"
  - "API CoinGecko"
competences: []  # codes du référentiel, ex. [C1, C4] (grille officielle à venir)
---

<!--
  Guide de rédaction
  - Remplacer chaque [À COMPLÉTER] par le vrai contenu (ou supprimer la ligne).
  - Captures : déposer l'image dans public/captures/dashboard-crypto/, puis écrire
      ![Description de l'image](captures/dashboard-crypto/nom-du-fichier.webp "Légende affichée")
    et supprimer l'image « a-venir.svg » ci-dessous.
  - competences : codes définis dans content/site.config.js, ex. [C1, C4]
  - Contenu technique rédigé d'après le code publié sur GitHub (app.py).
-->

## Contexte

[À COMPLÉTER : pourquoi ce projet, pour qui, avec quels moyens]

## Objectifs

Suivre en temps réel le cours d'une cryptomonnaie, le résumer en indicateurs clés, et être alerté dès que le prix dépasse un seuil choisi.

## Mise en œuvre

L'application est écrite en **Python** avec **Streamlit**, un framework qui transforme un script Python en application web.

- **Données** : l'API publique **CoinGecko** (gratuite, sans clé) fournit le prix en euros de six cryptomonnaies : Bitcoin, Ethereum, Dogecoin, Solana, Cardano et XRP. Les requêtes passent par la bibliothèque Requests.
- **Mise en cache** : chaque réponse de l'API est gardée 30 secondes, pour respecter sa limite d'environ 50 requêtes par minute et accélérer l'affichage.
- **Actualisation** : manuelle avec un bouton, ou automatique toutes les 60 secondes.
- **Historique** : les prix relevés sont conservés pendant la session et traités avec **Pandas** ; l'historique repart de zéro quand on change de cryptomonnaie.
- **Indicateurs clés (KPI)** : prix actuel, variation depuis le début de la session (en euros et en pourcentage), plus haut et plus bas.
- **Graphique** : courbe interactive **Plotly** de l'évolution du cours, avec la ligne du seuil d'alerte.
- **Alerte** : quand le prix dépasse le seuil défini par l'utilisateur, une notification s'affiche avec un message « signal de vente » ; sinon, l'écart restant sous le seuil est indiqué.
- **Gestion des erreurs** : délai de réponse dépassé, erreur réseau ou données invalides affichent un message clair au lieu d'interrompre l'application.

Code source (licence MIT) : [github.com/moreauremi/crypto-dashboard-pro](https://github.com/moreauremi/crypto-dashboard-pro)

## Captures d'écran

![Emplacement réservé : capture d'écran à venir](captures/a-venir.svg "[À COMPLÉTER : légende de la capture]")

## Résultats et tests

Le projet est terminé et son code est publié sur GitHub.

[À COMPLÉTER : ce qui a été vérifié (actualisation, alertes, comportement sans réseau…), et comment]

## Difficultés rencontrées

[À COMPLÉTER : problèmes rencontrés et solutions trouvées]

## Pistes d'amélioration

- Suivre davantage de cryptomonnaies, et les comparer entre elles
- Exporter les données en CSV ou Excel
- Afficher le cours sur plusieurs périodes (1 heure, 24 heures, 7 jours)
- Envoyer les alertes par e-mail ou Telegram
- Ajouter des indicateurs techniques (RSI, MACD)

## Compétences mises en œuvre

- Développement en Python (Streamlit, Pandas)
- Utilisation d'une API REST (CoinGecko) et gestion des erreurs réseau
- Visualisation de données (Plotly)
