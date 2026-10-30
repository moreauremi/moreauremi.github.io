// Rubriques « Certifications » et « Formations » (certifications dans
// content/site.config.js). Les deux lisent la même liste : les entrées de
// catégorie « formation » vont dans la rubrique Formations, les autres
// (certifications, langues, badges) dans la rubrique Certifications.

import { site, getRealisation } from '../content.js';
import { escapeHtml, safe } from '../utils/html.js';
import { formatDate } from '../utils/dates.js';
import { NEW_TAB } from './shared.js';


const CERTIFICATION_GROUPS = [
  ['certification', 'Certifications'],
  ['langue', 'Langues'],
  ['badge', 'Badges numériques'],
];

// Les plus récentes d'abord (dates AAAA-MM-JJ : l'ordre alphabétique suffit)
function entriesOf(categorie) {
  return (site.certifications ?? [])
    .filter((c) => c.categorie === categorie)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function certificationsBlock() {
  const intro = '<p>Certifications, résultats en langues et badges numériques, avec leur justificatif.</p>';
  const groups = CERTIFICATION_GROUPS.map(([categorie, label]) => {
    const items = entriesOf(categorie);
    if (items.length === 0) return '';
    return `<h2 class="block-title">${label}</h2>
      <ul class="certifs">${items.map((c) => certification(c)).join('')}</ul>`;
  }).join('');

  if (!groups) return `<div class="prose">${intro}<p>À venir.</p></div>`;
  return `<div class="prose">${intro}</div>${groups}`;
}

// `hrefFor(slug)` : lien vers la fiche de réalisation liée à une formation
export function formationsBlock(hrefFor) {
  const intro = '<p>Formations suivies en alternance chez 1Life et en dehors, de la plus récente à la plus ancienne.</p>';
  const items = entriesOf('formation');
  if (items.length === 0) return `<div class="prose">${intro}<p>À venir.</p></div>`;
  return `<div class="prose">${intro}</div>
    <ul class="certifs">${items.map((c) => certification(c, hrefFor)).join('')}</ul>`;
}

function certification(c, hrefFor) {
  const details = [
    safe(c.organisme),
    safe(formatDate(String(c.date))),
    c.statut === 'en cours' ? 'en cours' : '',
    c.detail ? safe(c.detail) : '',
  ].filter(Boolean);
  // La fiche liée n'apparaît que si elle est publiée (pas en brouillon)
  const fiche = c.fiche && hrefFor && getRealisation(c.fiche);
  const links = [
    fiche ? `<a href="${escapeHtml(hrefFor(c.fiche))}">Voir la réalisation</a>` : '',
    c.justificatif ? `<a href="${escapeHtml(c.justificatif)}" ${NEW_TAB}>Justificatif</a>` : '',
    c.lien ? `<a href="${escapeHtml(c.lien)}" ${NEW_TAB}>Vérifier en ligne</a>` : '',
  ].filter(Boolean);

  return `<li>
    <span class="certif-title">${safe(c.titre)}</span>
    <span class="certif-meta">${details.join(' · ')}</span>
    ${c.description ? `<span class="certif-description">${safe(c.description)}</span>` : ''}
    ${links.length ? `<span class="certif-links">${links.join(' · ')}</span>` : ''}
  </li>`;
}
