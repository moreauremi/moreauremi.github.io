// Rubrique « Tableau de synthèse E5 » : tableau croisé réalisations ×
// compétences du référentiel.

import { site, realisations } from '../content.js';
import { escapeHtml, safe } from '../utils/html.js';
import { NEW_TAB } from './shared.js';


// Tableau de synthèse : lien vers le PDF officiel + tableau croisé généré
// automatiquement à partir du champ « competences » de chaque fiche.
export function syntheseBlock(hrefFor) {
  const { synthese } = site.documents;
  const pdf = synthese
    ? `<a href="${escapeHtml(synthese)}" ${NEW_TAB}>Ouvrir le tableau de synthèse (PDF)</a>`
    : '<mark class="ph">[À COMPLÉTER : tableau de synthèse en PDF]</mark>';

  const codes = site.competences;
  const header = codes
    .map((c) => `<th scope="col"><abbr title="${escapeHtml(c.libelle)}">${escapeHtml(c.code)}</abbr></th>`)
    .join('');
  const rows = realisations
    .map(
      (r) => `<tr>
        <th scope="row"><a href="${hrefFor(r.slug)}">${safe(r.titre)}</a></th>
        ${codes
          .map((c) =>
            r.competences.includes(c.code)
              ? '<td><span aria-hidden="true">[X]</span><span class="visually-hidden">oui</span></td>'
              : '<td><span aria-hidden="true">[ ]</span><span class="visually-hidden">non</span></td>',
          )
          .join('')}
      </tr>`,
    )
    .join('');

  return `<div class="prose">
    <p>Document officiel : ${pdf}</p>
    <p>Tableau croisé généré à partir des fiches : chaque ligne est une réalisation, chaque colonne une compétence du référentiel.</p>
  </div>
  <div class="table-scroll" tabindex="0" role="region" aria-label="Tableau croisé des réalisations et des compétences">
    <table class="matrix">
      <thead><tr><th scope="col">Réalisation</th>${header}</tr></thead>
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
