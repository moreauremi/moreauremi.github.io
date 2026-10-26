// Petites icônes au trait (16 × 16) de la vue page, écrites directement dans
// la page (aucun fichier à charger). Elles prennent la couleur du texte
// (currentColor) et sont décoratives : un texte ou un aria-label les
// accompagne toujours.

const icon = (name, body) =>
  `<svg class="pg-icon pg-icon--${name}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${body}</svg>`;

const STROKE = 'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';

export const ICONS = {
  menu: icon('menu', `<path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" ${STROKE}/>`),
  sun: icon('sun', `<circle cx="8" cy="8" r="3" ${STROKE}/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" ${STROKE}/>`),
  moon: icon('moon', `<path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1z" ${STROKE}/>`),
  pin: icon('pin', `<path d="M8 14.5s5-4.6 5-8.2A5 5 0 0 0 3 6.3c0 3.6 5 8.2 5 8.2z" ${STROKE}/><circle cx="8" cy="6.3" r="1.8" ${STROKE}/>`),
  globe: icon('globe', `<circle cx="8" cy="8" r="6.3" ${STROKE}/><ellipse cx="8" cy="8" rx="2.6" ry="6.3" ${STROKE}/><path d="M1.8 8h12.4" ${STROKE}/>`),
  clock: icon('clock', `<circle cx="8" cy="8" r="6.3" ${STROKE}/><path d="M8 4.6V8l2.3 1.4" ${STROKE}/>`),
  type: icon('type', `<circle cx="8" cy="8" r="6" ${STROKE}/><circle cx="8" cy="8" r="2.2" fill="currentColor"/>`),
  date: icon('date', `<rect x="2" y="3" width="12" height="11" rx="2" ${STROKE}/><path d="M2 6.5h12M5.5 1.8v2.4M10.5 1.8v2.4" ${STROKE}/>`),
  status: icon('status', `<circle cx="8" cy="8" r="6" ${STROKE}/><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor"/>`),
  list: icon('list', `<path d="M5.5 4h8M5.5 8h8M5.5 12h8" ${STROKE}/><circle cx="2.6" cy="4" r="1" fill="currentColor"/><circle cx="2.6" cy="8" r="1" fill="currentColor"/><circle cx="2.6" cy="12" r="1" fill="currentColor"/>`),
  check: icon('check', `<rect x="2" y="2" width="12" height="12" rx="2.5" ${STROKE}/><path d="M5 8.2l2 2 4-4.4" ${STROKE}/>`),
  keyboard: icon('keyboard', `<rect x="1.5" y="4" width="13" height="8.5" rx="1.8" ${STROKE}/><path d="M4 7h.01M6.7 7h.01M9.3 7h.01M12 7h.01M5 9.8h6" ${STROKE}/>`),
  clip: icon('clip', `<path d="M10.5 4.5l-5 5a1.6 1.6 0 0 0 2.3 2.3l5.4-5.4a3 3 0 0 0-4.3-4.3L3.5 7.5a4.2 4.2 0 0 0 6 6l4-4" ${STROKE}/>`),
};
