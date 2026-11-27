// =============================================================================
// Configuration du contenu du portfolio
// -----------------------------------------------------------------------------
// C'est ici que se modifient les informations du site, sans toucher au code.
// Les fiches de réalisation sont dans content/realisations/ (une par fichier),
// la veille dans content/veille/ et content/pages/veille.md.
//
// Style des textes : minuscules, sauf noms propres et sigles ; phrases courtes.
// Tout texte « [À COMPLÉTER : …] » s'affiche surligné avec `npm run dev` : c'est
// le signal de ce qui reste à remplir. Le site publié ne les montre pas.
// =============================================================================

export default {
  // --- Identité ---------------------------------------------------------------
  identite: {
    nom: 'Rémi Moreau',
  },

  // --- Carte de l'accueil -----------------------------------------------------
  // Quatre lignes, dans cet ordre : nom (affiché en minuscules), formation et
  // alternance, ce que je fais, ville.
  accueil: {
    formation: 'BTS SIO option SLAM · MyDigitalSchool Nantes',
    alternance: 'alternant consultant ERP chez 1Life (groupe Visiativ)',
    activite: "je fais le lien entre les besoins des utilisateurs et l'ERP Open-Prod",
    ville: 'Nantes',
  },

  // --- Adresse publique du site -----------------------------------------------
  // URL complète, terminée par « / ». Sert aux aperçus de lien (Open Graph),
  // aux adresses canoniques et au plan du site.
  urlPublique: 'https://remim.me/',

  // --- Référencement ----------------------------------------------------------
  referencement: {
    // Titre de l'accueil (onglet et résultats de recherche)
    titre: 'Rémi Moreau · portfolio BTS SIO SLAM',
    // Description de l'accueil (idéalement moins de 160 caractères)
    description:
      'Portfolio de Rémi Moreau, étudiant en BTS SIO option SLAM à MyDigitalSchool Nantes et consultant ERP en alternance chez 1Life : projets, formations, veille.',
    poste: 'Consultant ERP en alternance',
    entreprise: '1Life',
    groupe: 'Visiativ',
    ecole: 'MyDigitalSchool Nantes',
    ville: 'Nantes',
    // Domaines de compétence (données structurées schema.org)
    domaines: ['ERP Open-Prod', 'SQL', 'PostgreSQL', 'Python', 'JavaScript', 'Linux', 'Docker'],
  },

  // --- Contact ----------------------------------------------------------------
  contact: {
    email: 'remimoreau2006@gmail.com',
    github: 'https://github.com/moreauremi',
    linkedin: 'https://www.linkedin.com/in/remi-moreau-dubois',
  },

  // --- Formulaire de contact (page contact/) ----------------------------------
  // Le site est statique : Web3Forms (gratuit) reçoit le formulaire et
  // transfère le message par e-mail, sans le conserver. Cette clé n'est pas un
  // secret : elle est faite pour figurer dans la page.
  // Vide = pas de formulaire, seul le lien e-mail est affiché.
  formulaire: {
    cle: 'b50721de-2c4b-4c0c-9b1e-c16876ec32e9',
  },

  // --- Mesure d'audience ------------------------------------------------------
  // GoatCounter (sans cookie) compte les pages vues ; src/audience.js envoie
  // lui-même la requête, sans charger de script extérieur. Pour ne pas compter
  // ses propres visites : ouvrir une fois https://remim.me/#toggle-goatcounter
  // sur chaque appareil. Vide = aucune mesure.
  audience: {
    goatcounter: 'https://remim.goatcounter.com',
  },

  // --- Documents PDF (dans public/) -------------------------------------------
  documents: {
    cv: 'docs/cv-remi-moreau.pdf',
  },

  // --- Mention de l'IA sur les fiches -----------------------------------------
  // Une fiche qui indique « ia: <clé> » affiche le texte correspondant.
  mentionsIa: {
    'claude-code': 'réalisé avec Claude Code. mon rôle : définir le besoin, faire les choix et tester.',
    claude:
      "dépannage mené avec l'aide de Claude (IA), qui a aussi écrit le script et mis en forme la documentation. mon rôle : faire les manipulations sur le matériel, faire les choix et tester.",
  },

  // --- Veille technologique ---------------------------------------------------
  // Trois sujets, une section chacun sur la page veille/.
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
    //   id         nom du dossier content/veille/<id>/ et de l'ancre veille/#<id>
    //              (minuscules, chiffres et tirets)
    //   nom        nom court
    //   sujet      intitulé complet, titre de la section
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
        sujet: 'Cybersécurité des ERP et des PME industrielles',
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
        id: 'intelligence-artificielle',
        nom: 'Intelligence artificielle',
        sujet: "L'intelligence artificielle dans les entreprises : usages, risques et encadrement",
        motsCles: [
          'intelligence artificielle', 'IA', 'IA générative', 'AI', 'GenAI', 'LLM',
          'modèle de langage', 'modèles de langage', 'agent IA', 'agents IA', 'IA agentique',
          'ChatGPT', 'OpenAI', 'Copilot', 'Microsoft Copilot', 'GitHub Copilot', 'Gemini',
          'Claude', 'Anthropic', 'Mistral', 'Mistral AI', 'Llama', 'DeepSeek',
          'apprentissage automatique', 'machine learning', 'AI Act', "règlement sur l'IA",
        ],
        contexte: ['PME', 'TPE', 'ETI', 'industrie', 'entreprise', 'entreprises', 'ERP', 'salariés', 'RGPD', 'CNIL', 'cybersécurité'],
        utile: "usages concrets de l'IA en entreprise (assistants, agents, automatisation, IA dans les ERP et les outils du quotidien), nouveaux modèles et outils marquants, risques (fuite de données, erreurs, attaques utilisant l'IA, shadow AI), réglementation (AI Act, RGPD, recommandations de la CNIL), coûts, retours d'expérience et chiffres d'adoption",
        pourQui: 'une PME, en particulier industrielle, qui veut utiliser l\'IA sans prendre de risques',
        parSemaine: 6,
        tags: [
          'IA générative', 'agents IA', 'nouveau modèle', 'usages en entreprise', 'productivité',
          'cybersécurité', 'données personnelles', 'AI Act', 'réglementation', 'souveraineté',
          'coûts', 'emploi', 'ERP',
        ],
        flux: [
          { nom: 'ActuIA', url: 'https://www.actuia.com/feed/', specialise: true },
          { nom: 'Le Monde Informatique, IA', url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/intelligence-artificielle/rss.xml', specialise: true },
          { nom: 'CNIL', url: 'https://www.cnil.fr/fr/rss.xml', specialise: false },
          { nom: 'IT-Connect', url: 'https://www.it-connect.fr/feed/', specialise: false },
          { nom: 'LeMagIT', url: 'https://www.lemagit.fr/rss/ContentSyndication.xml', specialise: false },
          { nom: 'Silicon', url: 'https://www.silicon.fr/feed', specialise: false },
          { nom: 'ZDNet France', url: 'https://www.zdnet.fr/feeds/rss/actualites/', specialise: false },
          { nom: 'Next', url: 'https://next.ink/feed/', specialise: false },
          { nom: 'Journal du Net', url: 'https://www.journaldunet.com/rss/', specialise: false },
          { nom: 'Siècle Digital', url: 'https://siecledigital.fr/feed/', specialise: false },
          { nom: 'Blog du Modérateur', url: 'https://www.blogdumoderateur.com/feed/', specialise: false },
        ],
      },
      {
        id: 'facturation-electronique',
        nom: 'Facturation électronique',
        sujet: 'La facturation électronique obligatoire (réforme 2026-2027)',
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
  // Codes utilisables dans les tags des fiches (ex. B1.4) : le libellé
  // s'affiche au survol. Bloc 1 de l'épreuve E5.
  competences: [
    { code: 'B1.1', libelle: 'Gérer le patrimoine informatique' },
    { code: 'B1.2', libelle: 'Répondre aux incidents et aux demandes d’assistance et d’évolution' },
    { code: 'B1.3', libelle: 'Développer la présence en ligne de l’organisation' },
    { code: 'B1.4', libelle: 'Travailler en mode projet' },
    { code: 'B1.5', libelle: 'Mettre à disposition des utilisateurs un service informatique' },
    { code: 'B1.6', libelle: 'Organiser son développement professionnel' },
  ],

  // --- Formations et badges (page formations/) --------------------------------
  // Une entrée par formation ou badge :
  //   titre, organisme, categorie (formation ou badge), date (AAAA, AAAA-MM
  //   ou AAAA-MM-JJ), statut (facultatif : obtenue ou en cours),
  //   description (une ligne), fiche (facultatif : slug de la réalisation
  //   liée, lien affiché une fois publiée), justificatif (fichier dans
  //   public/), lien (page de vérification).
  // N'indiquer que ce qui est réellement suivi ou obtenu.
  formations: [
    {
      titre: 'QWeb : rapports Open-Prod',
      organisme: '1Life',
      categorie: 'formation',
      date: '2026-10-15', // première journée
      statut: 'en cours', // passer à « obtenue » après la seconde journée
      description: 'deux journées : créer et modifier des rapports Open-Prod (devis, factures) avec QWeb, en vue graphique puis en XML.',
      fiche: 'rapports-qweb',
    },
    {
      titre: 'indicateurs et tableaux de bord Open-Prod',
      organisme: '1Life',
      categorie: 'formation',
      date: '2026-10',
      description: "données PostgreSQL extraites dans Excel par ODBC, graphiques, puis tableaux de bord dans le tableur intégré d'Open-Prod.",
    },
    {
      titre: 'MCD et reprise de données Open-Prod',
      organisme: '1Life',
      categorie: 'formation',
      date: '2026-10',
      description: "lecture du modèle conceptuel de données d'Open-Prod, puis préparation des imports Excel avec RECHERCHEV et RECHERCHEX.",
      fiche: 'reprise-donnees-open-prod',
    },
    {
      titre: 'Claude Code 101',
      organisme: 'Anthropic (Claude Academy)',
      categorie: 'badge',
      date: '2026-11-16',
      statut: 'obtenue',
      justificatif: 'docs/certifications/claude-code-101.pdf',
      lien: 'https://academy.claude.com/verify/50689eb47e290b9c3abc1fa18657c6f9',
    },
    {
      titre: 'Claude Code in Action',
      organisme: 'Anthropic (Claude Academy)',
      categorie: 'badge',
      date: '2026-11-16',
      statut: 'obtenue',
      justificatif: 'docs/certifications/claude-code-in-action.pdf',
      lien: 'https://academy.claude.com/verify/00a04007e0c63aef2c341c1e5ca78024',
    },
    {
      titre: 'Introduction to Model Context Protocol',
      organisme: 'Anthropic (Claude Academy)',
      categorie: 'badge',
      date: '2026-11-16',
      statut: 'obtenue',
      justificatif: 'docs/certifications/introduction-model-context-protocol.pdf',
      lien: 'https://academy.claude.com/verify/31bc905f25153b6b1eb2cdc0407801a7',
    },
  ],

  // --- Mentions légales (page mentions-legales/) ------------------------------
  // Obligatoires pour un site publié en France (LCEN, article 6).
  mentionsLegales: {
    hebergeur: {
      nom: 'GitHub, Inc. (service GitHub Pages)',
      adresse: '88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis',
      site: 'https://pages.github.com',
      confidentialite: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
    },
    codeSource: 'https://github.com/moreauremi/moreauremi.github.io',
  },
};
