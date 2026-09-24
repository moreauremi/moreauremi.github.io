// =============================================================================
// Point d'entrée de l'application, chargé par index.html
// -----------------------------------------------------------------------------
// Il construit la page, affiche l'écran demandé par l'URL, puis suit les
// changements d'URL et les touches du clavier.
//
// La page contient deux « vues », une seule visible à la fois :
//   - l'interface RémiOS (menu whiptail, fiches) ;
//   - la vue rapide jury (#/jury), sobre et imprimable.
// =============================================================================

// Styles du site : Vite les regroupe en un seul fichier CSS au build.
import './styles/index.css';
import { parseRoute, onRouteChange, navigate, link } from './router.js';
import { createTui } from './tui/tui.js';
import { createLightbox } from './tui/lightbox.js';
import { createJuryView } from './jury/jury-view.js';
import { createSystemBar } from './ui/system-bar.js';

// --- Construction de la page ---------------------------------------------------

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="system-bar" role="region" aria-label="Accès rapides"></div>
  <main class="tui" id="tui"></main>
  <main class="jury" id="jury" hidden></main>`;

const tuiRoot = app.querySelector('#tui');
const juryRoot = app.querySelector('#jury');

createSystemBar(app.querySelector('.system-bar'));
createLightbox();

const tui = createTui(tuiRoot, {
  // Provisoire : la séquence de démarrage sera branchée ici à l'étape 7
  onReboot: () => navigate(link.home()),
});
const jury = createJuryView(juryRoot);

// --- Affichage de l'écran demandé -----------------------------------------------

function isJuryRoute(route) {
  return route.name === 'jury' || route.name === 'jury-fiche';
}

function render(route, options) {
  const juryMode = isJuryRoute(route);
  // L'attribut data-view sur <html> permet au CSS d'adapter le fond de page
  document.documentElement.dataset.view = juryMode ? 'jury' : 'tui';
  tuiRoot.hidden = juryMode;
  juryRoot.hidden = !juryMode;
  if (juryMode) jury.show(route, options);
  else tui.show(route, options);
}

// Premier affichage sans déplacer le focus (le visiteur n'a encore rien fait)
render(parseRoute(), { focus: false });
onRouteChange((route) => render(route));

// --- Clavier ---------------------------------------------------------------------

document.addEventListener('keydown', (event) => {
  // Touche pressée dans une fenêtre ouverte par-dessus la page (visionneuse…) :
  // c'est elle qui la gère (Échap la ferme sans revenir en arrière dans le menu).
  if (event.target.closest?.('dialog')) return;

  if (isJuryRoute(parseRoute())) jury.handleKey(event);
  else tui.handleKey(event);
});
