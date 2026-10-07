// Raccourcis d'ouverture du terminal : ` (touche morte sur AZERTY, peu
// fiable), ², la touche physique située sous Échap (code « Backquote »,
// quelle que soit la disposition du clavier), ou Ctrl+Alt+T comme sous Ubuntu.
//
// Ce petit module est chargé avec la page, alors que le terminal lui-même
// (terminal.js et ses commandes) n'est téléchargé qu'à sa première ouverture.
export function isTerminalShortcut(event) {
  if (event.ctrlKey && event.altKey && event.code === 'KeyT') return true;
  if (event.ctrlKey || event.altKey || event.metaKey) return false;
  return event.key === '`' || event.key === '²' || event.code === 'Backquote';
}
