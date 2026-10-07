// Rubrique « Alternance et parcours » (content/pages/alternance.md).

import { pages } from '../content.js';
import { realisationList } from './realisations.js';


// Texte de la page « alternance » ; dans RémiOS, suivi de la liste des
// réalisations en entreprise (la vue jury les montre déjà plus bas).
export function alternanceBlock(hrefFor) {
  const fiches = hrefFor
    ? `<section class="fiche-group" aria-labelledby="alternance-fiches">
        <h2 class="block-title" id="alternance-fiches">Réalisations en entreprise</h2>
        ${realisationList('entreprise', hrefFor)}
      </section>`
    : '';
  return `<div class="prose">${pages.alternance.html}</div>${fiches}`;
}
