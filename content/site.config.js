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
  },

  // Informations affichées à côté du logo, façon neofetch (dans cet ordre)
  neofetch: [
    ['Utilisateur', 'Rémi Moreau'],
    ['Formation', 'BTS SIO option SISR'],
    ['École', 'MyDigitalSchool Nantes'],
    ['Alternance', '1Life (groupe Visiativ)'],
    ['Poste', 'Consultant ERP Open-Prod'],
    ['Promo', '2026 – 2028'],
    ['Base', 'Nantes'],
  ],

  // --- Adresse publique du site -----------------------------------------------
  // URL complète, terminée par « / » (ex. 'https://portfolio.exemple.fr/').
  // Laisser vide tant qu'il n'y a pas de nom de domaine. Elle sert aux aperçus
  // de lien (Open Graph) : image et adresse doivent y être des URL complètes.
  urlPublique: '',

  // --- Contact ----------------------------------------------------------------
  contact: {
    email: 'remimoreau2006@gmail.com',
    github: 'https://github.com/moreauremi',
    linkedin: 'https://www.linkedin.com/in/remi-moreau-dubois',
  },

  // --- Documents PDF ----------------------------------------------------------
  // 1. Déposer le fichier dans public/docs/ (ex. public/docs/cv.pdf)
  // 2. Indiquer son chemin ici, sans « public/ » : cv: 'docs/cv.pdf'
  // Vide = le site affiche « [À COMPLÉTER] ». Le build vérifie que le fichier existe.
  documents: {
    cv: '',
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
    { action: 'Started', unite: 'arr-stack.target', description: 'automatisation médias' },
    { action: 'Started', unite: 'caffein.service', description: 'SaaS de facturation' },
    { action: 'Started', unite: 'clapvoice.service', description: 'écoute des claquements' },
  ],
};
