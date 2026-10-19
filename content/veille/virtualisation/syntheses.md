---
titre: Mes synthèses
---

<!--
  Onglet « Mes synthèses » de ce sujet de veille. C'est la partie
  personnelle de la veille, celle que le jury regarde : à partir des
  actualités collectées (onglet « Dernières actualités »), ce que j'en
  retiens, ce que ça change pour les entreprises, ce que j'en fais.

  Une synthèse par titre de niveau 2, la plus récente en haut, par exemple :

  ## 19/01/2027 - Titre de la synthèse

  Texte de la synthèse…

  Les synthèses s'écrivent de préférence depuis le tableau de bord
  https://dashboard.remim.me, qui enregistre ce fichier sur GitHub : faire
  `git pull` avant de le modifier à la main. Voir le README.
-->

## 19/10/2026 - La virtualisation ne supprime pas les risques de sécurité

Je considère que réussir à sortir d’une VM pour accéder à l’hôte est une situation très dangereuse. À l’intérieur d’une VM, un utilisateur peut se sentir totalement invulnérable, alors que la faille PwnEscape montre qu’une exécution de code dans une VM KVM peut permettre à un attaquant d’accéder à la mémoire de l’hôte. Cette avancée rappelle que les failles de sécurité existent toujours et que le danger reste présent, notamment lorsqu’un code non fiable est exécuté sur des serveurs virtualisés.

**Sources**

- [PwnEscape : une faille Linux permet de s’évader d’une VM KVM](https://www.it-connect.fr/pwnescape-cve-2026-99999-faille-noyau-linux-evasion-vm/) (IT-Connect, 16 octobre 2026)

## 14/10/2026 - La virtualisation face aux changements du marché VMware

La virtualisation est nécessaire dans les milieux technologiques, mais aussi dès que l’on a besoin de tester certains logiciels. Je constate à quel point les acteurs du secteur ont de l’influence : disposer d’un service de virtualisation stable est donc essentiel.

Le rachat de VMware par Broadcom illustre, selon moi, les limites d’une vision directement guidée par le profit. La suppression de certains produits et des licences perpétuelles, remplacées par des offres par abonnement, pousse de nombreuses entreprises à envisager une diversification ou une migration partielle et progressive. Dans ce contexte, l’émergence d’alternatives, comme les plateformes open source développées par Vates, montre que les utilisateurs recherchent d’autres solutions de virtualisation.

**Sources**

- [VMware : trois ans après le rachat, la migration est toujours un sujet brûlant](https://next.ink/260701/vmware-trois-ans-apres-le-rachat-la-migration-est-toujours-un-sujet-brulant/) (Next, 8 octobre 2026)
- [Vates lève 30 M€ pour bâtir un acteur européen de la virtualisation](https://www.silicon.fr/business-1367/vates-leve-30-me-pour-batir-un-acteur-europeen-de-la-virtualisation-229536) (Silicon, 6 octobre 2026)
