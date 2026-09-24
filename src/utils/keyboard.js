// Petites aides pour la gestion du clavier.

// Vrai si l'utilisateur est en train d'écrire dans un champ : les raccourcis
// du site (chiffres, flèches, Retour arrière…) ne doivent pas s'y déclencher.
export function isTypingTarget(element) {
  if (!(element instanceof HTMLElement)) return false;
  return element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
}

// Vrai si une touche de modification est enfoncée (Ctrl, Alt, Cmd) : on laisse
// alors le navigateur gérer ses propres raccourcis (Ctrl+R, Cmd+L…).
export function hasModifier(event) {
  return event.ctrlKey || event.altKey || event.metaKey;
}
