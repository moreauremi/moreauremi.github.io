// Les sept rubriques du menu principal : numéro, libellé, identifiant d'URL
// (#/presentation…) et contenu. Pour réordonner le menu, il suffit de
// réordonner cette liste.

import { link } from '../router.js';
import {
  presentationBlock,
  realisationList,
  syntheseBlock,
  veilleBlock,
  contactBlock,
} from '../blocks.js';

export const SECTIONS = [
  {
    id: 'presentation',
    label: 'Présentation',
    render: presentationBlock,
  },
  {
    id: 'entreprise',
    label: 'Réalisations en entreprise',
    render: () =>
      `<p class="intro">Missions réalisées en alternance chez 1Life (part of Visiativ). Chaque réalisation ouvre sa fiche détaillée.</p>
      ${realisationList('entreprise', link.fiche)}`,
  },
  {
    id: 'formation',
    label: 'Réalisations en formation',
    render: () =>
      `<p class="intro">Réalisations menées en cours, à MyDigitalSchool Nantes.</p>
      ${realisationList('formation', link.fiche)}`,
  },
  {
    id: 'perso',
    label: 'Projets personnels',
    render: () =>
      `<p class="intro">Projets menés en dehors des cours et de l'entreprise. Chaque projet ouvre sa fiche détaillée.</p>
      ${realisationList('perso', link.fiche)}`,
  },
  {
    id: 'synthese',
    label: 'Tableau de synthèse',
    render: () => syntheseBlock(link.fiche),
  },
  {
    id: 'veille',
    label: 'Veille technologique',
    render: veilleBlock,
  },
  {
    id: 'contact',
    label: 'CV et contact',
    render: contactBlock,
  },
].map((section, index) => ({ ...section, key: String(index + 1) }));

export function findSection(id) {
  return SECTIONS.find((s) => s.id === id) ?? null;
}
