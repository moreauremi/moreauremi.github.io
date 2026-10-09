---
titre: "Portfolio RémiOS — présence en ligne"
slug: portfolio-remios
type: perso  # entreprise, formation ou perso
date: 2026-09/2026-10  # AAAA, AAAA-MM, AAAA-MM-JJ ou période début/fin (ex. 2026-01/2026-08)
statut: "en ligne, en évolution"  # ex. en cours, terminé, en pause
resume: "Ce portfolio, pensé comme un système Linux : un site statique publié sur GitHub Pages avec son propre nom de domaine, référencé et mesuré sans cookie, avec une veille technologique automatisée et un tableau de bord pour écrire mes synthèses."
technos:
  - "JavaScript"
  - "HTML"
  - "CSS"
  - "Vite"
  - "Markdown"
  - "GitHub Pages"
  - "GitHub Actions"
  - "DNS"
  - "GoatCounter"
  - "GitHub Copilot"
  - "Docker"
  - "Nginx"
  - "Claude Code"
competences: [B1.3, B1.4, B1.5, B1.6]  # codes du référentiel, ex. [B1.1, B1.4]
---

<!--
  Guide de rédaction
  - Captures : déposer l'image dans public/captures/portfolio-remios/, puis écrire
      ![Description de l'image](captures/portfolio-remios/nom-du-fichier.webp "Légende affichée")
  - competences : codes définis dans content/site.config.js, ex. [B1.1, B1.4]
  - Contenu rédigé d'après le README du dépôt (choix techniques, qualité mesurée,
    veille, tableau de bord) : c'est la référence.
-->

## Contexte

L'épreuve E5 du BTS SIO demande un portfolio qui présente mes réalisations et les compétences du référentiel. Plutôt qu'un modèle tout fait, j'ai voulu un site qui reflète l'option SISR : RémiOS imite le démarrage d'un système Linux (écran GRUB, journal systemd), puis affiche un menu façon whiptail, avec un terminal caché.

C'est aussi ma présence en ligne de candidat : le jury, les recruteurs et mes contacts LinkedIn y arrivent par mon propre nom de domaine, remim.me.

## Objectifs

- Présenter mon parcours, mes réalisations et mes compétences, avec une vue rapide, sobre et imprimable, pour le jury.
- Publier un site public rapide, accessible, sécurisé et bien référencé, sans serveur à administrer.
- Le mettre à jour facilement : chaque page est un fichier Markdown, publié automatiquement.
- Tenir une veille technologique régulière sur trois sujets, et mesurer la fréquentation du site dans le respect du RGPD.

## Mise en œuvre

**Le site.** Il est statique et construit avec Vite. Un plugin que j'ai écrit convertit les fiches Markdown en HTML au moment de la construction, et vérifie chacune d'elles (champs obligatoires, compétences existantes, images présentes) : une fiche mal remplie bloque la publication. Le navigateur ne reçoit que du HTML, du CSS et un peu de JavaScript, sans bibliothèque extérieure ni police chargée chez un tiers.

**L'hébergement et le nom de domaine.**

- GitHub Pages sert le site en HTTPS, avec un certificat renouvelé automatiquement.
- Le domaine remim.me est géré chez Namecheap : des enregistrements A vers les serveurs de GitHub Pages, un CNAME pour www, et un autre pour dashboard.remim.me, le sous-domaine du tableau de bord.
- La publication est continue, avec GitHub Actions : à chaque envoi, vérification du code, construction, tests, puis mise en ligne. Une erreur arrête tout, et le site en ligne reste intact.
- Une version Docker est prête pour l'héberger sur mon homelab : une image construite en deux étapes, servie par Nginx avec des en-têtes de sécurité.

**La sécurité et le RGPD.** Une politique de sécurité du contenu (CSP) stricte empêche tout script extérieur de s'exécuter. Le site ne dépose aucun cookie, et ses mentions légales décrivent l'éditeur, l'hébergeur et le traitement des données (formulaire de contact, mesure d'audience).

