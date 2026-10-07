---
titre: Veille technologique
---

<!--
  Le sujet, les mots-clés et les sources de la veille se règlent dans
  content/site.config.js (rubrique « veille »). Les actualités sont ajoutées
  chaque semaine par scripts/veille.mjs : ce fichier contient la méthode et
  les synthèses personnelles.
-->

## Pourquoi ce sujet

Les PME industrielles sont devenues des cibles de choix : moins protégées que les grands groupes, elles dépendent pourtant de leurs systèmes informatiques et de leurs machines pour produire. En alternance chez un intégrateur d'ERP pour l'industrie, je vois chaque jour à quel point une entreprise s'arrête si ses outils sont indisponibles.

## Méthode

J'ai automatisé la collecte avec un outil que j'ai développé pour ce portfolio. Chaque lundi, une tâche GitHub Actions :

1. lit les flux RSS d'une douzaine de sources spécialisées (listées plus bas), dont le CERT-FR de l'ANSSI et Cybermalveillance.gouv.fr ;
2. garde les articles récents qui correspondent aux mots-clés du sujet (rançongiciel, NIS 2, vulnérabilité, systèmes industriels…) ;
3. demande à une IA (GitHub Copilot) de choisir les plus utiles, de les résumer en quelques phrases et de leur attribuer des tags ;
4. publie le résultat sur cette page, sans intervention de ma part.

Les tags permettent de suivre un thème dans la durée : un clic sur « rançongiciel » affiche toutes les actualités collectées sur ce thème depuis le début de la veille.

L'IA ne fait que trier et résumer : je lis les articles retenus, et l'article d'origine fait toujours foi.

## Mes synthèses

À venir.
