// Boîte de dialogue façon whiptail : fond gris, bordures en relief, ombre
// portée et titre centré sur la bordure du haut, entre crochets.
// Les crochets sont décoratifs : cachés aux lecteurs d'écran (aria-hidden).
//
// Le titre est un <h1> focalisable (tabindex="-1") : à l'ouverture d'une
// rubrique, le focus y est placé pour que les lecteurs d'écran l'annoncent.

export function box({ title, body, actions = '' }) {
  return `<section class="tui-box" aria-labelledby="tui-box-title">
    <h1 class="tui-box-title" id="tui-box-title" tabindex="-1"><span aria-hidden="true">[ </span>${title}<span aria-hidden="true"> ]</span></h1>
    <div class="tui-box-inner">${body}</div>
    ${actions ? `<div class="tui-actions">${actions}</div>` : ''}
  </section>`;
}

// Bouton « < Retour > » : c'est un lien vers l'écran parent, pour que
// clic, Entrée et clic-molette (nouvel onglet) fonctionnent naturellement.
export function backButton(href) {
  return `<a class="tui-btn tui-btn--primary" href="${href}" data-back>&lt; Retour &gt;</a>`;
}
