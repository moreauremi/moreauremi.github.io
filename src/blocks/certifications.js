// Rubrique « Certifications » (certifications dans content/site.config.js).

import { site } from '../content.js';
import { escapeHtml, safe } from '../utils/html.js';
import { formatDate } from '../utils/dates.js';
import { NEW_TAB } from './shared.js';


const CERTIFICATION_GROUPS = [
  ['certification', 'Certifications'],
  ['langue', 'Langues'],
  ['formation', 'Formations complémentaires'],
  ['badge', 'Badges numériques'],
];

export function certificationsBlock() {
  const all = site.certifications ?? [];
  const intro = '<p>Certifications, résultats en langues, formations complémentaires et badges numériques, avec leur justificatif.</p>';
  if (all.length === 0) return `<div class="prose">${intro}<p>À venir.</p></div>`;

  const groups = CERTIFICATION_GROUPS.map(([categorie, label]) => {
    // Les plus récentes d'abord (dates AAAA-MM-JJ : l'ordre alphabétique suffit)
    const items = all
      .filter((c) => c.categorie === categorie)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (items.length === 0) return '';
    return `<h2 class="block-title">${label}</h2>
      <ul class="certifs">${items.map(certification).join('')}</ul>`;
  }).join('');

  return `<div class="prose">${intro}</div>${groups}`;
}

function certification(c) {
  const details = [
    safe(c.organisme),
    safe(formatDate(String(c.date))),
    c.statut === 'en cours' ? 'en cours' : '',
    c.detail ? safe(c.detail) : '',
  ].filter(Boolean);
  const links = [
    c.justificatif ? `<a href="${escapeHtml(c.justificatif)}" ${NEW_TAB}>Justificatif</a>` : '',
    c.lien ? `<a href="${escapeHtml(c.lien)}" ${NEW_TAB}>Vérifier en ligne</a>` : '',
  ].filter(Boolean);

  return `<li>
    <span class="certif-title">${safe(c.titre)}</span>
    <span class="certif-meta">${details.join(' · ')}</span>
    ${links.length ? `<span class="certif-links">${links.join(' · ')}</span>` : ''}
  </li>`;
}
