// Barre fixe en haut à droite de l'écran, visible en permanence, y compris
// pendant la séquence de démarrage : accès en un clic à la vue rapide jury.
// C'est le premier élément de la page : la touche Tab y mène en premier.

import { link } from '../router.js';

export function createSystemBar(root) {
  root.innerHTML = `<a class="system-bar-jury" href="${link.jury()}">Vue rapide jury</a>`;
  return { root };
}
