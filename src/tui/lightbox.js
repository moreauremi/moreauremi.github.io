// =============================================================================
// Visionneuse d'images (« lightbox »)
// -----------------------------------------------------------------------------
// Dans les fiches, chaque capture est un lien vers l'image en grand
// (<a class="shot">, produit par le plugin Markdown). Ce module intercepte le
// clic et affiche l'image dans une fenêtre <dialog> par-dessus la page.
//
// <dialog> est un élément HTML natif : avec showModal(), le navigateur gère
// seul le piège du focus (Tab reste dans la fenêtre), la touche Échap pour
// fermer, et le retour du focus sur le lien d'origine à la fermeture.
// Sans JavaScript, le lien ouvre simplement l'image.
// =============================================================================

export function createLightbox() {
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Image agrandie');
  dialog.innerHTML = `
    <button type="button" class="lightbox-close">Fermer <span aria-hidden="true">[Échap]</span></button>
    <figure class="lightbox-figure">
      <img class="lightbox-img" alt="">
      <figcaption class="lightbox-caption"></figcaption>
    </figure>`;
  document.body.append(dialog);

  const img = dialog.querySelector('.lightbox-img');
  const caption = dialog.querySelector('.lightbox-caption');

  document.addEventListener('click', (event) => {
    const shot = event.target.closest('a.shot');
    // Ctrl/Cmd/Maj + clic ou clic-molette : on laisse le navigateur ouvrir un onglet
    if (!shot || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();

    const thumbnail = shot.querySelector('img');
    img.src = shot.getAttribute('href');
    img.alt = thumbnail?.alt ?? '';
    caption.textContent = shot.closest('figure')?.querySelector('figcaption')?.textContent ?? '';
    caption.hidden = caption.textContent === '';
    dialog.showModal();
  });

  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());

  // Clic sur le fond sombre, à côté de l'image : ferme aussi
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  return { isOpen: () => dialog.open };
}
