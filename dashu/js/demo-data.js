// Fausses données de la démo. Aucun vrai connecteur n'est appelé et rien
// n'est enregistré : recharger la page remet tout à zéro, comme prévu pour la
// démo de dashu.dev.
import { startOfDay, weekdayIndex, addDays } from './util.js';

// Catégories de l'agenda : chacune a ses trois tons dans le CSS (.cat-…)
export const CATEGORY_NAMES = {
  cours: 'Cours',
  alternance: 'Alternance',
  projet: 'Projet',
  perso: 'Perso',
};

// ---------------------------------------------------------------------------
// Connecteurs : chaque vue a les siens. Un widget lit un connecteur ; changer
// de source change donc les données affichées (essayer dans la bibliothèque).
// ---------------------------------------------------------------------------

export const SOURCE_TYPES = {
  ics: 'ICS',
  csv: 'CSV',
  rest: 'REST / JSON',
  rss: 'RSS',
  ping: 'Ping HTTP',
  ha: 'Home Assistant',
  dashu: 'dashu',
};

export const CONNECTORS = {
  'ics-perso': { type: 'ics', name: 'Mon agenda', calendars: ['cours', 'alternance', 'projet', 'perso'] },
  'ics-bts': { type: 'ics', name: 'Agenda BTS SIO2', calendars: ['cours', 'projet'] },
  'ics-foyer': { type: 'ics', name: 'Agenda du foyer', calendars: ['foyer'] },
  'csv-heures': { type: 'csv', name: "Relevé d'heures" },
  'csv-budget': { type: 'csv', name: 'Budget (Google Sheets)' },
  'csv-tickets': { type: 'csv', name: 'Tickets (Google Sheets)' },
  'csv-linky': { type: 'csv', name: 'Compteur électrique' },
  'rest-meteo': { type: 'rest', name: 'API météo' },
  'rest-github': { type: 'rest', name: 'API GitHub' },
  'rss-veille': { type: 'rss', name: 'Veille tech' },
  'ping-homelab': { type: 'ping', name: 'Homelab' },
  'ping-labo': { type: 'ping', name: 'Labo du lycée' },
  'ha-maison': { type: 'ha', name: 'Home Assistant' },
  dashu: { type: 'dashu', name: 'Stocké dans dashu' },
};

// ---------------------------------------------------------------------------
// Agenda : une semaine type qui se répète. Heures en décimal (13.5 = 13:30).
// ---------------------------------------------------------------------------

export const CALENDAR_CATEGORY = { cours: 'cours', alternance: 'alternance', projet: 'projet', perso: 'perso', foyer: 'perso' };

