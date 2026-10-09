---
titre: Veille technologique
---

<!--
  Rubrique « Veille technologique » : trois sujets, un onglet chacun.
  Les sujets, leurs mots-clés et leurs sources se règlent dans
  content/site.config.js (veille.sujets). Chaque sujet a son dossier
  content/veille/<id>/ :
    sujet.md          pourquoi ce sujet
    syntheses.md      mes synthèses (écrites depuis https://veille.remim.me)
    actualites.json   actualités ajoutées chaque lundi par scripts/veille.mjs
  Ce fichier contient ce qui est commun aux trois sujets : la méthode.
-->

Je suis trois sujets, liés à mon alternance et à mes projets : la sécurité des entreprises industrielles, la virtualisation qui fait tourner leurs serveurs, et la réforme de la facturation électronique, qui change leurs logiciels de gestion.

## Méthode

Chaque lundi, un outil que j'ai développé pour ce portfolio lit une trentaine de sources spécialisées (dont le CERT-FR de l'ANSSI), puis une IA (GitHub Copilot) choisit pour chaque sujet les articles les plus utiles, les résume et leur attribue des tags. Je lis ensuite les articles retenus, puis j'écris mes synthèses : ce que j'en retiens, ce que ça change pour les entreprises, ce que j'en fais.
