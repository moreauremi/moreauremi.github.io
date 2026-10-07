// Rubrique « Réalisations » et fiches de réalisation (content/realisations/).

import { realisationsOfType, competenceLabel, TYPES } from '../content.js';
import { escapeHtml, safe } from '../utils/html.js';
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

// Caractéristiques d'une fiche : type, date, statut, technologies
export function ficheMeta(r) {
  const technos = r.technos.length
    ? `<ul class="tags">${r.technos.map((t) => `<li>${safe(t)}</li>`).join('')}</ul>`
    : '<mark class="ph">[À COMPLÉTER]</mark>';

  return `<dl class="fiche-meta">
    <dt>Type</dt><dd>${TYPES[r.type].label}${draftBadge(r)}</dd>
    <dt>Date</dt><dd>${safe(formatDate(r.date))}</dd>
    <dt>Statut</dt><dd>${safe(r.statut)}</dd>
    <dt>Technos</dt><dd>${technos}</dd>
  </dl>`;
}

// Compétences du référentiel mobilisées par une fiche
export function ficheCompetences(r) {
  const list = r.competences.length
    ? `<ul>${r.competences.map((code) => `<li><strong>${escapeHtml(code)}</strong> — ${safe(competenceLabel(code))}</li>`).join('')}</ul>`
    : '<p><mark class="ph">[À COMPLÉTER : compétences mobilisées]</mark></p>';

  return `<section class="fiche-competences" aria-labelledby="competences-${r.slug}">
    <h2 id="competences-${r.slug}">Compétences du référentiel mobilisées</h2>
    ${list}
  </section>`;
}

// Fiche complète : caractéristiques, texte de la fiche, compétences
export function ficheBlock(r) {
  return `<article class="fiche">
    ${ficheMeta(r)}
    <div class="prose">${r.html}</div>
    <div class="prose">${ficheCompetences(r)}</div>
  </article>`;
}