const WEEK = [
  [ // lundi
    { cal: 'cours', title: 'Réseaux : VLAN et routage', start: 8.5, end: 12.5, place: 'Salle B12' },
    { cal: 'cours', title: 'Cybersécurité', start: 13.5, end: 16.5, place: 'Salle B12' },
    { cal: 'perso', title: 'Sport', start: 18.5, end: 20, place: 'Salle de sport' },
    { cal: 'foyer', title: 'Sortir les poubelles', start: 19.5, end: 19.75 },
  ],
  [ // mardi
    { cal: 'cours', title: 'Linux : services et scripts', start: 8.5, end: 12.5, place: 'Salle B14' },
    { cal: 'cours', title: 'Anglais', start: 13.5, end: 15, place: 'Salle A03' },
    { cal: 'projet', title: 'Maquette dashu', start: 15.5, end: 17.5, place: 'CDI' },
    { cal: 'foyer', title: 'Ménage', start: 10, end: 11 },
  ],
  [ // mercredi
    { cal: 'alternance', title: 'Paramétrage ERP', start: 9, end: 12.5, place: 'Bureau' },
    { cal: 'alternance', title: 'Formation client', start: 14, end: 17, place: 'Visio' },
    { cal: 'projet', title: 'Point du groupe', start: 18, end: 19, place: 'Visio' },
    { cal: 'foyer', title: 'Courses en drive', start: 18, end: 18.5 },
  ],
  [ // jeudi
    { cal: 'alternance', title: 'Reprise de données', start: 9, end: 12.5, place: 'Bureau' },
    { cal: 'alternance', title: "Point d'équipe", start: 14, end: 15, place: 'Salle Loire' },
    { cal: 'projet', title: 'Réunion projet dashu', start: 17, end: 18.5, place: 'Discord' },
    { cal: 'perso', title: 'Sport', start: 19, end: 20, place: 'Salle de sport' },
    { cal: 'foyer', title: 'Poubelles jaunes', start: 19.5, end: 19.75 },
  ],
  [ // vendredi
    { cal: 'alternance', title: 'Support utilisateurs', start: 9, end: 12, place: 'Bureau' },
    { cal: 'projet', title: 'Revue de code', start: 13.5, end: 15, place: 'Discord' },
    { cal: 'alternance', title: 'Bilan de la semaine', start: 15.5, end: 16.5, place: 'Bureau' },
    { cal: 'perso', title: 'Cinéma', start: 18.5, end: 20.5, place: 'Centre-ville' },
    { cal: 'foyer', title: 'Livraison colis', start: 10, end: 12 },
    { cal: 'foyer', title: 'Arroser les plantes', start: 18, end: 18.25 },
  ],
  [ // samedi
    { cal: 'perso', title: 'Marché', start: 10, end: 11, place: 'Place du marché' },
    { cal: 'perso', title: 'Match de foot', start: 15, end: 17, place: 'Stade' },
    { cal: 'foyer', title: 'Lessive', start: 9, end: 10 },
  ],
  [ // dimanche
    { cal: 'perso', title: 'Repas de famille', start: 12, end: 14.5, place: 'Chez les parents' },
    { cal: 'foyer', title: 'Préparer la semaine', start: 18, end: 19 },
  ],
];

// Événements d'un jour, pour une liste d'agendas, triés par heure
export function eventsOn(date, calendars) {
  const day = startOfDay(date);
  return WEEK[weekdayIndex(day)]
    .filter((e) => calendars.includes(e.cal))
    .map((e) => ({ ...e, date: day, category: CALENDAR_CATEGORY[e.cal] }))
    .sort((a, b) => a.start - b.start);
}

// Lundi de la semaine à afficher : celle en cours, ou la suivante le week-end
export function displayedMonday(now) {
  const today = startOfDay(now);
  const i = weekdayIndex(today);
  return addDays(today, i <= 4 ? -i : 7 - i);
}

// ---------------------------------------------------------------------------
// Données par connecteur
// ---------------------------------------------------------------------------

const METRICS = {
  'csv-heures': { value: 84, unit: 'h', label: 'ce mois-ci', delta: '+12 % par rapport à septembre', trend: 'up', spark: [58, 66, 71, 64, 77, 84] },
  'csv-budget': { value: 412, unit: '€', label: 'restants sur 900 €', delta: '−38 € cette semaine', trend: 'down', spark: [900, 815, 760, 610, 450, 412] },
  'csv-tickets': { value: 12, unit: '', label: 'tickets ouverts', delta: '−3 depuis lundi', trend: 'down', spark: [9, 14, 17, 15, 13, 12] },
  'csv-linky': { value: 236, unit: 'kWh', label: 'ce mois-ci', delta: "−6 % par rapport à l'an dernier", trend: 'down', spark: [262, 251, 240, 248, 239, 236] },
  'rest-github': { value: 128, unit: '', label: 'étoiles sur GitHub', delta: '+9 cette semaine', trend: 'up', spark: [61, 74, 88, 97, 119, 128] },
};

const SERIES = {
  'csv-budget': { unit: '€', caption: 'par semaine', points: [['S40', 120], ['S41', 86], ['S42', 140], ['S43', 95], ['S44', 64]] },
  'csv-linky': { unit: 'kWh', caption: 'par jour, 7 derniers jours', points: [['sam', 11.2], ['dim', 10.4], ['lun', 8.2], ['mar', 7.5], ['mer', 9.1], ['jeu', 6.8], ['ven', 7.9]] },
  'csv-tickets': { unit: '', caption: 'ouverts par semaine', points: [['S40', 9], ['S41', 14], ['S42', 17], ['S43', 15], ['S44', 12]] },
  'csv-heures': { unit: 'h', caption: 'par semaine', points: [['S40', 21], ['S41', 18], ['S42', 24], ['S43', 22], ['S44', 19]] },
  'rest-github': { unit: '', caption: 'nouvelles étoiles par mois', points: [['juin', 12], ['juil.', 13], ['août', 14], ['sept.', 9], ['oct.', 31]] },
};

