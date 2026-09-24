// =============================================================================
// Titre de l'onglet façon invite de commande : « RémiOS_ »
// -----------------------------------------------------------------------------
// Le « _ » clignote comme le curseur d'un terminal : toutes les 530 ms (le
// rythme habituel d'un curseur), le titre alterne entre « RémiOS_ » et
// « RémiOS » suivi d'une espace insécable (même longueur, le texte de l'onglet
// ne bouge pas).
//
//   - Accueil : « RémiOS_ »
//   - Rubrique ou fiche : « Présentation — RémiOS_ » (le nom de la page reste
//     affiché dans l'historique, les favoris et pour les lecteurs d'écran)
//   - Vue jury : titre fixe, sans clignotement (vue sobre, sans animation)
//
// Si le système demande de réduire les animations, le « _ » reste fixe.
// =============================================================================

const BLINK_MS = 530;
const CURSOR = '_';
const BLANK = ' '; // espace insécable : le navigateur ne la supprime pas

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let base = '';
let cursorVisible = true;
let timer = 0;

function render() {
  document.title = base + (cursorVisible ? CURSOR : BLANK);
}

// Titre avec curseur clignotant. `page` : nom de l'écran, vide pour l'accueil.
export function setPromptTitle(page = '') {
  base = page ? `${page} — RémiOS` : 'RémiOS';
  cursorVisible = true; // le curseur réapparaît à chaque changement d'écran
  render();

  window.clearInterval(timer);
  if (reducedMotion.matches) return;
  timer = window.setInterval(() => {
    cursorVisible = !cursorVisible;
    render();
  }, BLINK_MS);
}

// Titre fixe, sans curseur ni clignotement (vue jury)
export function setPlainTitle(text) {
  window.clearInterval(timer);
  document.title = text;
}