**Le référencement.** Titre et description travaillés, données structurées schema.org (une fiche « personne » avec mon poste, mon école, mes liens GitHub et LinkedIn), plan du site (sitemap.xml), robots.txt qui écarte mon CV des moteurs de recherche (il contient mon numéro de téléphone), image d'aperçu pour les partages sur LinkedIn, et une icône aux formats demandés par Google.

**La mesure d'audience.** GoatCounter, un outil open source sans cookie, compte chaque page consultée. Pour garder la règle « aucun script extérieur », j'ai écrit l'envoi des pages vues moi-même au lieu de charger le script officiel. Rien n'est compté pour les robots, ni pour les navigateurs qui demandent à ne pas être suivis.

**La veille technologique.** Chaque lundi, une tâche GitHub Actions lit les flux RSS de 33 sources. GitHub Copilot choisit ensuite, pour chacun de mes trois sujets (cybersécurité des PME industrielles, virtualisation, facturation électronique), les articles les plus utiles, les résume et leur attribue des tags. Les actualités s'affichent dans la rubrique « Veille technologique », un onglet par sujet.

**Le tableau de bord** (dashboard.remim.me). C'est un second site statique, dans son propre dépôt, pour piloter le portfolio sans ouvrir d'éditeur de code :

- une vue d'ensemble : l'état de chaque veille (dernière synthèse, actualités à traiter, dernière collecte), le résultat de la dernière publication et de la dernière collecte, et les visites du site ;
- connexion par un jeton GitHub limité au dépôt du site et à deux droits : chaque synthèse enregistrée est un commit, qui republie le site ;
- reformulation d'un passage par l'IA : la page n'a pas de serveur, elle passe par un workflow GitHub Actions, sans jamais exposer le secret de l'IA ;
- choix des actualités citées en sources, et retrait d'une actualité hors sujet ;
- ancienneté de la dernière synthèse de chaque sujet, avec un rappel par e-mail (issue GitHub) si un sujet n'a rien depuis trois semaines ;
- visites du site sur 7, 30 ou 90 jours, pages les plus vues et provenance des visiteurs.

