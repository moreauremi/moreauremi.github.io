// Mise en forme des dates des fiches, en français.
//   '2026'        → '2026'
//   '2026-11'     → 'novembre 2026'
//   '2026-11-05'  → '5 novembre 2026'
// Tout autre texte (ex. « [À COMPLÉTER] ») est renvoyé tel quel.

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export function formatDate(value) {
  const match = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  if (!month) return year;
  const monthName = MONTHS[Number(month) - 1];
  return day ? `${Number(day)} ${monthName} ${year}` : `${monthName} ${year}`;
}
