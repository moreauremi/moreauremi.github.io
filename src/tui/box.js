// Boîte de dialogue façon whiptail : fond gris, bordures en relief, ombre
// portée et titre centré sur la bordure du haut, entre crochets.
// Les crochets sont décoratifs : cachés aux lecteurs d'écran (aria-hidden).
//
// Le titre est un <h1> focalisable (tabindex="-1") : à l'ouverture d'une
// rubrique, le focus y est placé pour que les lecteurs d'écran l'annoncent.

export function box({ title, body, actions = '', crumbs = [] }) {
  return `<section class="tui-box" aria-labelledby="tui-box-title">
    <h1 class="tui-box-title" id="tui-box-title" tabindex="-1"><span aria-hidden="true">[ </span>${title}<span aria-hidden="true"> ]</span></h1>
    ${breadcrumb(crumbs)}
    <div class="tui-box-inner">${body}</div>
    ${actions ? `<div class="tui-actions">${actions}</div>` : ''}
  </section>`;
}

// Fil d'Ariane, façon chemin de fichier : « RémiOS / Réalisations / GLPI ».
// `crumbs` : [libellé, adresse] du menu jusqu'à l'écran affiché ; le dernier,
// sans adresse, est l'écran courant (aria-current). Libellés déjà échappés.
export function breadcrumb(crumbs) {
  if (crumbs.length === 0) return '';
  const items = crumbs
    .map(([label, href], i) =>
      i === crumbs.length - 1 ? `<li><span aria-current="page">${label}</span></li>` : `<li><a href="${href}">${label}</a></li>`,
    )
    .join('');
  return `<nav class="crumbs" aria-label="Fil d'Ariane"><ol>${items}</ol></nav>`;
}

// Bouton « < Retour > » : c'est un lien vers l'écran parent, pour que
// clic, Entrée et clic-molette (nouvel onglet) fonctionnent naturellement.
export function backButton(href) {
  return `<a class="tui-btn tui-btn--primary" href="${href}" data-back>&lt; Retour &gt;</a>`;
}
