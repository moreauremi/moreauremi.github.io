// Petits outils partagés par tous les modules.

// Échappe un texte avant de l'insérer dans du HTML. Indispensable : un titre
// saisi par l'utilisateur ne doit jamais devenir du code (faille XSS, voir
// « pas de JavaScript personnalisé » dans les fonctionnalités).
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);

// Copie profonde (historique annuler / rétablir, réinitialisation de la démo)
export const clone = (value) => structuredClone(value);

// 9.5 → « 9:30 » (format du guide de style)
export function fmtHour(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

// « 9:00 – 12:00 » : tiret demi-cadratin entouré d'espaces
export const fmtRange = (start, end) => `${fmtHour(start)} – ${fmtHour(end)}`;

// Nombres à la française : 1 234,5
export const fmtNumber = (n, digits = 0) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

// Heure décimale d'une date : 13:30 → 13.5
export const hoursOf = (date) => date.getHours() + date.getMinutes() / 60;

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// 0 = lundi … 6 = dimanche
export const weekdayIndex = (date) => (date.getDay() + 6) % 7;

export const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();

// Recherche sans tenir compte des accents ni des majuscules : « meteo » trouve « Météo »
export const normalize = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Sous 760 px, la grille passe en une colonne (guide de style, section 9)
export const isPhone = () => matchMedia('(max-width: 759px)').matches;

// Identifiant unique pour un nouveau widget
export const newId = () => `w-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