const TABLES = {
  'csv-tickets': {
    columns: [
      { key: 'id', label: 'N°', width: '56px', numeric: true },
      { key: 'subject', label: 'Sujet' },
      { key: 'who', label: 'Assigné', width: '84px' },
      { key: 'status', label: 'Statut', width: '84px' },
    ],
    rows: [
      { id: 142, subject: 'Imprimante salle B12 hors ligne', who: 'Inès', status: 'Ouvert' },
      { id: 141, subject: 'Mot de passe AD expiré', who: 'Rémi', status: 'En cours' },
      { id: 139, subject: 'VLAN invités sans DHCP', who: 'Lucas', status: 'En cours' },
      { id: 137, subject: 'Sauvegarde du NAS en échec', who: 'Rémi', status: 'Ouvert' },
      { id: 135, subject: 'Licence Office à renouveler', who: 'Sarah', status: 'Résolu' },
      { id: 133, subject: 'Wi-Fi lent au CDI', who: 'Lucas', status: 'Résolu' },
      { id: 130, subject: 'Poste 14 qui redémarre seul', who: 'Inès', status: 'Résolu' },
    ],
  },
  'csv-budget': {
    columns: [
      { key: 'date', label: 'Date', width: '64px' },
      { key: 'label', label: 'Libellé' },
      { key: 'amount', label: 'Montant', width: '84px', numeric: true, unit: ' €' },
    ],
    rows: [
      { date: '29/10', label: 'Courses', amount: 38 },
      { date: '28/10', label: 'Abonnement téléphone', amount: 12 },
      { date: '27/10', label: 'Essence', amount: 45 },
      { date: '25/10', label: 'Cinéma', amount: 11 },
      { date: '24/10', label: 'Courses', amount: 52 },
      { date: '22/10', label: 'Livre de réseau', amount: 29 },
    ],
  },
};

const JSON_SAMPLES = {
  'rest-github': {
    url: 'api.github.com/repos/exemple/dashu',
    fields: [['stargazers_count', '128'], ['forks_count', '14'], ['open_issues_count', '6'], ['default_branch', 'main'], ['pushed_at', 'il y a 2 h']],
  },
  'rest-meteo': {
    url: 'api.open-meteo.com/v1/forecast',
    fields: [['current.temperature_2m', '14 °C'], ['current.relative_humidity_2m', '82 %'], ['current.wind_speed_10m', '18 km/h'], ['daily.precipitation_sum[0]', '4,2 mm']],
  },
};

const SERVICES = {
  'ping-homelab': [
    { name: 'Jellyfin', ok: true, ms: 12 },
    { name: 'Nextcloud', ok: false, since: '8 min' },
    { name: 'Home Assistant', ok: true, ms: 9 },
    { name: 'Portfolio', ok: true, ms: 41 },
    { name: 'Proxmox', ok: true, ms: 3 },
  ],
  'ping-labo': [
    { name: 'GLPI', ok: true, ms: 24 },
    { name: 'Contrôleur AD', ok: true, ms: 6 },
    { name: 'VPN', ok: true, ms: 31 },
    { name: 'Site vitrine', ok: true, ms: 88 },
  ],
};

const WEATHER = {
  place: 'Nantes',
  temp: 14,
  condition: 'Averses',
  icon: 'rain',
  min: 9,
  max: 15,
  hours: [['12 h', 14, 'rain'], ['15 h', 15, 'cloud'], ['18 h', 12, 'cloud'], ['21 h', 10, 'moon']],
};

