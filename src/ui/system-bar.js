// Barre fixe en haut à droite de l'écran, visible en permanence, y compris
// pendant la séquence de démarrage : accès en un clic à la vue rapide jury.
// C'est le premier élément de la page : la touche Tab y mène en premier.

import { link } from '../router.js';

export function createSystemBar(root) {
  // Sur petit écran, le libellé se réduit à « Vue jury » (voir system-bar.css).
  // Le libellé est enveloppé dans un <span> : dans un conteneur flex, les
  // espaces en bord de texte disparaîtraient (« Vuerapidejury »).
  root.innerHTML = `<a class="system-bar-jury" href="${link.jury()}"><span>Vue <span class="system-bar-long">rapide </span>jury</span></a>`;
  return { root };
}
