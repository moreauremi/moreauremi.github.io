// Écran du chargeur de démarrage GRUB : l'entrée « RémiOS GNU/Linux » est
// sélectionnée et un compte à rebours annonce le démarrage automatique.

export function grubScreen(seconds) {
  return `<div class="grub">
    <p class="grub-version">GNU GRUB  version 2.12</p>
    <div class="grub-menu">
      <p class="grub-entry is-selected">*RémiOS GNU/Linux</p>
      <p class="grub-entry">Options avancées pour RémiOS GNU/Linux</p>
      <p class="grub-entry">Mémoire (memtest86+)</p>
    </div>
    <p class="grub-help">L'entrée sélectionnée démarrera automatiquement dans <span data-countdown>${seconds}</span> s.</p>
  </div>`;
}
