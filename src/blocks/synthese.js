// Rubrique « Tableau de synthèse E5 » : tableau croisé réalisations ×
// compétences du référentiel.

import { site, realisations } from '../content.js';
import { escapeHtml, placeholder, safe } from '../utils/html.js';
import { tr } from '../utils/lang.js';
import { NEW_TAB } from './shared.js';


// Tableau de synthèse : lien vers le PDF officiel + tableau croisé généré
// automatiquement à partir du champ « competences » de chaque fiche.
export function syntheseBlock(hrefFor) {
  const { synthese } = site.documents;
  const pdf = synthese
    ? `<a href="${escapeHtml(synthese)}" ${NEW_TAB}>${tr('Ouvrir le tableau de synthèse (PDF)', 'Open the summary table (PDF, in French)')}</a>`
    : placeholder('[À COMPLÉTER : tableau de synthèse en PDF]');

  const codes = site.competences;
  const header = codes
    .map((c) => `<th scope="col"><abbr title="${escapeHtml(c.libelle)}">${escapeHtml(c.code)}</abbr></th>`)
    .join('');
  const [yes, no] = [tr('oui', 'yes'), tr('non', 'no')];
  const rows = realisations
    .map(
      (r) => `<tr>
        <th scope="row"><a href="${hrefFor(r.slug)}">${safe(r.titre)}</a></th>
        ${codes
          .map((c) =>
            r.competences.includes(c.code)
              ? `<td><span aria-hidden="true">[X]</span><span class="visually-hidden">${yes}</span></td>`
              : `<td><span aria-hidden="true">[ ]</span><span class="visually-hidden">${no}</span></td>`,
          )
          .join('')}
      </tr>`,
    )
    .join('');

  return `<div class="prose">
    ${pdf ? `<p>${tr('Document officiel :', 'Official document:')} ${pdf}</p>` : ''}
    <p>${tr(
      'Tableau croisé généré à partir des fiches : chaque ligne est une réalisation, chaque colonne une compétence du référentiel.',
      'Cross-reference table generated from the project pages: each row is a project, each column a skill of the BTS SIO framework (block 1 of the E5 exam).',
    )}</p>
  </div>
  <div class="table-scroll" tabindex="0" role="region" aria-label="${tr('Tableau croisé des réalisations et des compétences', 'Projects and skills cross-reference table')}">
    <table class="matrix">
      <thead><tr><th scope="col">${tr('Réalisation', 'Project')}</th>${header}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <dl class="legend">${codes.map((c) => `<dt>${escapeHtml(c.code)}</dt><dd>${safe(c.libelle)}${criteresList(c)}</dd>`).join('')}</dl>`;
}

// Savoir-faire détaillés d'une compétence, tels qu'ils figurent dans le
// tableau de synthèse officiel
function criteresList(competence) {
  const criteres = competence.criteres ?? [];
  return criteres.length ? `<ul class="legend-criteres">${criteres.map((c) => `<li>${safe(c)}</li>`).join('')}</ul>` : '';
}