const FEED = [
  { title: 'Sauvegardes : la règle 3-2-1 appliquée à un homelab', source: 'Le carnet du homelab', age: 'il y a 2 h', fresh: true },
  { title: 'Docker Compose : ranger ses secrets hors du dépôt Git', source: 'Journal du dev', age: 'il y a 4 h', fresh: true },
  { title: 'VLAN : isoler les objets connectés du reste du réseau', source: 'Réseau facile', age: 'il y a 6 h', fresh: true },
  { title: 'Wi-Fi 7 : ce qui change vraiment pour une box', source: 'Réseau facile', age: 'hier' },
  { title: 'ERP : réussir une reprise de données en cinq étapes', source: 'Le mag de la gestion', age: 'hier' },
  { title: 'Passkeys : où en est la connexion sans mot de passe', source: 'Sécurité au quotidien', age: 'il y a 2 j' },
  { title: 'Home Assistant : bien choisir ses automatisations', source: 'Le carnet du homelab', age: 'il y a 3 j' },
  { title: 'IPv6 à la maison : par où commencer', source: 'Journal du dev', age: 'il y a 3 j' },
];

const LINKS = [
  { name: 'GitHub', url: 'https://github.com', mono: 'GH' },
  { name: 'Portfolio', url: 'https://remim.me', mono: 'RM' },
  { name: 'Docker', url: 'https://docs.docker.com', mono: 'DK' },
  { name: 'MDN', url: 'https://developer.mozilla.org/fr/', mono: 'MD' },
  { name: 'Home Assistant', url: 'https://www.home-assistant.io', mono: 'HA' },
  { name: 'Wikipédia', url: 'https://fr.wikipedia.org', mono: 'WP' },
];

// ---------------------------------------------------------------------------
// Vues et dispositions de départ
// ---------------------------------------------------------------------------

// Raccourci : W('id', 'type', [x, y, w, h], 'Titre', 'connecteur', { réglages })
const W = (id, type, [x, y, w, h], title, source, settings = {}) =>
  ({ id, type, x, y, w, h, title, source, refresh: 15, settings });

const NOTE_IDEES = "Widget « prochain bus » avec l'API de la TAN.\nMode kiosque pour la tablette de l'entrée.\nDemander l'avis du groupe sur la licence.";
const NOTE_PERSO = 'Dentiste mardi à 17 h.\nRendre le livre à la médiathèque avant le 8.\nRenouveler la carte de bus.';
const NOTE_E5 = 'Dépôt sur Moodle vendredi 18 h au plus tard. Chaque fiche doit avoir ses captures et ses compétences cochées.';

