// Mise en forme des dates du site, en français :
//   '2026'          → '2026'
//   '2026-10'       → 'octobre 2026'
//   '2026-10-16'    → '16 octobre 2026'
//   '2026-09/2026-10' → 'septembre 2026 – octobre 2026'
// Sert au build (pages) et au script d'e-mail de la veille.

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export function formatDate(value) {
  const text = String(value ?? '');
  if (/^\d{4}[\d-]*\/\d{4}[\d-]*$/.test(text)) return text.split('/').map(formatDate).join(' – ');

  const match = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(text);
  if (!match) return text;
  const [, year, month, day] = match;
  if (!month) return year;
  const monthName = MONTHS[Number(month) - 1];
  return day ? `${Number(day)} ${monthName} ${year}` : `${monthName} ${year}`;
}
