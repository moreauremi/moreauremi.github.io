// Barre fixe en haut à droite de l'écran, visible en permanence, y compris
// pendant la séquence de démarrage :
//   - accès en un clic à la vue rapide jury (premier arrêt de la touche Tab) ;
//   - bouton haut-parleur pour activer ou couper les sons.

import { link } from '../router.js';

// Icônes dessinées en SVG (aucun fichier à charger), couleur du texte
const SPEAKER = '<path d="M3 8h3l4-4v12l-4-4H3z" fill="currentColor"/>';
const ICON_ON = `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">${SPEAKER}
  <path d="M13 7.5a3.5 3.5 0 0 1 0 5M15.5 5a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const ICON_OFF = `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">${SPEAKER}
  <path d="M13 7.5l5 5M18 7.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

export function createSystemBar(root, { sounds }) {
  // Sur petit écran, le libellé se réduit à « Vue jury » (voir system-bar.css).
  // Le libellé est enveloppé dans un <span> : dans un conteneur flex, les
  // espaces en bord de texte disparaîtraient (« Vuerapidejury »).
  root.innerHTML = `
    <a class="system-bar-jury" href="${link.jury()}"><span>Vue <span class="system-bar-long">rapide </span>jury</span></a>
    <button type="button" class="system-bar-sound" aria-pressed="false">
      <span class="visually-hidden">Sons</span><span data-icon></span>
    </button>`;

  const button = root.querySelector('.system-bar-sound');
  const icon = button.querySelector('[data-icon]');

  // aria-pressed indique aux lecteurs d'écran si le bouton est « enfoncé » (son actif)
  function update(enabled) {
    button.setAttribute('aria-pressed', String(enabled));
    button.title = enabled ? 'Couper les sons' : 'Activer les sons';
    icon.innerHTML = enabled ? ICON_ON : ICON_OFF;
  }

  button.addEventListener('click', () => sounds.toggle());
  sounds.onChange(update);
  update(sounds.isEnabled());
}
