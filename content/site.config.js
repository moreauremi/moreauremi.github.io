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
    sujet: null,
  },

  // --- Compétences du référentiel ---------------------------------------------
  // Codes à utiliser dans le champ « competences » des fiches (ex. [C1, C4]).
  // À remplacer par la grille officielle du tableau de synthèse de l'école.
  competences: [
    { code: 'C1', libelle: '[À COMPLÉTER : compétence 1 du référentiel]' },
    { code: 'C2', libelle: '[À COMPLÉTER : compétence 2 du référentiel]' },
    { code: 'C3', libelle: '[À COMPLÉTER : compétence 3 du référentiel]' },
    { code: 'C4', libelle: '[À COMPLÉTER : compétence 4 du référentiel]' },
    { code: 'C5', libelle: '[À COMPLÉTER : compétence 5 du référentiel]' },
    { code: 'C6', libelle: '[À COMPLÉTER : compétence 6 du référentiel]' },
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
