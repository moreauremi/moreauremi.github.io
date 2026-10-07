// =============================================================================
// Configuration du contenu de RémiOS
// -----------------------------------------------------------------------------
// C'est ici que se modifient les informations du site, sans toucher au code.
// Les textes longs sont dans des fichiers Markdown :
//   - content/pages/          présentation, veille
//   - content/realisations/   une fiche par réalisation
//
// Tout texte « [À COMPLÉTER] » s'affiche surligné en jaune sur le site :
// c'est le signal de ce qui reste à remplir.
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

  // --- Documents PDF ----------------------------------------------------------
  // 1. Déposer le fichier dans public/docs/ (ex. public/docs/cv.pdf)
  // 2. Indiquer son chemin ici, sans « public/ » : cv: 'docs/cv.pdf'
  // Vide = le site affiche « [À COMPLÉTER] ». Le build vérifie que le fichier existe.
  documents: {
    cv: 'docs/cv-remi-moreau.pdf',
    synthese: '',
  },

  // --- Veille technologique ---------------------------------------------------
  veille: {
    // Sujet de la veille, entre guillemets (ex. sujet: 'La supervision réseau').
    // null tant qu'il n'est pas choisi : le site affiche « À venir » et le
    // démarrage signale veille-techno.service en [ WARN ].
    sujet: 'La cybersécurité des PME industrielles',

    // Veille automatique (scripts/veille.mjs, lancé chaque lundi par GitHub
    // Actions) : les articles des flux ci-dessous sont triés par l'IA, qui
    // garde les plus utiles au sujet, les résume et leur attribue des tags.
    //
    // Mots-clés : un article d'un média généraliste (specialise: false) n'est
    // proposé à l'IA que s'il en contient au moins un. Majuscules et accents
    // ne comptent pas.
    motsCles: [
      'cybersécurité', 'cyberattaque', 'cybercriminalité', 'rançongiciel', 'ransomware',
      'hameçonnage', 'phishing', 'vulnérabilité', 'faille', 'fuite de données',
      'piratage', 'pirate', 'NIS2', 'NIS 2', 'ANSSI', 'OT', 'SCADA',
    ],
    // Contexte : l'IA met en avant les articles qui concernent ces entreprises
    // ou ces secteurs, sans écarter une actualité importante qui n'en parle pas.
    contexte: ['PME', 'TPE', 'ETI', 'industrie', 'usine', 'production', 'sous-traitant', 'ERP'],
    // Nombre maximal d'actualités retenues chaque semaine
    parSemaine: 6,
    // Tags proposés à l'IA. Elle les réutilise en priorité et n'en crée un
    // nouveau que si aucun ne convient : les pages de tags restent cohérentes.
    tags: [
      'rançongiciel', 'hameçonnage', 'vulnérabilité', 'fuite de données', 'cybercriminalité',
      'systèmes industriels (OT)', 'PME', 'réglementation', 'NIS2', 'sensibilisation',
      'sauvegarde', "chaîne d'approvisionnement", 'intelligence artificielle',
    ],
    // IA utilisée : GitHub Copilot (Copilot CLI), avec l'abonnement Copilot du
    // compte GitHub. Le jeton n'est jamais écrit ici : il est rangé dans les
    // secrets du dépôt (COPILOT_GITHUB_TOKEN), voir le README.
    //   modele : '' = modèle par défaut de Copilot, ou un nom précis (voir
    //            `copilot --help`, option --model).
    // Autre possibilité : fournisseur: 'api', avec url et modele d'un service
    // au format de l'API OpenAI (Mistral, Groq, Gemini…).
    ia: {
      fournisseur: 'copilot',
      modele: '',
    },
    // Flux RSS suivis. specialise: true = média entièrement consacré à la
    // cybersécurité (tous ses articles sont proposés à l'IA).
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
    },
    {
      code: 'B1.2',
      libelle: 'Répondre aux incidents et aux demandes d’assistance et d’évolution',
      criteres: [
        'Collecter, suivre et orienter des demandes',
        'Traiter des demandes concernant les services réseau et système, applicatifs',
        'Traiter des demandes concernant les applications',
      ],
    },
    {
      code: 'B1.3',
      libelle: 'Développer la présence en ligne de l’organisation',
      criteres: [
        'Participer à la valorisation de l’image de l’organisation sur les médias numériques en tenant compte du cadre juridique et des enjeux économiques',
        'Référencer les services en ligne de l’organisation et mesurer leur visibilité',
        'Participer à l’évolution d’un site Web exploitant les données de l’organisation',
      ],
    },
    {
      code: 'B1.4',
      libelle: 'Travailler en mode projet',
      criteres: [
        'Analyser les objectifs et les modalités d’organisation d’un projet',
        'Planifier les activités',
        'Évaluer les indicateurs de suivi d’un projet et analyser les écarts',
      ],
    },
    {
      code: 'B1.5',
      libelle: 'Mettre à disposition des utilisateurs un service informatique',
      criteres: [
        'Réaliser les tests d’intégration et d’acceptation d’un service',
        'Déployer un service',
        'Accompagner les utilisateurs dans la mise en place d’un service',
      ],
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
    },
  ],

  // --- Savoir-faire technique (rubrique « Compétences ») ---------------------
  // Pour chaque compétence :
  //   niveau   de 1 à 4 (voir « niveaux »), ou null tant qu'il n'est pas évalué
  //            (le site affiche alors « [À COMPLÉTER] ») ;
  //   preuves  slugs des fiches où elle a été mise en pratique (le build vérifie
  //            que chaque fiche existe ; une fiche en brouillon n'est pas affichée).
  // Rester honnête sur les niveaux : le jury posera des questions dessus.
  savoirFaire: {
    niveaux: [
      { nom: 'Notions', description: "j'en connais les principes" },
      { nom: 'Guidé', description: "je l'ai déjà utilisé, avec de l'aide ou une documentation pas à pas" },
      { nom: 'Autonome', description: "je l'utilise seul pour mener un projet" },
      { nom: 'Maîtrise', description: "je sais le dépanner, l'optimiser et l'expliquer à d'autres" },
    ],
    domaines: [
      {
        nom: 'Systèmes et virtualisation',
        items: [
          { nom: 'Linux', niveau: null, preuves: ['homelab-jellyfin', 'nas', 'caffein'] },
          { nom: 'Proxmox VE', niveau: null, preuves: ['homelab-jellyfin', 'nas'] },
          { nom: 'Docker', niveau: null, preuves: ['homelab-jellyfin'] },
        ],
      },
      {
        nom: 'Réseaux et sécurité',
        items: [
          { nom: 'VPN (Tailscale)', niveau: null, preuves: ['homelab-jellyfin', 'nas'] },
          { nom: 'DNS et nom de domaine', niveau: null, preuves: ['caffein'] },
          { nom: 'Serveur web, reverse proxy (Nginx)', niveau: null, preuves: ['caffein'] },
        ],
      },
      {
        nom: 'Langages de programmation',
        items: [
          { nom: 'Python', niveau: null, preuves: ['crypto-dashboard-pro', 'caffein'] },
          { nom: 'HTML', niveau: null, preuves: ['caffein'] },
        ],
      },
      {
        nom: 'Bases de données',
        items: [{ nom: 'SQL (requêtes sur l\'ERP Open-Prod)', niveau: null, preuves: [] }],
      },
      {
        nom: 'Outils et frameworks',
        items: [
          { nom: 'Git et GitHub', niveau: null, preuves: ['crypto-dashboard-pro'] },
          { nom: 'Streamlit, Pandas, Plotly', niveau: null, preuves: ['crypto-dashboard-pro'] },
          { nom: 'n8n (automatisation)', niveau: null, preuves: ['caffein'] },
        ],
      },
      {
        nom: 'Logiciels métier',
        items: [{ nom: 'ERP Open-Prod', niveau: null, preuves: [] }],
      },
    ],
  },

  // --- Certifications (rubrique « Certifications ») ---------------------------
  // Une entrée par certification, score de langue, formation ou badge. Exemple :
  //   {
  //     titre: 'SecNumacadémie',
  //     organisme: 'ANSSI',
  //     categorie: 'certification',  // certification, langue, formation ou badge
  //     date: '2026-11',             // AAAA, AAAA-MM ou AAAA-MM-JJ
  //     statut: 'obtenue',           // obtenue ou en cours
  //     detail: '',                  // facultatif : score, niveau…
  //     justificatif: 'docs/certifications/secnumacademie.pdf', // facultatif, fichier dans public/
  //     lien: '',                    // facultatif : page de vérification ou badge en ligne
  //   },
  // N'indiquer que ce qui est réellement obtenu ou en cours.
  // Liste vide = la rubrique affiche « À venir ».
  certifications: [],

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
    { action: 'Started', unite: 'alternance@1life.service', description: 'consultant ERP Open-Prod' },
    { action: 'Mounted', unite: '/srv/nas', description: 'stockage réseau' },
    { action: 'Started', unite: 'jellyfin.service', description: 'serveur multimédia' },
    { action: 'Started', unite: 'caffein.service', description: 'SaaS de facturation' },
  ],
};
