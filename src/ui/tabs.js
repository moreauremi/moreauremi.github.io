// =============================================================================
// Onglets : plusieurs contenus au même endroit, un seul visible à la fois
// -----------------------------------------------------------------------------
// Les panneaux masqués portent data-off. Chaque panneau garde sa propre
// hauteur ; changer d'onglet ne fait pourtant jamais défiler l'écran (voir
// keepScroll ci-dessous).
//
// Au clavier (modèle ARIA des onglets) : Tab atteint l'onglet actif, ← et →
// passent à l'onglet voisin, Début et Fin au premier et au dernier.
// =============================================================================

// Compteur d'identifiants : chaque affichage crée des id uniques, même si
// RémiOS et la vue jury contiennent les mêmes onglets en même temps.
let count = 0;

// `items` : [{ label, html }], le premier est affiché ; `label` nomme le
// groupe d'onglets pour les lecteurs d'écran.
export function tabs(items, { label }) {
  const id = `onglets-${++count}`;
  const buttons = items
    .map(
      (item, i) => `<button type="button" class="tab" role="tab" id="${id}-onglet-${i}" aria-controls="${id}-panneau-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${item.label}</button>`,
    )
    .join('');
  // data-title : titre du panneau, affiché à l'impression (où tous les
  // panneaux sont imprimés l'un après l'autre)
  const panels = items
    .map(
      (item, i) => `<div class="tab-panel" role="tabpanel" id="${id}-panneau-${i}" aria-labelledby="${id}-onglet-${i}" data-title="${item.label}"${i > 0 ? ' data-off' : ''}>${item.html}</div>`,
    )
    .join('');
  return `<div class="tabs">
    <div class="tab-list" role="tablist" aria-label="${label}">${buttons}</div>
    <div class="tab-panels">${panels}</div>
  </div>`;
}

// Une seule écoute pour tout le site (événements délégués)
export function setupTabs(root) {
  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab);
  });

  root.addEventListener('keydown', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab) return;
    const all = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
    const index = all.indexOf(tab);
    const target = {
      ArrowRight: all[(index + 1) % all.length],
      ArrowLeft: all[(index - 1 + all.length) % all.length],
      Home: all[0],
      End: all[all.length - 1],
    }[event.key];
    if (!target) return;
    event.preventDefault();
    select(target);
    target.focus({ preventScroll: true });
  });
}

function select(tab) {
  const container = tab.closest('.tabs');
  const zone = container.querySelector(':scope > .tab-panels');
  const all = [...container.querySelectorAll('[role="tab"]')];
  const panels = [...zone.children];

  keepScroll(zone, () => {
    all.forEach((t, i) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[i].toggleAttribute('data-off', !on);
    });
  });
}

// Si le nouveau panneau est plus court, la page peut devenir trop courte
// pour la position de lecture : le navigateur remonterait alors d'un coup.
// Dans ce cas seulement, la zone garde la hauteur qui manque (sinon, aucune
// hauteur imposée : pas de grand vide sous un panneau court). Tout se fait
// avant l'affichage suivant : l'écran ne bouge pas.
function keepScroll(zone, change) {
  const y = window.scrollY;
  zone.style.minHeight = '';
  change();
  const missing = y + window.innerHeight - document.documentElement.scrollHeight;
  if (missing > 0) zone.style.minHeight = `${zone.offsetHeight + missing}px`;
  if (window.scrollY !== y) window.scrollTo(0, y);
}