![Schéma d'architecture du portfolio : les visiteurs ouvrent remim.me en HTTPS ; le nom de domaine, géré chez Namecheap, mène à GitHub Pages, qui sert le portfolio et le tableau de bord dashboard.remim.me. Chaque page vue est comptée par GoatCounter. J'écris dans VS Code ou depuis le tableau de bord, qui enregistre dans le dépôt par l'API GitHub. Chaque envoi déclenche GitHub Actions, qui teste puis publie le site. Chaque lundi, la veille lit 33 flux RSS et fait résumer les articles par GitHub Copilot.](schemas/portfolio-architecture.svg "Architecture du portfolio : publication, veille automatique et tableau de bord")

Claude Code m'a assisté pendant le développement.

Code source (licence MIT) : [le site](https://github.com/moreauremi/moreauremi.github.io) et [le tableau de bord](https://github.com/moreauremi/veille-syntheses).

## Captures d'écran

![Menu principal de RémiOS : boîte grise sur fond bleu façon whiptail, avec le logo, mes informations et les rubriques numérotées de 1 à 8](captures/portfolio-remios/menu.webp "Menu principal, après le démarrage façon Linux")

![Rubrique Veille technologique : trois onglets de sujets, et dans le sujet Cybersécurité, les onglets « Dernières actualités » et « Mes synthèses », puis les actualités résumées avec leurs tags](captures/portfolio-remios/veille.webp "Veille technologique : un onglet par sujet, les actualités résumées chaque lundi")

![Vue rapide pour le jury : page sobre sur fond blanc, avec le sommaire des rubriques](captures/portfolio-remios/jury.webp "Vue rapide jury : sobre, imprimable, sans animation")

![Terminal caché : les commandes ls et cat affichent les fichiers du site, dont le dossier de chaque sujet de veille](captures/portfolio-remios/terminal.webp "Terminal caché : le site parcouru comme un système de fichiers")

![Vue d'ensemble du tableau de bord : état des trois veilles avec l'ancienneté de la dernière synthèse, état de la publication et de la collecte façon journal de démarrage, accès rapides, et boîte des visites du site](captures/portfolio-remios/tableau-de-bord.webp "Tableau de bord dashboard.remim.me : la vue d'ensemble")

![Vue Synthèses du tableau de bord : barre des sujets, liste des synthèses publiées, éditeur, et actualités du sujet à cocher pour les citer en sources](captures/portfolio-remios/syntheses.webp "Tableau de bord : écrire une synthèse et citer ses sources")

## Résultats et tests

- **Audit Lighthouse** du site en ligne (26 septembre 2026) : 100/100 en performance, accessibilité, bonnes pratiques et référencement, sur mobile comme sur ordinateur.
- **Accessibilité** : règles WCAG 2.2 AA vérifiées avec axe-core sur chaque écran, navigation complète au clavier, aucune page qui défile horizontalement, même sur un écran de 320 px.
- **Validation HTML** : les pages passent le validateur du W3C sans erreur.
- **Tests automatisés**, lancés avant chaque mise en ligne : 14 pour le site (politique de sécurité, chaque rubrique et chaque fiche, vue jury, onglets de la veille, mesure d'audience, terminal, rappel des synthèses) et 19 pour le tableau de bord (format des synthèses, échanges simulés avec GitHub et GoatCounter, graphique des visites).

Le site est en ligne depuis septembre 2026, et sa fréquentation est mesurée depuis le 9 octobre 2026.

## Difficultés rencontrées

**Pas de serveur sur GitHub Pages.** Le tableau de bord devait écrire dans le dépôt et faire appel à une IA, sans exposer de secret. Solution : l'API GitHub appelée depuis le navigateur, avec un jeton personnel aux droits minimaux, et l'IA lancée par GitHub Actions, où reste son secret.

**Le cache de GitHub Pages.** Juste après une mise à jour, un navigateur pouvait afficher la nouvelle page avec l'ancienne feuille de style. J'ai ajouté un numéro de version à chaque fichier, et un test vérifie qu'aucun n'est oublié.

**Mesurer l'audience sans affaiblir la sécurité.** Le script officiel de GoatCounter aurait obligé à autoriser un script extérieur. J'ai donc réécrit l'envoi des pages vues, et un test vérifie qu'aucune visite n'est comptée pendant les tests eux-mêmes.

**L'icône absente dans Google.** Le site n'avait qu'une icône SVG, alors que Google demande une image carrée de 48 px ou d'un multiple de 48 : j'ai ajouté un favicon.ico et une image de 192 px.

**Des écritures concurrentes.** Le tableau de bord et la collecte du lundi écrivent dans le même dépôt. Chaque écriture vérifie la version du fichier, pour ne jamais écraser une modification faite ailleurs, et la tâche du lundi se met à jour avant d'envoyer la sienne.

## Pistes d'amélioration

- Refaire l'audit Lighthouse après les derniers ajouts (veille à trois sujets, mesure d'audience).
- Ajouter les tests d'accessibilité (axe-core) à la publication automatique.
- Être prévenu avant l'expiration des jetons GitHub, valables un an.
- Héberger la version Docker sur mon homelab, derrière son reverse proxy.

## Compétences mises en œuvre

- **B1.3** : valoriser mon image sur le web en respectant le cadre juridique (mentions légales, RGPD) ; référencer le site (données structurées, plan du site, icône) et mesurer sa visibilité (GoatCounter) ; faire évoluer un site qui exploite des données (actualités de la veille, synthèses).
- **B1.4** : découper le projet en étapes, suivre son avancement (historique git, liste de ce qui reste à faire) et corriger les écarts.
- **B1.5** : tester le service (tests automatisés, audits), le déployer (GitHub Pages, DNS, HTTPS, publication continue) et documenter son utilisation.
- **B1.6** : organiser une veille informationnelle sur trois sujets, et gérer mon identité professionnelle en ligne.
