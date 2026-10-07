// Rubrique « Compétences » : savoir-faire technique par domaine
// (savoirFaire dans content/site.config.js).

import { site, getRealisation } from '../content.js';
import { safe } from '../utils/html.js';
import { levelBarText, levelName } from '../utils/levels.js';


// Savoir-faire par domaine : niveau de maîtrise et fiches qui le prouvent
export function competencesBlock(hrefFor) {
  const { niveaux, domaines } = site.savoirFaire;

  const scale = niveaux
    .map((n, i) => `<dt>${levelBar(i + 1)} ${safe(n.nom)}</dt><dd>${safe(n.description)}</dd>`)
    .join('');

  // Sur petit écran, chaque ligne du tableau devient une petite fiche (voir
  // blocks.css) : les rôles ARIA explicites gardent la structure de tableau
  // pour les lecteurs d'écran, que le changement d'affichage ferait perdre.
  const tables = domaines
    .map(
      (domaine, i) => `<h2 class="block-title" id="savoir-faire-${i}">${safe(domaine.nom)}</h2>
    <div class="table-scroll" tabindex="0" role="region" aria-labelledby="savoir-faire-${i}">
      <table class="skills" role="table">
        <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Compétence</th><th scope="col" role="columnheader">Niveau</th><th scope="col" role="columnheader">Mise en pratique</th></tr></thead>
        <tbody role="rowgroup">${domaine.items
          .map(
            (item) => `<tr role="row">
            <th scope="row" role="rowheader">${safe(item.nom)}</th>
            <td class="skills-level" role="cell" data-label="Niveau">${level(item.niveau)}</td>
            <td role="cell" data-label="Mise en pratique">${proofs(item.preuves ?? [], hrefFor)}</td>
          </tr>`,
          )
          .join('')}</tbody>
      </table>
    </div>`,
    )
    .join('');

  return `<div class="prose">
    <p>Mon savoir-faire technique, domaine par domaine. Chaque compétence renvoie aux réalisations où je l'ai mise en pratique. Les compétences du référentiel BTS SIO sont détaillées dans le tableau de synthèse.</p>
  </div>
  <dl class="legend levels" aria-label="Échelle des niveaux">${scale}</dl>
  ${tables}`;
}

// Barre de niveau en caractères, façon terminal : [####----] pour 2 sur 4,
// [#######-] pour 3,5. Purement visuelle : le nom du niveau est écrit à côté.
function levelBar(value) {
  return `<span class="level-bar" aria-hidden="true">${levelBarText(value, site.savoirFaire.niveaux.length)}</span>`;
}

function level(value) {
  if (value === null) return '<mark class="ph">[À COMPLÉTER]</mark>';
  const { niveaux } = site.savoirFaire;
  const number = String(value).replace('.', ',');
  return `${levelBar(value)} ${safe(levelName(value, niveaux))}<span class="visually-hidden"> (niveau ${number} sur ${niveaux.length})</span>`;
}

// Liens vers les fiches qui prouvent une compétence. Une fiche absente du
// site (brouillon) est simplement ignorée.
function proofs(slugs, hrefFor) {
  const fiches = slugs.map(getRealisation).filter(Boolean);
  if (fiches.length === 0) {
    return '<span aria-hidden="true">—</span><span class="visually-hidden">aucune fiche pour l\'instant</span>';
  }
  return fiches.map((r) => `<a href="${hrefFor(r.slug)}">${safe(r.titre)}</a>`).join(', ');
}
