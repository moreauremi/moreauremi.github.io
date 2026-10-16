// Rubrique « Réalisations », fiches de réalisation (content/realisations/) et
// pages des technos (toutes les réalisations qui utilisent une techno).
//
// `hrefFor(slug)` : lien d'une fiche ; `hrefForTechno(slug)` : lien de la page
// d'une techno (#/technos/<techno> dans RémiOS, #/jury/technos/<techno> dans
// la vue jury).

import { realisationsOfType, realisationsByTechno, technos, technoSlug, competenceLabel, TYPES } from '../content.js';
import { escapeHtml, hasPlaceholder, placeholder, safe } from '../utils/html.js';
import { formatDate } from '../utils/dates.js';


// Les trois groupes de réalisations : entreprise, formation, projets personnels
export function realisationsBlock(hrefFor) {
  const groups = Object.entries(TYPES)
    .map(
      ([type, { group, intro }]) => `<section class="fiche-group" aria-labelledby="groupe-${type}">
      <h2 class="block-title" id="groupe-${type}">${group}</h2>
      <p class="intro">${intro}</p>
      ${realisationList(type, hrefFor)}
    </section>`,
    )
    .join('');
  return `<p class="intro">Chaque réalisation ouvre sa fiche détaillée : contexte, objectifs, mise en œuvre, résultats.</p>${groups}`;
}

// Liste des réalisations d'un type (entreprise, formation, perso)
export function realisationList(type, hrefFor) {
  const items = realisationsOfType(type);
  if (items.length === 0) return '<p class="empty">À venir.</p>';
  return ficheLinks(items, hrefFor);
}

// Liste de fiches : titre (lien vers la fiche) et résumé
function ficheLinks(items, hrefFor) {
  return `<ul class="fiche-list" data-nav-list>${items
    .map(
      (r) => `
    <li>
      <a class="fiche-link" href="${hrefFor(r.slug)}">
        <span class="fiche-link-title">${safe(r.titre)}${draftBadge(r)}</span>
        ${r.resume ? `<span class="fiche-link-summary">${safe(r.resume)}</span>` : ''}
      </a>
    </li>`,
    )
    .join('')}
  </ul>`;
}

// Repère « brouillon » : n'apparaît qu'en développement, puisque les fiches
// en brouillon sont retirées du site publié.
function draftBadge(r) {
  return r.brouillon ? ' <span class="draft-badge">brouillon, non publié</span>' : '';
}

// Caractéristiques d'une fiche : type, date, statut, technologies.
// Chaque techno est une étiquette cliquable qui mène à sa page.
// Une caractéristique vide n'est pas affichée (site publié : ses repères
// [À COMPLÉTER] ont été retirés au build).
export function ficheMeta(r, hrefForTechno) {
  const list = r.technos.length
    ? `<ul class="tags" aria-label="Technos">${r.technos.map((nom) => `<li>${technoBadge(nom, hrefForTechno)}</li>`).join('')}</ul>`
    : placeholder('[À COMPLÉTER]');
  const row = (label, value) => (value ? `<dt>${label}</dt><dd>${value}</dd>` : '');

  return `<dl class="fiche-meta">
    <dt>Type</dt><dd>${TYPES[r.type].label}${draftBadge(r)}</dd>
    ${row('Date', safe(formatDate(r.date)))}
    ${row('Statut', safe(r.statut))}
    ${row('Technos', list)}
  </dl>`;
}

// Étiquette d'une techno, aux couleurs de sa marque (src/styles/technos.css,
// qui la reconnaît à son attribut data-techno).
//   link     : lien vers la page de la techno (sinon simple étiquette)
//   current  : techno de la page affichée (non cliquable, mise en évidence)
//   count    : nombre de réalisations, affiché à droite de l'étiquette
// Un repère [À COMPLÉTER] reste un texte surligné, sans lien.
function technoBadge(nom, hrefForTechno, { link = true, current = false, count = null } = {}) {
  if (hasPlaceholder(nom)) return safe(nom);
  const slug = technoSlug(nom);
  const number =
    count === null
      ? ''
      : `<span class="techno-count"><span class="visually-hidden"> (</span>${count}<span class="visually-hidden"> réalisation${count > 1 ? 's' : ''})</span></span>`;
  const label = `${escapeHtml(nom)}${number}`;
  if (current) return `<span class="techno is-current" data-techno="${slug}" aria-current="page">${label}</span>`;
  if (!link) return `<span class="techno" data-techno="${slug}">${label}</span>`;
  return `<a class="techno" data-techno="${slug}" href="${hrefForTechno(slug)}">${label}</a>`;
}

// Page d'une techno : les réalisations qui l'utilisent, puis toutes les technos
// des fiches, avec leur nombre de réalisations.
export function technoBlock(techno, hrefFor, hrefForTechno) {
  const items = realisationsByTechno(techno.slug);
  const count = `${items.length} réalisation${items.length > 1 ? 's' : ''}`;
  const all = technos
    .map((t) => `<li>${technoBadge(t.nom, hrefForTechno, { count: t.count, current: t.slug === techno.slug })}</li>`)
    .join('');
  return `<p class="intro">${count} avec ${technoBadge(techno.nom, hrefForTechno, { link: false })}, de la plus récente à la plus ancienne.</p>
  ${ficheLinks(items, hrefFor)}
  <h2 class="block-title" id="technos-toutes">Toutes les technos</h2>
  <ul class="tags tags--all" aria-label="Toutes les technos">${all}</ul>`;
}

// Compétences du référentiel mobilisées par une fiche. Sans compétence : un
// repère avec `npm run dev`, rien du tout dans le site publié.
export function ficheCompetences(r) {
  const missing = placeholder('[À COMPLÉTER : compétences mobilisées]');
  if (!r.competences.length && !missing) return '';
  const list = r.competences.length
    ? `<ul>${r.competences.map((code) => `<li><strong>${escapeHtml(code)}</strong> — ${safe(competenceLabel(code))}</li>`).join('')}</ul>`
    : `<p>${missing}</p>`;

  return `<section class="fiche-competences" aria-labelledby="competences-${r.slug}">
    <h2 id="competences-${r.slug}">Compétences du référentiel mobilisées</h2>
    ${list}
  </section>`;
}

// Fiche complète : caractéristiques, texte de la fiche, compétences
export function ficheBlock(r, hrefForTechno) {
  const competences = ficheCompetences(r);
  return `<article class="fiche">
    ${ficheMeta(r, hrefForTechno)}
    <div class="prose">${r.html}</div>
    ${competences ? `<div class="prose">${competences}</div>` : ''}
  </article>`;
}
