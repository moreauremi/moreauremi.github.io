// Rubrique « Alternance et parcours » (content/pages/alternance.md).

import { pages } from '../content.js';
import { tr } from '../utils/lang.js';
import { realisationList } from './realisations.js';
import { langAttr, untranslatedNote } from './shared.js';


// Texte de la page « alternance » ; dans RémiOS, suivi de la liste des
// réalisations en entreprise (la vue jury les montre déjà plus bas).
export function alternanceBlock(hrefFor) {
  const fiches = hrefFor
    ? `<section class="fiche-group" aria-labelledby="alternance-fiches">
        <h2 class="block-title" id="alternance-fiches">${tr('Réalisations en entreprise', 'Work projects')}</h2>
        ${realisationList('entreprise', hrefFor)}
      </section>`
    : '';
  const { html, lang } = pages.alternance;
  return `${untranslatedNote(lang)}<div class="prose"${langAttr(lang)}>${html}</div>${fiches}`;
}
