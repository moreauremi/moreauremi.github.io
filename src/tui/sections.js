// Les neuf rubriques du menu principal : numéro, libellé, identifiant d'URL
// (#/presentation…) et contenu. Pour réordonner le menu, il suffit de
// réordonner cette liste (les touches 1 à 9 suivent l'ordre).
// Le libellé est lu au moment de l'affichage (get label) : il suit la langue.

import { link } from '../router.js';
import { tr } from '../utils/lang.js';
import {
  presentationBlock,
  alternanceBlock,
  realisationsBlock,
  competencesBlock,
  syntheseBlock,
  veilleBlock,
  certificationsBlock,
  formationsBlock,
  contactBlock,
  mentionsLegalesBlock,
  messageSentBlock,
} from '../blocks/index.js';

export const SECTIONS = [
  {
    id: 'presentation',
    get label() {
      return tr('Présentation', 'About me');
    },
    render: presentationBlock,
  },
  {
    id: 'alternance',
    get label() {
      return tr('Alternance et parcours', 'Work-study and background');
    },
    render: () => alternanceBlock(link.fiche),
  },
  {
    id: 'realisations',
    get label() {
      return tr('Réalisations', 'Projects');
    },
    render: () => realisationsBlock(link.fiche),
  },
  {
    id: 'competences',
    get label() {
      return tr('Compétences', 'Skills');
    },
    render: () => competencesBlock(link.fiche),
  },
  {
    id: 'synthese',
    get label() {
      return tr('Tableau de synthèse E5', 'E5 summary table');
    },
    render: () => syntheseBlock(link.fiche),
  },
  {
    id: 'veille',
    get label() {
      return tr('Veille technologique', 'Technology watch');
    },
    render: () => veilleBlock(link.veilleTag),
  },
  {
    id: 'formations',
    get label() {
      return tr('Formations', 'Training');
    },
    render: () => formationsBlock(link.fiche),
  },
  {
    id: 'certifications',
    get label() {
      return tr('Certifications', 'Certifications');
    },
    render: certificationsBlock,
  },
  {
    id: 'contact',
    get label() {
      return tr('CV et contact', 'CV and contact');
    },
    render: () => contactBlock(),
  },
].map((section, index) => Object.assign(section, { key: String(index + 1) })); // pas de { ...section } : il figerait le libellé

// Pages qui ne figurent pas dans le menu : elles s'ouvrent par un lien
// (bas d'écran, formulaire de contact, terminal).
export const EXTRA_PAGES = [
  {
    id: 'mentions-legales',
    get label() {
      return tr('Mentions légales', 'Legal notice');
    },
    render: mentionsLegalesBlock,
  },
  {
    id: 'message-envoye',
    get label() {
      return tr('Message envoyé', 'Message sent');
    },
    render: messageSentBlock,
  },
];

// Autres adresses d'une même page : anciennes adresses des rubriques de
// réalisations (avant leur regroupement), pour que les liens déjà partagés
// (#/perso…) mènent à la rubrique « Réalisations », et #/merci.
const ALIASES = {
  entreprise: 'realisations',
  formation: 'realisations',
  perso: 'realisations',
  // Page de confirmation du formulaire, sous le nom réglé chez Web3Forms
  merci: 'message-envoye',
};

export function findSection(id) {
  const target = ALIASES[id] ?? id;
  return [...SECTIONS, ...EXTRA_PAGES].find((s) => s.id === target) ?? null;
}
