// Mise en forme des dates des fiches, dans la langue affichée.
//   '2026'        → '2026'
//   '2026-11'     → 'novembre 2026'            (en anglais : 'November 2026')
//   '2026-11-05'  → '5 novembre 2026'          ('5 November 2026')
//   '2026-01/2026-08' (période) → 'janvier 2026 – août 2026'
// Tout autre texte (ex. « [À COMPLÉTER] ») est renvoyé tel quel.
// `lang` : langue voulue ; par défaut, celle du site affiché (au build, les
// pages statiques la précisent).

import { currentLang } from './lang.js';

const MONTHS = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

export function formatDate(value, lang = currentLang()) {
  // Période : on met en forme le début et la fin séparément
  if (/^\d{4}[\d-]*\/\d{4}[\d-]*$/.test(value)) return value.split('/').map((part) => formatDate(part, lang)).join(' – ');

  const match = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  if (!month) return year;
  const monthName = (MONTHS[lang] ?? MONTHS.fr)[Number(month) - 1];
  return day ? `${Number(day)} ${monthName} ${year}` : `${monthName} ${year}`;
}
