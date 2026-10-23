// =============================================================================
// Point d'entrée de l'application, chargé par index.html
// -----------------------------------------------------------------------------
// Il construit la page, affiche l'écran demandé par l'URL, puis suit les
// changements d'URL et les touches du clavier.
//
// La page contient deux « vues », une seule visible à la fois :
//   - la vue page, façon Notion (accueil, rubriques, fiches) ;
//   - la vue rapide jury (#/jury), sobre et imprimable.
// =============================================================================

// Styles du site : Vite les regroupe en un seul fichier CSS au build.
import './styles/index.css';
import { parseRoute, onRouteChange } from './router.js';
import { createPageView } from './page/page-view.js';
import { createLightbox } from './tui/lightbox.js';
import { createJuryView } from './jury/jury-view.js';
import { setupPagers } from './ui/pager.js';
import { setupTabs } from './ui/tabs.js';
import { countView, handleCountingToggle } from './utils/audience.js';
import appHtml from './app.html?raw';

// --- Construction de la page ---------------------------------------------------

// Structure de la page (app.html) : les deux vues
const app = document.querySelector('#app');
app.innerHTML = appHtml;

const pageRoot = app.querySelector('#page');
const juryRoot = app.querySelector('#jury');

createLightbox();
setupPagers(app); // barres « < 1 2 3 > » des listes paginées (veille)
setupTabs(app); // onglets « Mes synthèses » / « Dernières actualités » (veille)

// La vue page est créée avant d'écouter les changements d'adresse : elle
// retient ainsi la page quittée avant d'afficher la suivante (« ← Retour »).
const page = createPageView(pageRoot);
const jury = createJuryView(juryRoot);

// --- Affichage de l'écran demandé -----------------------------------------------

function isJuryRoute(route) {
  return ['jury', 'jury-fiche', 'jury-techno', 'jury-tag'].includes(route.name);
}

function render(route, options) {
  // Mesure d'audience : un écran affiché = une page vue (voir utils/audience.js)
  countView();

  const juryMode = isJuryRoute(route);
  // L'attribut data-view sur <html> permet au CSS d'adapter le fond de page
  document.documentElement.dataset.view = juryMode ? 'jury' : 'page';
  pageRoot.hidden = juryMode;
  juryRoot.hidden = !juryMode;
  if (juryMode) jury.show(route, options);
  else page.show(route, options);
}

// Premier affichage : l'écran demandé est rendu tout de suite, sans déplacer
// le focus.
handleCountingToggle(); // #toggle-goatcounter : ne plus compter ses propres visites
render(parseRoute(), { focus: false });

onRouteChange((route) => render(handleCountingToggle() ? parseRoute() : route));

// --- Clavier ---------------------------------------------------------------------

document.addEventListener('keydown', (event) => {
  // Touche pressée dans une fenêtre ouverte par-dessus la page (visionneuse…) :
  // c'est elle qui la gère (Échap la ferme sans changer de page).
  if (event.target.closest?.('dialog')) return;

  if (isJuryRoute(parseRoute())) jury.handleKey(event);
  else page.handleKey(event);
});
