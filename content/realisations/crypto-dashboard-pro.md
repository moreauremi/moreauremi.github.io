---
titre: "Crypto Dashboard Pro"
slug: crypto-dashboard-pro
type: perso
domaine: applicatif
date: 2026-01
statut: "terminé"
resume: "tableau de bord web qui suit le cours de six cryptomonnaies, avec une alerte de seuil personnalisée."
contexte: "projet personnel en Python, publié sur GitHub en janvier 2026. [À COMPLÉTER : pourquoi ce projet]"
actions:
  - "récupéré les prix par l'API CoinGecko, avec un cache de 30 secondes et la gestion des erreurs réseau"
  - "calculé les indicateurs de la session avec Pandas et tracé le cours avec Plotly"
  - "ajouté une alerte quand le prix dépasse le seuil choisi"
tags: [Python, Streamlit, Pandas, Plotly, API REST, B1.4, B1.6]
liens:
  - { libelle: "github", url: "https://github.com/moreauremi/crypto-dashboard-pro" }
illustrations:
  - { src: "captures/crypto-dashboard-pro/tableau-de-bord.webp", legende: "prix sous le seuil : indicateurs de la session et courbe du cours" }
  - { src: "captures/crypto-dashboard-pro/alerte-seuil.webp", legende: "seuil dépassé : message « signal de vente » et notification" }
---
