// Rubrique « Compétences » : savoir-faire technique par domaine
// (savoirFaire dans content/site.config.js).

import { site, getRealisation } from '../content.js';
import { placeholder, safe } from '../utils/html.js';
import { levelBarText, levelName } from '../utils/levels.js';
import { tr } from '../utils/lang.js';


// Savoir-faire par domaine : niveau de maîtrise et fiches qui le prouvent
export function competencesBlock(hrefFor) {
  const { niveaux, domaines } = site.savoirFaire;

  const scale = niveaux
    .map((n, i) => `<dt>${levelBar(i + 1)} ${safe(n.nom)}</dt><dd>${safe(n.description)}</dd>`)
    .join('');

  // Sur petit écran, chaque ligne du tableau devient une petite fiche (voir
  // blocks.css) : les rôles ARIA explicites gardent la structure de tableau
  // pour les lecteurs d'écran, que le changement d'affichage ferait perdre.
  const [skill, levelLabel, practice] = [tr('Compétence', 'Skill'), tr('Niveau', 'Level'), tr('Mise en pratique', 'Put into practice')];
  const tables = domaines
    .map(
      (domaine, i) => `<h2 class="block-title" id="savoir-faire-${i}">${safe(domaine.nom)}</h2>
    <div class="table-scroll" tabindex="0" role="region" aria-labelledby="savoir-faire-${i}">
      <table class="skills" role="table">
        <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">${skill}</th><th scope="col" role="columnheader">${levelLabel}</th><th scope="col" role="columnheader">${practice}</th></tr></thead>
        <tbody role="rowgroup">${domaine.items
          .map(
            (item) => `<tr role="row">
            <th scope="row" role="rowheader">${safe(item.nom)}</th>
            <td class="skills-level" role="cell" data-label="${levelLabel}">${level(item.niveau)}</td>
            <td role="cell" data-label="${practice}">${proofs(item.preuves ?? [], hrefFor)}</td>
          </tr>`,
          )
          .join('')}</tbody>
      </table>
    </div>`,
    )
    .join('');

  return `<div class="prose">
    <p>${tr(
      "Mon savoir-faire technique, domaine par domaine. Chaque compétence renvoie aux réalisations où je l'ai mise en pratique. Les compétences du référentiel BTS SIO sont détaillées dans le tableau de synthèse.",
      'My technical skills, area by area. Each skill links to the projects where I put it into practice. The skills of the BTS SIO framework are detailed in the E5 summary table.',
    )}</p>
  </div>
  <dl class="legend levels" aria-label="${tr('Échelle des niveaux', 'Level scale')}">${scale}</dl>
  ${tables}`;
}

// Barre de niveau en caractères, façon terminal : [####----] pour 2 sur 4,
// [#######-] pour 3,5. Purement visuelle : le nom du niveau est écrit à côté.
function levelBar(value) {
  return `<span class="level-bar" aria-hidden="true">${levelBarText(value, site.savoirFaire.niveaux.length)}</span>`;
}

function level(value) {
  if (value === null) {
    return placeholder('[À COMPLÉTER]') || `<span aria-hidden="true">—</span><span class="visually-hidden">${tr('niveau non renseigné', 'level not set')}</span>`;
  }
  const { niveaux } = site.savoirFaire;
  const number = tr(String(value).replace('.', ','), String(value));
  return `${levelBar(value)} ${safe(levelName(value, niveaux))}<span class="visually-hidden"> (${tr(`niveau ${number} sur ${niveaux.length}`, `level ${number} out of ${niveaux.length}`)})</span>`;
}

// Liens vers les fiches qui prouvent une compétence. Une fiche absente du
// site (brouillon) est simplement ignorée.
function proofs(slugs, hrefFor) {
  const fiches = slugs.map(getRealisation).filter(Boolean);
  if (fiches.length === 0) {
    return `<span aria-hidden="true">—</span><span class="visually-hidden">${tr("aucune fiche pour l'instant", 'no project yet')}</span>`;
  }
  return fiches.map((r) => `<a href="${hrefFor(r.slug)}">${safe(r.titre)}</a>`).join(', ');
}
