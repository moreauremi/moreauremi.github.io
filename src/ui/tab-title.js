// =============================================================================
// Titre de l'onglet façon invite de commande : « RémiOS_ »
// -----------------------------------------------------------------------------
// Le « _ » clignote comme le curseur d'un terminal : toutes les 530 ms (le
// rythme habituel d'un curseur), il alterne avec une espace de même largeur,
// pour que le reste du titre ne bouge pas.
//
//   - Accueil : « RémiOS_ — Rémi Moreau · Portfolio BTS SIO SISR ». L'onglet
//     montre le début (« RémiOS_ »), et les moteurs de recherche, qui lisent le
//     titre complet, y trouvent le nom et les mots-clés du portfolio.
//   - Rubrique ou fiche : « Présentation — RémiOS_ » (le nom de la page reste
//     affiché dans l'historique, les favoris et pour les lecteurs d'écran)
//   - Vue jury : titre fixe, sans clignotement (vue sobre, sans animation)
//
// Si le système demande de réduire les animations, le « _ » reste fixe.
// =============================================================================

import { site } from '../content.js';
import { reducedMotion } from '../utils/motion.js';

const BLINK_MS = 530;
const CURSOR = '_';
// Espace « demi-cadratin » (U+2002), à peu près de la largeur du « _ ». Ce
// n'est pas une espace ordinaire : le navigateur ne la supprime pas.
const BLANK = String.fromCharCode(0x2002);
// Fin du titre de l'accueil, après le curseur (site.config.js, « referencement »)
const HOME_SUFFIX = ` — ${site.referencement?.titre ?? site.identite.nom}`;

let prefix = ''; // texte avant le curseur
let suffix = ''; // texte après le curseur (accueil uniquement)
let cursorVisible = true;
let timer = 0;

function render() {
  document.title = prefix + (cursorVisible ? CURSOR : BLANK) + suffix;
}

// Titre avec curseur clignotant. `page` : nom de l'écran, vide pour l'accueil.
export function setPromptTitle(page = '') {
  prefix = page ? `${page} — RémiOS` : 'RémiOS';
  suffix = page ? '' : HOME_SUFFIX;
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
