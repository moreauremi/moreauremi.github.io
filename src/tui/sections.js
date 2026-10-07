// Les huit rubriques du menu principal : numéro, libellé, identifiant d'URL
// (#/presentation…) et contenu. Pour réordonner le menu, il suffit de
// réordonner cette liste (les touches 1 à 9 suivent l'ordre).

import { link } from '../router.js';
import {
  presentationBlock,
  alternanceBlock,
  realisationsBlock,
  competencesBlock,
  syntheseBlock,
  veilleBlock,
  certificationsBlock,
  contactBlock,
  mentionsLegalesBlock,
  messageSentBlock,
} from '../blocks/index.js';

export const SECTIONS = [
  {
    id: 'presentation',
    label: 'Présentation',
    render: presentationBlock,
  },
  {
    id: 'alternance',
    label: 'Alternance et parcours',
    render: () => alternanceBlock(link.fiche),
  },
  {
    id: 'realisations',
    label: 'Réalisations',
    render: () => realisationsBlock(link.fiche),
  },
  {
    id: 'competences',
    label: 'Compétences',
    render: () => competencesBlock(link.fiche),
  },
  {
    id: 'synthese',
    label: 'Tableau de synthèse E5',
    render: () => syntheseBlock(link.fiche),
  },
  {
    id: 'veille',
    label: 'Veille technologique',
    render: () => veilleBlock(link.veilleTag),
  },
  {
    id: 'certifications',
    label: 'Certifications',
    render: certificationsBlock,
  },
  {
    id: 'contact',
    label: 'CV et contact',
    render: () => contactBlock(),
  },
].map((section, index) => ({ ...section, key: String(index + 1) }));

// Pages qui ne figurent pas dans le menu : elles s'ouvrent par un lien
// (bas d'écran, formulaire de contact, terminal).
export const EXTRA_PAGES = [
  {
    id: 'mentions-legales',
    label: 'Mentions légales',
    render: mentionsLegalesBlock,
  },
  {
    id: 'message-envoye',
    label: 'Message envoyé',
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
