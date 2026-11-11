// =============================================================================
// Configuration du contenu de RémiOS
// -----------------------------------------------------------------------------
// C'est ici que se modifient les informations du site, sans toucher au code.
// Les textes longs sont dans des fichiers Markdown :
//   - content/pages/          présentation, veille
//   - content/realisations/   une fiche par réalisation
//
// Tout texte « [À COMPLÉTER] » s'affiche surligné en jaune avec `npm run dev` :
// c'est le signal de ce qui reste à remplir. Le site publié ne les montre pas
// (repère retiré, avec le paragraphe ou la section qui ne contenait que lui).
//
// Version anglaise du site (#/en/) : chaque objet peut avoir un champ « en »,
// qui donne la traduction de ses textes, champ par champ. Ce qui n'est pas
// traduit s'affiche en français. Exemple :
//   { code: 'B1.4', libelle: 'Travailler en mode projet', en: { libelle: 'Work in project mode' } }
// Le build vérifie que chaque champ traduit existe en français (faute de frappe).
// Traductions communes à tout le fichier (neofetch, référencement…) : le
// champ « en » tout en bas.
// =============================================================================

export default {
  // --- Identité ---------------------------------------------------------------
  identite: {
    nom: 'Rémi Moreau',
    utilisateur: 'remi', // nom affiché au login et dans l'invite du terminal
    machine: 'remios', // nom de la machine : remi@remios
    // Photo professionnelle (portrait), affichée en haut de la présentation.
    // 1. Déposer l'image dans public/photo/ (format .webp conseillé, carrée, environ 400 × 400 px)
    // 2. Indiquer son chemin ici, sans « public/ » : photo: 'photo/remi-moreau.webp'
    // Vide = le site affiche « [À COMPLÉTER] ». Le build vérifie que le fichier existe.
    photo: 'photo/remi-moreau.webp',
  },

  // Informations affichées à côté du logo, façon neofetch (dans cet ordre)
  neofetch: [
    ['Utilisateur', 'Rémi Moreau'],
    ['Formation', 'BTS SIO option SISR'],
    ['École', 'MyDigitalSchool Nantes'],
    ['Alternance', '1Life (part of Visiativ)'],
    ['Poste', 'Consultant ERP Open-Prod'],
    ['Promo', '2026 – 2028'],
    ['Base', 'Nantes'],
  ],

  // --- Adresse publique du site -----------------------------------------------
  // URL complète, terminée par « / » (ex. 'https://portfolio.exemple.fr/').
  // Laisser vide tant qu'il n'y a pas de nom de domaine. Elle sert aux aperçus
  // de lien (Open Graph) : image et adresse doivent y être des URL complètes.
  urlPublique: 'https://remim.me/',

  // --- Référencement (Google, Bing…) -----------------------------------------
  // Titre et description affichés dans les résultats de recherche, et
  // informations lues par les moteurs pour comprendre qui est derrière le site
  // (« données structurées » schema.org). Tout doit rester exact.
  referencement: {
    // Titre de la page (onglet et résultats de recherche) : « RémiOS — <titre> »
    titre: 'Rémi Moreau · Portfolio BTS SIO SISR',
    // Description sous le titre dans les résultats (idéalement moins de 160 caractères)
    description:
      "Portfolio de Rémi Moreau, étudiant en BTS SIO option SISR à MyDigitalSchool Nantes et consultant ERP en alternance chez 1Life : réalisations, homelab, veille.",
    poste: 'Consultant ERP en alternance',
    entreprise: '1Life',
    groupe: 'Visiativ',
    ecole: 'MyDigitalSchool Nantes',
    ville: 'Nantes',
    // Domaines de compétence (repris du CV)
    domaines: [
      'Administration des systèmes et des réseaux',
      'ERP Open-Prod',
      'Proxmox',
      'Docker',
      'Linux',
      'Python',
      'DNS, VPN et reverse proxy',
    ],
  },

  // --- Contact ----------------------------------------------------------------
  contact: {
    email: 'remimoreau2006@gmail.com',
    github: 'https://github.com/moreauremi',
    linkedin: 'https://www.linkedin.com/in/remi-moreau-dubois',
    localisation: 'Nantes',
    // Statut de disponibilité (alternance, stage recherché, poste…)
    disponibilite: 'En alternance chez 1Life (BTS SIO, promo 2026 – 2028)',
  },

  // --- Formulaire de contact --------------------------------------------------
  // Le site est statique : il ne peut pas envoyer d'e-mail lui-même. Le service
  // Web3Forms (gratuit) reçoit le formulaire et transfère le message par e-mail,
  // sans le conserver. Mise en place :
  // 1. Sur https://web3forms.com, saisir l'adresse qui recevra les messages :
  //    une « Access Key » arrive aussitôt par e-mail.
  // 2. La copier ici : cle: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  // Cette clé n'est pas un secret : elle est faite pour figurer dans la page.
  // Vide = pas de formulaire, seul le lien e-mail est affiché.
  formulaire: {
    cle: 'b50721de-2c4b-4c0c-9b1e-c16876ec32e9',
  },

  // --- Mesure d'audience ------------------------------------------------------
  // GoatCounter (https://www.goatcounter.com : gratuit pour un site personnel,
  // open source, sans cookie) compte les écrans consultés. Le script de
  // GoatCounter n'est pas chargé : src/utils/audience.js envoie lui-même une
  // requête par écran affiché (#/veille, #/realisations/homelab…), et le site
  // garde sa règle « aucun script extérieur ». Statistiques : sur
  // https://remim.goatcounter.com et dans le tableau de bord des synthèses.
  // Pour ne pas compter ses propres visites : ouvrir une fois
  // https://remim.me/#toggle-goatcounter sur chaque appareil.
  // Vide = aucune mesure : la politique de sécurité et les mentions légales
  // s'adaptent toutes seules.
  audience: {
    goatcounter: 'https://remim.goatcounter.com',
  },

  // --- Documents PDF ----------------------------------------------------------
  // 1. Déposer le fichier dans public/docs/ (ex. public/docs/cv.pdf)
  // 2. Indiquer son chemin ici, sans « public/ » : cv: 'docs/cv.pdf'
  // Vide = le site affiche « [À COMPLÉTER] ». Le build vérifie que le fichier existe.
  documents: {
    cv: 'docs/cv-remi-moreau.pdf',
    synthese: '',
  },

  // --- Veille technologique ---------------------------------------------------
  // Trois sujets, un onglet chacun dans la rubrique « Veille technologique ».
  // Chaque sujet a son dossier content/veille/<id>/ : sujet.md (pourquoi ce
  // sujet), syntheses.md (mes synthèses), actualites.json (écrit chaque lundi).
  //
  // Veille automatique (scripts/veille.mjs, lancé chaque lundi par GitHub
  // Actions) : pour chaque sujet, les articles de ses flux sont triés par
  // l'IA, qui garde les plus utiles, les résume et leur attribue des tags.
  veille: {
    // IA utilisée, commune aux trois sujets : GitHub Copilot (Copilot CLI),
    // avec l'abonnement Copilot du compte GitHub. Le jeton n'est jamais écrit
    // ici : il est rangé dans les secrets du dépôt (COPILOT_GITHUB_TOKEN),
    // voir le README.
    //   modele : '' = modèle par défaut de Copilot, ou un nom précis (voir
    //            `copilot --help`, option --model).
    // Autre possibilité : fournisseur: 'api', avec url et modele d'un service
    // au format de l'API OpenAI (Mistral, Groq, Gemini…).
    ia: {
      fournisseur: 'copilot',
      modele: '',
    },

    // Pour chaque sujet :
    //   id         nom du dossier content/veille/<id>/ et de l'adresse #/veille/<id>
    //              (minuscules, chiffres et tirets)
    //   nom        libellé de l'onglet
    //   sujet      intitulé complet, affiché en tête de l'onglet
    //   motsCles   un article d'un média généraliste (specialise: false) n'est
    //              proposé à l'IA que s'il en contient au moins un (mot entier ;
    //              majuscules et accents ne comptent pas)
    //   contexte   l'IA met en avant les articles qui en parlent, sans écarter
    //              une actualité importante qui n'en parle pas
    //   utile      ce que l'IA doit retenir (consigne de choix des articles)
    //   pourQui    à qui le résumé explique pourquoi c'est important
    //   parSemaine nombre maximal d'actualités retenues chaque semaine
    //   tags       tags proposés à l'IA : elle les réutilise en priorité et n'en
    //              crée un nouveau que si aucun ne convient
    //   flux       flux RSS suivis ; specialise: true = média entièrement
    //              consacré au sujet (tous ses articles sont proposés à l'IA)
    sujets: [
      {
        id: 'cybersecurite',
        nom: 'Cybersécurité',
        sujet: 'La cybersécurité des PME industrielles',
        en: { nom: 'Cybersecurity', sujet: 'Cybersecurity in industrial SMEs' },
        motsCles: [
          'cybersécurité', 'cyberattaque', 'cybercriminalité', 'rançongiciel', 'ransomware',
          'hameçonnage', 'phishing', 'vulnérabilité', 'faille', 'fuite de données',
          'piratage', 'pirate', 'NIS2', 'NIS 2', 'ANSSI', 'OT', 'SCADA',
        ],
        contexte: ['PME', 'TPE', 'ETI', 'industrie', 'usine', 'production', 'sous-traitant', 'ERP'],
        utile: 'menaces et attaques visant les entreprises, en particulier industrielles ou de petite taille, vulnérabilités critiques des outils qu\'elles utilisent, réglementation, bonnes pratiques, chiffres clés',
        pourQui: 'une PME, en particulier industrielle',
        parSemaine: 6,
        tags: [
          'rançongiciel', 'hameçonnage', 'vulnérabilité', 'fuite de données', 'cybercriminalité',
          'systèmes industriels (OT)', 'PME', 'réglementation', 'NIS2', 'sensibilisation',
          'sauvegarde', "chaîne d'approvisionnement", 'intelligence artificielle',
        ],
        flux: [
          { nom: 'CERT-FR (ANSSI)', url: 'https://www.cert.ssi.gouv.fr/actualite/feed/', specialise: true },
          { nom: 'CERT-FR, alertes', url: 'https://www.cert.ssi.gouv.fr/alerte/feed/', specialise: true },
          { nom: 'Cybermalveillance.gouv.fr', url: 'https://www.cybermalveillance.gouv.fr/feed/atom-flux-actualites', specialise: true },
          { nom: 'ZATAZ', url: 'https://www.zataz.com/feed/', specialise: true },
          { nom: 'InCyber', url: 'https://incyber.org/feed/', specialise: true },
          { nom: 'Le Monde Informatique, sécurité', url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/securite/rss.xml', specialise: true },
          { nom: '01net, sécurité', url: 'https://www.01net.com/actualites/securite/feed/', specialise: true },
          { nom: 'UnderNews', url: 'https://www.undernews.fr/feed', specialise: true },
          { nom: 'IT-Connect', url: 'https://www.it-connect.fr/feed/', specialise: false },
          { nom: 'LeMagIT', url: 'https://www.lemagit.fr/rss/ContentSyndication.xml', specialise: false },
          { nom: 'Silicon', url: 'https://www.silicon.fr/feed', specialise: false },
          { nom: "L'Usine Digitale", url: 'https://www.usine-digitale.fr/rss', specialise: false },
          { nom: "L'Usine Nouvelle", url: 'https://www.usinenouvelle.com/rss/', specialise: false },
        ],
      },
      {
        id: 'virtualisation',
        nom: 'Virtualisation',
        sujet: "La virtualisation dans les PME : Hyper-V, Proxmox et l'après-VMware",
        en: { nom: 'Virtualisation', sujet: 'Virtualisation in SMEs: Hyper-V, Proxmox and life after VMware' },
        motsCles: [
          'virtualisation', 'hyperviseur', 'hyperviseurs', 'Hyper-V', 'Proxmox', 'VMware', 'vSphere',
          'ESXi', 'vCenter', 'Broadcom', 'XCP-ng', 'Xen', 'Nutanix', 'KVM', 'machine virtuelle',
          'machines virtuelles', 'VM', 'VDI', 'Azure Local', 'Azure Stack HCI', 'Windows Server',
          'OpenStack', 'cloud privé',
        ],
        contexte: ['PME', 'TPE', 'ETI', 'migration', 'licence', 'licences', 'prix', 'coût', 'Hyper-V', 'Proxmox'],
        utile: "nouvelles versions et fonctions des hyperviseurs (Hyper-V, Proxmox VE, VMware vSphere, XCP-ng, Nutanix…), changements de licences et de prix (Broadcom), migrations hors de VMware et retours d'expérience, failles de sécurité des hyperviseurs, sauvegarde des machines virtuelles, chiffres du marché",
        pourQui: 'une PME qui héberge ses propres serveurs',
        parSemaine: 6,
        tags: [
          'Hyper-V', 'Proxmox', 'VMware', 'Broadcom', 'licences', 'migration', 'nouvelle version',
          'sécurité', 'sauvegarde', 'stockage', 'conteneurs', 'cloud',
        ],
        flux: [
          { nom: 'Proxmox, annonces', url: 'https://forum.proxmox.com/forums/announcements.7/index.rss', specialise: true },
          { nom: 'XCP-ng', url: 'https://xcp-ng.org/blog/rss/', specialise: true },
          { nom: 'Le Monde Informatique, virtualisation', url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/virtualisation/rss.xml', specialise: true },
          { nom: 'Le Monde Informatique, datacenter', url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/datacenter/rss.xml', specialise: false },
          { nom: 'Le Monde Informatique, infrastructure', url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/infrastructure/rss.xml', specialise: false },
          { nom: 'IT-Connect', url: 'https://www.it-connect.fr/feed/', specialise: false },
          { nom: 'LeMagIT', url: 'https://www.lemagit.fr/rss/ContentSyndication.xml', specialise: false },
          { nom: 'Silicon', url: 'https://www.silicon.fr/feed', specialise: false },
          { nom: 'ZDNet France', url: 'https://www.zdnet.fr/feeds/rss/actualites/', specialise: false },
          { nom: 'Next', url: 'https://next.ink/feed/', specialise: false },
          { nom: 'InformatiqueNews', url: 'https://www.informatiquenews.fr/feed', specialise: false },
          { nom: 'DCmag', url: 'https://dcmag.fr/feed/', specialise: false },
        ],
      },
      {
        id: 'facturation-electronique',
        nom: 'Facturation électronique',
        sujet: 'La facturation électronique obligatoire (réforme 2026-2027)',
        en: { nom: 'E-invoicing', sujet: 'Mandatory e-invoicing in France (2026-2027 reform)' },
        motsCles: [
          'facturation électronique', 'facture électronique', 'factures électroniques', 'e-invoicing',
          'e-facture', 'e-reporting', 'Factur-X', 'UBL', 'plateforme agréée', 'plateformes agréées',
          'PDP', 'PPF', 'portail public de facturation', 'Chorus Pro', 'IOPOLE', 'Peppol',
          'dématérialisation des factures', 'réforme de la facturation',
        ],
        contexte: ['PME', 'TPE', 'ETI', 'ERP', 'éditeur', 'expert-comptable', 'calendrier', 'septembre 2026', 'septembre 2027'],
        utile: "calendrier et obligations de la réforme (réception depuis septembre 2026, émission par les PME et TPE en septembre 2027, e-reporting), plateformes agréées (dont IOPOLE) et leur immatriculation, formats (Factur-X, UBL, CII), annuaire et portail public, conséquences pour les ERP et les logiciels de gestion, sanctions, retours d'expérience et chiffres",
        pourQui: "une PME, et pour un intégrateur d'ERP qui accompagne ses clients dans la réforme",
        parSemaine: 6,
        tags: [
          'calendrier', 'plateformes agréées', 'IOPOLE', 'Factur-X', 'e-reporting', 'ERP', 'PME',
          'annuaire', 'sanctions', 'Peppol', 'expert-comptable', 'administration',
        ],
        flux: [
          { nom: 'FNFE-MPE', url: 'https://fnfe-mpe.org/feed/', specialise: true },
          { nom: 'Service-public.fr, professionnels', url: 'https://www.service-public.fr/abonnements/rss/actu-actu-pro.rss', specialise: false },
          { nom: 'economie.gouv.fr', url: 'https://www.economie.gouv.fr/rss/toutesactualites', specialise: false },
          { nom: 'DAF Magazine', url: 'https://www.daf-mag.fr/feed', specialise: false },
          { nom: 'Finyear', url: 'https://www.finyear.com/xml/syndication.rss', specialise: false },
          { nom: 'Docoon (plateforme agréée)', url: 'https://www.docoon.com/feed/', specialise: false },
          { nom: 'Sage, blog', url: 'https://www.sage.com/fr-fr/blog/feed/', specialise: false },
          { nom: 'Le Monde Informatique, logiciel', url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/logiciel/rss.xml', specialise: false },
          { nom: 'Le Monde Informatique, ERP', url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/erp/rss.xml', specialise: false },
          { nom: 'Journal du Net', url: 'https://www.journaldunet.com/rss/', specialise: false },
          { nom: 'Solutions Numériques', url: 'https://www.solutions-numeriques.com/feed/', specialise: false },
          { nom: 'Silicon', url: 'https://www.silicon.fr/feed', specialise: false },
          { nom: 'LeMagIT', url: 'https://www.lemagit.fr/rss/ContentSyndication.xml', specialise: false },
        ],
      },
    ],
  },

  // --- Compétences du référentiel ---------------------------------------------
  // Codes à utiliser dans le champ « competences » des fiches (ex. [B1.1, B1.4]).
  // Les six colonnes du tableau de synthèse officiel de l'épreuve E5 (bloc 1 du
  // référentiel), avec les savoir-faire détaillés listés sous chacune.
  competences: [
    {
      code: 'B1.1',
      libelle: 'Gérer le patrimoine informatique',
      criteres: [
        'Recenser et identifier les ressources numériques',
        'Exploiter des référentiels, normes et standards adoptés par le prestataire informatique',
        'Mettre en place et vérifier les niveaux d’habilitation associés à un service',
        'Vérifier les conditions de la continuité d’un service informatique',
        'Gérer des sauvegardes',
        'Vérifier le respect des règles d’utilisation des ressources numériques',
      ],
      en: {
        libelle: 'Manage IT assets',
        criteres: [
          'Inventory and identify digital resources',
          'Use the frameworks, norms and standards adopted by the IT service provider',
          'Set up and check the access levels associated with a service',
          'Check the conditions for the continuity of an IT service',
          'Manage backups',
          'Check compliance with the rules for using digital resources',
        ],
      },
    },
    {
      code: 'B1.2',
      libelle: 'Répondre aux incidents et aux demandes d’assistance et d’évolution',
      criteres: [
        'Collecter, suivre et orienter des demandes',
        'Traiter des demandes concernant les services réseau et système, applicatifs',
        'Traiter des demandes concernant les applications',
      ],
      en: {
        libelle: 'Respond to incidents and to requests for support and change',
        criteres: [
          'Collect, track and route requests',
          'Handle requests concerning network, system and application services',
          'Handle requests concerning applications',
        ],
      },
    },
    {
      code: 'B1.3',
      libelle: 'Développer la présence en ligne de l’organisation',
      criteres: [
        'Participer à la valorisation de l’image de l’organisation sur les médias numériques en tenant compte du cadre juridique et des enjeux économiques',
        'Référencer les services en ligne de l’organisation et mesurer leur visibilité',
        'Participer à l’évolution d’un site Web exploitant les données de l’organisation',
      ],
      en: {
        libelle: 'Develop the organisation’s online presence',
        criteres: [
          'Help promote the organisation’s image on digital media, taking into account the legal framework and the economic stakes',
          'List the organisation’s online services with search engines and measure their visibility',
          'Contribute to the development of a website that uses the organisation’s data',
        ],
      },
    },
    {
      code: 'B1.4',
      libelle: 'Travailler en mode projet',
      criteres: [
        'Analyser les objectifs et les modalités d’organisation d’un projet',
        'Planifier les activités',
        'Évaluer les indicateurs de suivi d’un projet et analyser les écarts',
      ],
      en: {
        libelle: 'Work in project mode',
        criteres: [
          'Analyse the objectives and organisation of a project',
          'Plan activities',
          'Assess a project’s tracking indicators and analyse deviations',
        ],
      },
    },
    {
      code: 'B1.5',
      libelle: 'Mettre à disposition des utilisateurs un service informatique',
      criteres: [
        'Réaliser les tests d’intégration et d’acceptation d’un service',
        'Déployer un service',
        'Accompagner les utilisateurs dans la mise en place d’un service',
      ],
      en: {
        libelle: 'Make an IT service available to users',
        criteres: [
          'Carry out integration and acceptance testing of a service',
          'Deploy a service',
          'Support users when a service is introduced',
        ],
      },
    },
    {
      code: 'B1.6',
      libelle: 'Organiser son développement professionnel',
      criteres: [
        'Mettre en place son environnement d’apprentissage personnel',
        'Mettre en œuvre des outils et stratégies de veille informationnelle',
        'Gérer son identité professionnelle',
        'Développer son projet professionnel',
      ],
      en: {
        libelle: 'Organise one’s professional development',
        criteres: [
          'Set up one’s personal learning environment',
          'Use information-monitoring tools and strategies',
          'Manage one’s professional identity',
          'Develop one’s career plan',
        ],
      },
    },
  ],

  // --- Savoir-faire technique (rubrique « Compétences ») ---------------------
  // Pour chaque compétence :
  //   niveau   de 1 à 4 (voir « niveaux »), demi-niveaux permis (3.5 = entre
  //            Autonome et Maîtrise), ou null tant qu'il n'est pas évalué
  //            (le site affiche alors « [À COMPLÉTER] ») ;
  //   preuves  slugs des fiches où elle a été mise en pratique (le build vérifie
  //            que chaque fiche existe ; une fiche en brouillon n'est pas affichée).
  // Rester honnête sur les niveaux : le jury posera des questions dessus.
  savoirFaire: {
    niveaux: [
      { nom: 'Notions', description: "j'en connais les principes", en: { nom: 'Basics', description: 'I know the principles' } },
      { nom: 'Guidé', description: "je l'ai déjà utilisé, avec de l'aide ou une documentation pas à pas", en: { nom: 'Guided', description: 'I have used it, with help or step-by-step documentation' } },
      { nom: 'Autonome', description: "je l'utilise seul pour mener un projet", en: { nom: 'Independent', description: 'I use it on my own to carry out a project' } },
      { nom: 'Maîtrise', description: "je sais le dépanner, l'optimiser et l'expliquer à d'autres", en: { nom: 'Expert', description: 'I can troubleshoot it, optimise it and explain it to others' } },
    ],
    domaines: [
      {
        nom: 'Systèmes et virtualisation',
        en: { nom: 'Systems and virtualisation' },
        items: [
          { nom: 'Linux', niveau: 3, preuves: ['homelab', 'environnement-open-prod', 'glpi', 'reseau-vm-virtualbox', 'dashu'] },
          { nom: 'Windows (poste et serveur)', niveau: 2, preuves: ['reseau-vm-virtualbox', 'rmutils'], en: { nom: 'Windows (desktop and server)' } },
          { nom: 'Proxmox VE', niveau: 3, preuves: ['homelab', 'depannage-serveurs-tp', 'dashu'] },
          { nom: 'VirtualBox', niveau: 3, preuves: ['reseau-vm-virtualbox', 'glpi'] },
          { nom: 'Docker', niveau: 2, preuves: ['homelab', 'portfolio-remios'] },
          { nom: 'systemd (services, minuteries)', niveau: 2, preuves: ['dashu'], en: { nom: 'systemd (services, timers)' } },
          { nom: 'Sauvegarde et restauration', niveau: 2, preuves: ['dashu', 'rmutils'], en: { nom: 'Backup and restore' } },
        ],
      },
      {
        nom: 'Réseaux et sécurité',
        en: { nom: 'Networks and security' },
        items: [
          { nom: 'Adressage IP, DHCP et diagnostic réseau', niveau: 2, preuves: ['reseau-vm-virtualbox', 'rmutils', 'depannage-serveurs-tp'], en: { nom: 'IP addressing, DHCP and network troubleshooting' } },
          { nom: 'Switch Cisco (IOS) : console, VLAN, STP', niveau: 2, preuves: ['depannage-serveurs-tp'], en: { nom: 'Cisco switches (IOS): console, VLANs, STP' } },
          { nom: 'VPN (Tailscale)', niveau: 3, preuves: ['homelab', 'dashu'] },
          { nom: 'DNS et nom de domaine', niveau: 3, preuves: ['portfolio-remios', 'dashu'], en: { nom: 'DNS and domain names' } },
          { nom: 'Cloudflare (DNS, tunnel)', niveau: 2, preuves: ['dashu'] },
          { nom: 'Serveur web (Apache, Nginx), reverse proxy', niveau: 2, preuves: ['glpi', 'portfolio-remios', 'dashu'], en: { nom: 'Web servers (Apache, Nginx), reverse proxy' } },
        ],
      },
      {
        nom: 'Langages de programmation',
        en: { nom: 'Programming languages' },
        items: [
          { nom: 'Python', niveau: 3.5, preuves: ['crypto-dashboard-pro'] },
          { nom: 'PowerShell et batch', niveau: 3, preuves: ['rmutils', 'reseau-vm-virtualbox', 'depannage-serveurs-tp'], en: { nom: 'PowerShell and batch' } },
          { nom: 'HTML', niveau: 2, preuves: ['portfolio-remios'] },
        ],
      },
      {
        nom: 'Bases de données',
        en: { nom: 'Databases' },
        items: [
          { nom: 'SQL', niveau: 2, preuves: ['glpi', 'rapports-qweb'] },
          { nom: 'PostgreSQL, MariaDB (administration)', niveau: 3, preuves: ['environnement-open-prod', 'glpi'] },
          { nom: 'Modèle conceptuel de données (MCD)', niveau: 3, preuves: ['reprise-donnees-open-prod'], en: { nom: 'Conceptual data model (MCD)' } },
        ],
      },
      {
        nom: 'Outils et frameworks',
        en: { nom: 'Tools and frameworks' },
        items: [
          { nom: 'Git et GitHub', niveau: 2, preuves: ['crypto-dashboard-pro', 'portfolio-remios', 'rmutils', 'environnement-open-prod', 'dashu'], en: { nom: 'Git and GitHub' } },
          { nom: 'Excel (RECHERCHEV, RECHERCHEX)', niveau: 3, preuves: ['reprise-donnees-open-prod'], en: { nom: 'Excel (VLOOKUP, XLOOKUP)' } },
          { nom: 'Streamlit, Pandas, Plotly', niveau: 3, preuves: ['crypto-dashboard-pro'] },
          { nom: 'n8n (automatisation)', niveau: 2, preuves: [], en: { nom: 'n8n (automation)' } },
        ],
      },
      {
        nom: 'Logiciels métier',
        en: { nom: 'Business software' },
        items: [
          { nom: 'ERP Open-Prod', niveau: 2, preuves: ['environnement-open-prod', 'flux-production-sous-traitance', 'reprise-donnees-open-prod', 'rapports-qweb'] },
          { nom: 'QWeb (rapports Open-Prod)', niveau: 2, preuves: ['rapports-qweb'], en: { nom: 'QWeb (Open-Prod reports)' } },
          { nom: 'GLPI (gestion des tickets)', niveau: 2, preuves: ['glpi'], en: { nom: 'GLPI (ticket management)' } },
        ],
      },
    ],
  },

  // --- Certifications et formations (rubriques « Certifications » et « Formations ») ---
  // Une entrée par certification, score de langue, formation ou badge. Les
  // entrées de catégorie « formation » s'affichent dans la rubrique Formations,
  // les autres dans la rubrique Certifications. Exemple :
  //   {
  //     titre: 'SecNumacadémie',
  //     organisme: 'ANSSI',
  //     categorie: 'certification',  // certification, langue, formation ou badge
  //     date: '2026-11',             // AAAA, AAAA-MM ou AAAA-MM-JJ
  //     statut: 'obtenue',           // facultatif : obtenue ou en cours (absent = rien d'affiché)
  //     detail: '',                  // facultatif : score, niveau…
  //     description: '',             // facultatif : une ou deux phrases sur le contenu
  //     fiche: '',                   // facultatif : slug de la réalisation liée (lien affiché une fois publiée)
  //     justificatif: 'docs/certifications/secnumacademie.pdf', // facultatif, fichier dans public/
  //     lien: '',                    // facultatif : page de vérification ou badge en ligne
  //   },
  // N'indiquer que ce qui est réellement obtenu ou en cours.
  // Liste vide = la rubrique affiche « À venir ».
  certifications: [
    {
      titre: 'QWeb : rapports Open-Prod',
      organisme: '1Life',
      categorie: 'formation',
      date: '2026-10-15', // première journée ; la seconde est prévue fin octobre
      statut: 'en cours', // passer à « obtenue » après la seconde journée
      detail: 'deux journées, la seconde fin octobre 2026',
      description: 'Création et modification de rapports Open-Prod (devis, factures…) avec QWeb, le moteur de modèles d’Odoo : en vue graphique, en assemblant des blocs imbriqués, puis en vue XML pour aller plus loin que ce que permet l’éditeur.',
      fiche: 'rapports-qweb',
      en: {
        titre: 'QWeb: Open-Prod reports',
        detail: 'two days, the second at the end of October 2026',
        description: 'Creating and editing Open-Prod reports (quotes, invoices…) with QWeb, the Odoo templating engine: in the graphical view, by assembling nested blocks, then in the XML view to go further than the editor allows.',
      },
    },
    {
      titre: 'Indicateurs et tableaux de bord Open-Prod',
      organisme: '1Life',
      categorie: 'formation',
      date: '2026-10',
      detail: 'KPI, création d’indicateurs et de tableaux de bord',
      description: 'Extraction de données PostgreSQL dans Excel par une connexion ODBC et création de graphiques, puis tableaux de bord dans le tableur intégré d’Open-Prod : feuilles liées entre elles et accessibles depuis les menus de l’ERP.',
      en: {
        titre: 'Open-Prod KPIs and dashboards',
        detail: 'KPIs, building indicators and dashboards',
        description: 'Extracting PostgreSQL data into Excel through an ODBC connection and building charts, then dashboards in the spreadsheet built into Open-Prod: sheets linked to one another and opened from the ERP menus.',
      },
    },
    {
      titre: 'MCD et reprise de données Open-Prod',
      organisme: '1Life',
      categorie: 'formation',
      date: '2026-10',
      detail: 'modèle conceptuel de données, import de données dans l’ERP',
      description: 'Lecture du modèle conceptuel de données (MCD) d’Open-Prod pour savoir où va chaque information, puis préparation des imports Excel de reprise de données : fichiers mis en correspondance entre eux avec RECHERCHEV et RECHERCHEX, avant import dans Open-Prod.',
      fiche: 'reprise-donnees-open-prod',
      en: {
        titre: 'Data model and data migration in Open-Prod',
        detail: 'conceptual data model, importing data into the ERP',
        description: 'Reading the Open-Prod conceptual data model (MCD) to know where each piece of information goes, then preparing the Excel imports for data migration: files matched against one another with VLOOKUP and XLOOKUP before being imported into Open-Prod.',
      },
    },
  ],

  // --- Mentions légales (#/mentions-legales) -----------------------------------
  // Obligatoires pour un site publié en France (loi pour la confiance dans
  // l'économie numérique, article 6). L'éditeur et le contact viennent des
  // rubriques « identite » et « contact » ci-dessus.
  mentionsLegales: {
    // Hébergeur du site. Si le site est servi par le homelab (Docker), mettre
    // ici ses propres coordonnées à la place de celles de GitHub.
    hebergeur: {
      nom: 'GitHub, Inc. (service GitHub Pages)',
      adresse: '88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis',
      site: 'https://pages.github.com',
      confidentialite: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
    },
    // Dépôt public du code source du site (il contient le fichier LICENSE)
    codeSource: 'https://github.com/moreauremi/moreauremi.github.io',
  },

  // --- Services affichés pendant le démarrage ---------------------------------
  // Chaque entrée produit une ligne systemd :
  //   [  OK  ] <action> <unite> - <description>.
  // Les lignes génériques (journal, réseau, SSH…) et celle de la veille sont
  // ajoutées automatiquement autour de celles-ci.
  boot: [
    { action: 'Started', unite: 'bts-sio-sisr.service', description: 'MyDigitalSchool Nantes' },
    { action: 'Started', unite: 'alternance@1life.service', description: 'consultant ERP Open-Prod', en: { description: 'Open-Prod ERP consultant' } },
    { action: 'Mounted', unite: '/srv/nas', description: 'stockage réseau', en: { description: 'network storage' } },
    { action: 'Started', unite: 'jellyfin.service', description: 'serveur multimédia', en: { description: 'media server' } },
    { action: 'Started', unite: 'dashu.service', description: 'espace de travail auto-hébergé', en: { description: 'self-hosted workspace' } },
  ],

  // --- Version anglaise des textes communs ------------------------------------
  // Lignes neofetch : dans le même ordre qu'en français (le code retrouve
  // certaines lignes par leur position : formation, école, poste…).
  en: {
    neofetch: [
      ['User', 'Rémi Moreau'],
      ['Degree', 'BTS SIO, SISR option'],
      ['School', 'MyDigitalSchool Nantes'],
      ['Work-study', '1Life (part of Visiativ)'],
      ['Position', 'Open-Prod ERP consultant'],
      ['Class of', '2026 – 2028'],
      ['Based in', 'Nantes'],
    ],
    referencement: {
      titre: 'Rémi Moreau · BTS SIO SISR portfolio',
      description:
        'Portfolio of Rémi Moreau, BTS SIO (SISR) student at MyDigitalSchool Nantes and work-study ERP consultant at 1Life: projects, homelab, technology watch.',
      poste: 'Work-study ERP consultant',
    },
    contact: {
      disponibilite: 'Work-study placement at 1Life (BTS SIO, class of 2026 – 2028)',
    },
    mentionsLegales: {
      hebergeur: {
        adresse: '88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, United States',
      },
    },
  },
};
