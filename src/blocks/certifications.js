// Rubriques « Certifications » et « Formations » (certifications dans
// content/site.config.js). Les deux lisent la même liste : les entrées de
// catégorie « formation » vont dans la rubrique Formations, les autres
// (certifications, langues, badges) dans la rubrique Certifications.

import { site, getRealisation } from '../content.js';
import { escapeHtml, safe } from '../utils/html.js';
import { formatDate } from '../utils/dates.js';
import { tr } from '../utils/lang.js';
import { NEW_TAB } from './shared.js';


const certificationGroups = () => [
  ['certification', 'Certifications'],
  ['langue', tr('Langues', 'Languages')],
  ['badge', tr('Badges numériques', 'Digital badges')],
];

const comingSoon = () => `<p>${tr('À venir.', 'Coming soon.')}</p>`;

// Les plus récentes d'abord (dates AAAA-MM-JJ : l'ordre alphabétique suffit)
function entriesOf(categorie) {
  return (site.certifications ?? [])
    .filter((c) => c.categorie === categorie)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function certificationsBlock() {
  const intro = `<p>${tr('Certifications, résultats en langues et badges numériques, avec leur justificatif.', 'Certifications, language results and digital badges, with their supporting documents.')}</p>`;
  const groups = certificationGroups().map(([categorie, label]) => {
    const items = entriesOf(categorie);
    if (items.length === 0) return '';
    const list = categorie === 'badge' ? badges(items) : items.map((c) => certification(c));
    return `<h2 class="block-title">${label}</h2>
      <ul class="certifs">${list.join('')}</ul>`;
  }).join('');

  if (!groups) return `<div class="prose">${intro}${comingSoon()}</div>`;
  return `<div class="prose">${intro}</div>${groups}`;
}

// `hrefFor(slug)` : lien vers la fiche de réalisation liée à une formation
export function formationsBlock(hrefFor) {
  const intro = `<p>${tr('Formations suivies en alternance chez 1Life et en dehors, de la plus récente à la plus ancienne.', 'Training courses taken during my work-study placement at 1Life and elsewhere, most recent first.')}</p>`;
  const items = entriesOf('formation');
  if (items.length === 0) return `<div class="prose">${intro}${comingSoon()}</div>`;
  return `<div class="prose">${intro}</div>
    <ul class="certifs">${items.map((c) => certification(c, hrefFor)).join('')}</ul>`;
}

function certification(c, hrefFor) {
  const details = [
    safe(c.organisme),
    safe(formatDate(String(c.date))),
    c.statut === 'en cours' ? tr('en cours', 'in progress') : '',
    c.detail ? safe(c.detail) : '',
  ].filter(Boolean);
  // La fiche liée n'apparaît que si elle est publiée (pas en brouillon)
  const fiche = c.fiche && hrefFor && getRealisation(c.fiche);
  const links = [
    fiche ? `<a href="${escapeHtml(hrefFor(c.fiche))}">${tr('Voir la réalisation', 'See the project')}</a>` : '',
    ...proofLinks(c),
  ].filter(Boolean);

  return `<li>
    <span class="certif-title">${safe(c.titre)}</span>
    <span class="certif-meta">${details.join(' · ')}</span>
    ${c.description ? `<span class="certif-description">${safe(c.description)}</span>` : ''}
    ${links.length ? `<span class="certif-links">${links.join(' · ')}</span>` : ''}
  </li>`;
}

// Justificatif et page de vérification, communs à toutes les entrées
function proofLinks(c) {
  return [
    c.justificatif ? `<a href="${escapeHtml(c.justificatif)}" ${NEW_TAB}>${tr('Justificatif', 'Certificate')}</a>` : '',
    c.lien ? `<a href="${escapeHtml(c.lien)}" ${NEW_TAB}>${tr('Vérifier en ligne', 'Verify online')}</a>` : '',
  ].filter(Boolean);
}

// Badges : quand un organisme en délivre plusieurs, une seule entrée
// (organisme, date, nombre), puis une ligne par badge avec ses liens, sans
// description. Un badge seul de son organisme garde l'affichage habituel.
function badges(items) {
  const byOrganisme = new Map();
  for (const c of items) {
    byOrganisme.set(c.organisme, [...(byOrganisme.get(c.organisme) ?? []), c]);
  }
  return [...byOrganisme.values()].map((group) => {
    if (group.length === 1) return certification(group[0]);
    const sameDate = new Set(group.map((c) => String(c.date))).size === 1;
    const meta = [
      sameDate ? safe(formatDate(String(group[0].date))) : '',
      `${group.length} badges`,
    ].filter(Boolean);
    const lines = group.map((c) => {
      const parts = [
        `<span class="certif-title">${safe(c.titre)}</span>`,
        sameDate ? '' : safe(formatDate(String(c.date))),
        ...proofLinks(c),
      ].filter(Boolean);
      return `<li>${parts.join(' · ')}</li>`;
    });
    return `<li>
    <span class="certif-title">${safe(group[0].organisme)}</span>
    <span class="certif-meta">${meta.join(' · ')}</span>
    <ul class="certif-group">${lines.join('')}</ul>
  </li>`;
  });
}
