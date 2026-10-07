// =============================================================================
// Pagination sur place : « < 1 2 3 > » sous une liste
// -----------------------------------------------------------------------------
// Toutes les pages sont dans le document, superposées dans la même case d'une
// grille CSS : la zone prend la hauteur de la plus grande page, et seule la
// page affichée est visible (les autres portent data-off). Changer de page ne
// change donc ni l'adresse, ni la hauteur de la zone : la barre reste sous la
// souris, et rien ne défile.
//
//   <div class="paged">
//     <div class="paged-pages">
//       <ul data-page="1">…</ul>                  page affichée
//       <ul data-page="2" data-off>…</ul>         page masquée
//     </div>
//     <nav data-pager>…</nav>                     la barre
//   </div>
//
// Au clavier : Tab jusqu'à la barre, Entrée sur une page, ← et → pour la
// page précédente ou suivante.
// =============================================================================

// Liste paginée : `items` (HTML de chaque <li>), `size` éléments par page,
// `listAttrs` (attributs de chaque <ul>), `label` pour nommer la barre aux
// lecteurs d'écran.
export function pagedList(items, { size, listAttrs = '', label }) {
  const total = Math.max(1, Math.ceil(items.length / size));
  const pages = Array.from(
    { length: total },
    (_, i) => `<ul data-page="${i + 1}"${i > 0 ? ' data-off' : ''} ${listAttrs}>${items.slice(i * size, (i + 1) * size).join('')}</ul>`,
  ).join('');
  const pager =
    total > 1
      ? `<nav class="pager" data-pager aria-label="${label}">${pagerButtons(1, total)}</nav>
        <p class="visually-hidden" aria-live="polite" data-pager-status></p>`
      : '';
  return `<div class="paged"><div class="paged-pages">${pages}</div>${pager}</div>`;
}

// Boutons de la barre. Avec beaucoup de pages, seules la première, la
// dernière et celles autour de la page affichée sont proposées :
// < 1 … 4 5 6 … 20 >
function pagerButtons(page, total) {
  const shown = [...new Set([1, page - 1, page, page + 1, total])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  const numbers = shown
    .map((n, i) => {
      const gap = i > 0 && n - shown[i - 1] > 1 ? '<span class="pager-gap" aria-hidden="true">…</span>' : '';
      const current = n === page ? ' aria-current="page"' : '';
      return `${gap}<button type="button" class="pager-btn" data-goto="${n}" data-role="page"${current} aria-label="Page ${n} sur ${total}">${n}</button>`;
    })
    .join('');

  const arrow = (role, target, symbol, label) =>
    `<button type="button" class="pager-btn" data-goto="${target}" data-role="${role}" aria-label="${label}"${
      target < 1 || target > total ? ' disabled' : ''
    }>${symbol}</button>`;

  return `${arrow('prev', page - 1, '&lt;', 'Page précédente')}${numbers}${arrow('next', page + 1, '&gt;', 'Page suivante')}`;
}

// Une seule écoute pour tout le site (clics délégués) : les listes sont
// recréées à chaque changement d'écran, l'écoute reste valable.
export function setupPagers(root) {
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pager] [data-goto]');
    if (!button || button.disabled) return;
    showPage(button.closest('.paged'), Number(button.dataset.goto), button.dataset.role);
  });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const pager = event.target.closest('[data-pager]');
    if (!pager) return;
    const button = pager.querySelector(`[data-role="${event.key === 'ArrowLeft' ? 'prev' : 'next'}"]`);
    event.preventDefault();
    if (!button.disabled) button.click();
  });
}

function showPage(container, page, role) {
  const pages = [...container.querySelectorAll('.paged-pages > [data-page]')];
  for (const list of pages) list.toggleAttribute('data-off', Number(list.dataset.page) !== page);

  // La barre est redessinée : le focus revient sur le bouton équivalent
  // (flèche encore utilisable, sinon numéro de la page affichée), sans que
  // le navigateur fasse défiler la page pour le montrer.
  const pager = container.querySelector('[data-pager]');
  pager.innerHTML = pagerButtons(page, pages.length);
  const same = role !== 'page' && pager.querySelector(`[data-role="${role}"]:not([disabled])`);
  (same || pager.querySelector('[aria-current="page"]')).focus({ preventScroll: true });

  container.querySelector('[data-pager-status]').textContent = `Page ${page} sur ${pages.length}`;
}