function views() {
  return [
    {
      id: 'generale',
      name: 'Générale',
      heading: 'Vue générale',
      connectors: Object.keys(CONNECTORS),
      widgets: [
        W('g-agenda', 'agenda-semaine', [1, 1, 6, 4], 'Agenda', 'ics-perso'),
        W('g-today', 'aujourdhui', [7, 1, 3, 2], "Aujourd'hui", 'ics-perso'),
        W('g-meteo', 'meteo', [10, 1, 3, 1], 'Météo', 'rest-meteo'),
        W('g-maison', 'appareil', [10, 2, 3, 3], 'Maison', 'ha-maison'),
        W('g-taches', 'taches', [7, 3, 3, 2], 'Tâches', 'dashu', { list: 'perso' }),
        W('g-heures', 'chiffre', [1, 5, 3, 2], "Heures d'alternance", 'csv-heures'),
        W('g-notes', 'notes', [4, 5, 3, 2], 'Notes', 'dashu', { heading: 'Idées pour dashu', text: NOTE_IDEES }),
        W('g-services', 'services', [7, 5, 3, 2], 'Services', 'ping-homelab'),
        W('g-liens', 'liens', [10, 5, 3, 2], 'Liens', 'dashu'),
      ],
    },
    {
      id: 'perso',
      name: 'Perso',
      heading: 'Vue perso',
      connectors: ['ics-perso', 'rest-meteo', 'rss-veille', 'csv-budget', 'csv-heures', 'rest-github'],
      widgets: [
        W('p-veille', 'rss', [1, 1, 4, 4], 'Veille', 'rss-veille'),
        W('p-meteo', 'meteo', [5, 1, 3, 1], 'Météo', 'rest-meteo'),
        W('p-next', 'prochain', [5, 2, 3, 2], 'Prochain événement', 'ics-perso'),
        W('p-taches', 'taches', [5, 4, 3, 3], 'À faire', 'dashu', { list: 'perso' }),
        W('p-depenses', 'graphique', [8, 1, 5, 3], 'Dépenses', 'csv-budget'),
        W('p-budget', 'chiffre', [8, 4, 3, 2], 'Budget du mois', 'csv-budget'),
        W('p-notes', 'notes', [1, 5, 4, 2], 'Notes', 'dashu', { heading: 'À ne pas oublier', text: NOTE_PERSO }),
      ],
    },
    {
      id: 'equipe',
      name: 'Équipe',
      heading: 'Équipe BTS SIO2',
      connectors: ['ics-bts', 'csv-tickets', 'ping-labo', 'rest-github'],
      widgets: [
        W('e-agenda', 'agenda-semaine', [1, 1, 6, 4], 'Agenda commun', 'ics-bts'),
        W('e-tickets', 'tableau', [7, 1, 6, 3], 'Tickets', 'csv-tickets'),
        W('e-taches', 'taches', [7, 4, 3, 3], 'Tâches du groupe', 'dashu', { list: 'equipe' }),
        W('e-labo', 'services', [10, 4, 3, 2], 'Labo', 'ping-labo'),
        W('e-ouverts', 'chiffre', [1, 5, 3, 2], 'Tickets ouverts', 'csv-tickets'),
        W('e-annonce', 'notes', [4, 5, 3, 2], 'Annonce', 'dashu', { heading: 'Rendu du dossier E5', text: NOTE_E5 }),
      ],
    },
    {
      id: 'maison',
      name: 'Maison',
      heading: 'Maison',
      connectors: ['ha-maison', 'ics-foyer', 'rest-meteo', 'csv-linky'],
      widgets: [
        W('m-lumieres', 'appareil', [1, 1, 3, 3], 'Lumières', 'ha-maison'),
        W('m-chauffage', 'thermostat', [4, 1, 3, 3], 'Chauffage', 'ha-maison'),
        W('m-meteo', 'meteo', [7, 1, 3, 1], 'Météo', 'rest-meteo'),
        W('m-scenes', 'scene', [7, 2, 3, 2], 'Scènes', 'ha-maison'),
        W('m-courses', 'taches', [10, 1, 3, 4], 'Courses', 'dashu', { list: 'courses' }),
        W('m-conso', 'graphique', [1, 4, 6, 3], 'Consommation', 'csv-linky'),
        W('m-foyer', 'aujourdhui', [7, 4, 3, 3], 'Agenda du foyer', 'ics-foyer'),
      ],
    },
  ];
}

const task = (text, done = false) => ({ id: Math.random().toString(36).slice(2, 9), text, done });

// État complet de la démo, recréé à neuf à chaque appel
export function createDemoState() {
  return {
    views: views(),
    metrics: structuredClone(METRICS),
    series: structuredClone(SERIES),
    tables: structuredClone(TABLES),
    json: structuredClone(JSON_SAMPLES),
    services: structuredClone(SERVICES),
    weather: { 'rest-meteo': structuredClone(WEATHER) },
    feed: { 'rss-veille': structuredClone(FEED) },
    links: structuredClone(LINKS),
    tasks: {
      perso: [
        task("Envoyer le relevé d'heures"),
        task("Préparer l'oral E5"),
        task('Mettre à jour le portfolio'),
        task('Réviser le cours VLAN', true),
        task('Sauvegarder le NAS'),
        task('Racheter du café', true),
      ],
      equipe: [
        task('Rédiger le cahier des charges', true),
        task('Configurer le VLAN invités'),
        task('Tester la restauration des sauvegardes'),
        task('Préparer la démo de jeudi'),
        task("Relire la doc d'installation", true),
      ],
      courses: [
        task('Lait'), task('Pâtes'), task('Café'), task('Lessive'), task('Pommes'), task('Pain', true),
      ],
    },
    devices: [
      { id: 'salon', name: 'Salon', kind: 'light', on: true },
      { id: 'cuisine', name: 'Cuisine', kind: 'light', on: false },
      { id: 'chambre', name: 'Chambre', kind: 'light', on: false },
      { id: 'bureau', name: 'Bureau', kind: 'light', on: true },
      { id: 'entree', name: 'Entrée', kind: 'light', on: false },
      { id: 'cafe', name: 'Machine à café', kind: 'plug', on: false },
    ],
    thermostat: { room: 'Salon', current: 20.5, target: 21, humidity: 54, limit: 23 },
    scene: null,
  };
}
