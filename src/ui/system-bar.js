// Barre fixe en haut à droite de l'écran, visible en permanence, y compris
// pendant la séquence de démarrage :
//   - accès en un clic à la vue rapide jury (premier arrêt de la touche Tab) ;
//   - bouton haut-parleur pour activer ou couper les sons.

import { link } from '../router.js';
import barHtml from './system-bar.html?raw';
// Icônes SVG intégrées à la page (aucun fichier à charger) : elles prennent
// la couleur du texte (currentColor)
import ICON_ON from '../assets/icons/sound-on.svg?raw';
import ICON_OFF from '../assets/icons/sound-off.svg?raw';

export function createSystemBar(root, { sounds }) {
  // Structure de la barre : system-bar.html.
  // Sur petit écran, le libellé se réduit à « Vue jury » (voir system-bar.css).
  // Le libellé est enveloppé dans un <span> : dans un conteneur flex, les
  // espaces en bord de texte disparaîtraient (« Vuerapidejury »).
  root.innerHTML = barHtml;
  root.querySelector('[data-slot="jury"]').href = link.jury();

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
