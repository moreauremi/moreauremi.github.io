// Barre fixe en haut à droite de l'écran, visible en permanence, y compris
// pendant la séquence de démarrage :
//   - accès en un clic à la vue rapide jury (premier arrêt de la touche Tab) ;
//   - passage à l'autre langue (« EN » / « FR »), sur le même écran ;
//   - bouton haut-parleur pour activer ou couper les sons.
// Ses textes et ses liens suivent la langue et l'écran affichés : update()
// est appelée à chaque changement d'écran (src/main.js).

import { link, hashInLang } from '../router.js';
import { currentLang, tr } from '../utils/lang.js';
import barHtml from './system-bar.html?raw';
// Icônes SVG intégrées à la page (aucun fichier à charger) : elles prennent
// la couleur du texte (currentColor)
import ICON_ON from '../assets/icons/sound-on.svg?raw';
import ICON_OFF from '../assets/icons/sound-off.svg?raw';

export function createSystemBar(root, { sounds }) {
  // Structure de la barre : system-bar.html.
  root.innerHTML = barHtml;
  const jury = root.querySelector('[data-slot="jury"]');
  const lang = root.querySelector('[data-slot="langue"]');
  const button = root.querySelector('.system-bar-sound');
  const icon = button.querySelector('[data-icon]');

  // aria-pressed indique aux lecteurs d'écran si le bouton est « enfoncé » (son actif)
  function renderSound(enabled) {
    button.setAttribute('aria-pressed', String(enabled));
    button.title = enabled ? tr('Couper les sons', 'Turn sounds off') : tr('Activer les sons', 'Turn sounds on');
    icon.innerHTML = enabled ? ICON_ON : ICON_OFF;
  }

  function update() {
    root.setAttribute('aria-label', tr('Accès rapides', 'Quick access'));
    // Sur petit écran, le libellé se réduit à « Vue jury » (voir system-bar.css).
    // Le libellé est enveloppé dans un <span> : dans un conteneur flex, les
    // espaces en bord de texte disparaîtraient (« Vuerapidejury »).
    jury.innerHTML = tr(
      '<span>Vue <span class="system-bar-long">rapide </span>jury</span>',
      '<span><span class="system-bar-long">Quick </span>jury view</span>',
    );
    jury.href = link.jury();

    // Lien vers l'autre langue : « EN » sur le site français, « FR » sur le
    // site anglais. Le nom complet est lu par les lecteurs d'écran, dans sa
    // propre langue (attribut lang).
    const other = currentLang() === 'en' ? 'fr' : 'en';
    lang.href = hashInLang(other);
    lang.hreflang = other;
    lang.lang = other;
    lang.innerHTML = other === 'en'
      ? 'EN<span class="visually-hidden"> (English version)</span>'
      : 'FR<span class="visually-hidden"> (version française)</span>';

    root.querySelector('[data-slot="sons"]').textContent = tr('Sons', 'Sounds');
    renderSound(sounds.isEnabled());
  }

  button.addEventListener('click', () => sounds.toggle());
  sounds.onChange(renderSound);
  update();
  return { update };
}
