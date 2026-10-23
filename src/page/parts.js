// Éléments communs aux écrans de la vue page : menu latéral, boutons « Menu »
// et « thème », étiquettes façon Notion, icônes des rubriques et des fiches.

import { site } from '../content.js';
import { link } from '../router.js';
import { escapeHtml } from '../utils/html.js';
import { SECTIONS } from '../tui/sections.js';
import { ICONS } from './icons.js';

// Icône (emoji) de chaque page, devant son titre comme dans Notion
export const SECTION_ICONS = {
  home: '🏠',
  presentation: '👋',
  alternance: '💼',
  realisations: '📁',
  competences: '🧠',
  synthese: '📊',
  veille: '📰',
  certifications: '🎓',
  contact: '✉️',
  'mentions-legales': '⚖️',
  'message-envoye': '✅',
  jury: '🖨️',
};

// Icône, libellé court et couleur d'étiquette de chaque type de réalisation
export const TYPE_STYLES = {
  entreprise: { icon: '🏢', label: 'Entreprise', color: 'orange' },
  formation: { icon: '📚', label: 'Formation', color: 'blue' },
  perso: { icon: '🧪', label: 'Perso', color: 'green' },
};

// Étiquette façon Notion. `color` : gray, orange, yellow, green, blue,
// purple ou red (couleurs dans tokens.css). `html` est déjà sûr.
export function tag(html, color = 'gray', attrs = '') {
  return `<span class="pg-tag pg-tag--${color}"${attrs}>${html}</span>`;
}

export function typeTag(r) {
  const style = TYPE_STYLES[r.type];
  return style ? tag(style.label, style.color) : '';
}

export function ficheIcon(r) {
  return TYPE_STYLES[r.type]?.icon ?? '📄';
}

// Statut d'une fiche, avec une pastille de couleur : vert pour « terminé »,
// bleu pour « en cours », gris sinon
export function statusTag(statut) {
  if (!statut) return '';
  const color = /termin/i.test(statut) ? 'green' : /cours/i.test(statut) ? 'blue' : 'gray';
  return tag(`<span class="pg-tag-dot" aria-hidden="true"></span>${escapeHtml(statut)}`, color);
}

// Lien vers un autre site : s'ouvre dans un nouvel onglet, signalé par ↗
export function externalLink(href, text) {
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${text}<span class="pg-ext" aria-hidden="true"> ↗</span><span class="visually-hidden"> (nouvel onglet)</span></a>`;
}

// --- Menu latéral -----------------------------------------------------------------
// Toujours visible sur grand écran ; sur téléphone, il s'ouvre avec le bouton
// « Menu ». `current` : identifiant de la page affichée (home, une rubrique…) ;
// `child` : { icon, label } d'une page rangée sous la rubrique courante (une
// fiche sous « Réalisations »…), affichée en retrait.

export function sidebar({ current, child = null }) {
  const { nom } = site.identite;
  const item = (id, href, label) => {
    const isCurrent = id === current && !child;
    const sub = id === current && child
      ? `<ul class="pg-side-sub"><li><span class="pg-side-link pg-side-link--sub" aria-current="page"><span class="pg-side-icon" aria-hidden="true">${child.icon}</span><span class="pg-side-label">${child.label}</span></span></li></ul>`
      : '';
    return `<li>
      <a class="pg-side-link${id === current ? ' is-active' : ''}" href="${href}"${isCurrent ? ' aria-current="page"' : ''}>
        <span class="pg-side-icon" aria-hidden="true">${SECTION_ICONS[id] ?? '📄'}</span><span class="pg-side-label">${label}</span>
      </a>${sub}
    </li>`;
  };

  return `<nav class="pg-side" id="pg-side" aria-label="Menu principal">
    <a class="pg-side-head" href="${link.home()}">
      ${miniAvatar()}
      <span><span class="pg-side-name">${escapeHtml(nom)}</span><span class="pg-side-sub-title">Portfolio BTS SIO SISR</span></span>
    </a>
    <ul class="pg-side-list">
      ${item('home', link.home(), 'Accueil')}
      ${SECTIONS.map((s) => item(s.id, link.section(s.id), s.label)).join('')}
    </ul>
    <ul class="pg-side-list pg-side-list--bottom">
      ${item('jury', link.jury(), 'Vue jury, imprimable')}
      ${item('mentions-legales', link.legal(), 'Mentions légales')}
    </ul>
    <button type="button" class="pg-side-theme" data-action="theme" aria-pressed="false">
      ${ICONS.moon}<span>Thème sombre</span><span class="pg-switch" aria-hidden="true"></span>
    </button>
  </nav>
  <div class="pg-backdrop" data-action="close-menu" hidden></div>`;
}

// Bouton « Menu » (téléphone) et bouton thème sans texte, pour les barres du haut
export function menuButton() {
  return `<button type="button" class="pg-menu-btn" data-action="menu" aria-expanded="false" aria-controls="pg-side">${ICONS.menu}<span>Menu</span></button>`;
}

export function themeButton() {
  return `<button type="button" class="pg-btn-icon" data-action="theme" aria-label="Thème sombre" aria-pressed="false">${ICONS.moon}${ICONS.sun}</button>`;
}

// Petite photo ronde (en-tête du menu), ou initiales sans photo
export function miniAvatar() {
  const { photo, nom } = site.identite;
  if (photo) return `<img class="pg-mini-avatar" src="${escapeHtml(photo)}" alt="" width="22" height="22" decoding="async">`;
  const initials = nom.split(/\s+/).map((part) => part[0]).join('');
  return `<span class="pg-mini-avatar" aria-hidden="true">${escapeHtml(initials)}</span>`;
}

// Titre de partie de l'accueil, en pastille (« RÉALISATIONS »)
export function label(text, { solid = false, id = '' } = {}) {
  return `<h2 class="pg-label${solid ? ' pg-label--solid' : ''}"${id ? ` id="${id}"` : ''}>${text}</h2>`;
}

// Destination d'une carte ou d'un lien, écrite en clair : « Tableau de synthèse → »
export function goTo(text) {
  return `<span class="pg-goto">${text} <span aria-hidden="true">→</span></span>`;
}
