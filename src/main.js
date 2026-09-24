// =============================================================================
// Point d'entrée de l'application, chargé par index.html
// -----------------------------------------------------------------------------
// Il construit la page, affiche l'écran demandé par l'URL, puis suit les
// changements d'URL et les touches du clavier.
// =============================================================================

// Styles du site : Vite les regroupe en un seul fichier CSS au build.
import './styles/index.css';
import { parseRoute, onRouteChange, navigate, link } from './router.js';
import { createTui } from './tui/tui.js';
import { createLightbox } from './tui/lightbox.js';

const app = document.querySelector('#app');
app.innerHTML = '<main class="tui" id="tui"></main>';
document.documentElement.dataset.view = 'tui';

const tui = createTui(document.querySelector('#tui'), {
  // Provisoire : la séquence de démarrage sera branchée ici à l'étape 7
  onReboot: () => navigate(link.home()),
});

// Visionneuse des captures d'écran des fiches
createLightbox();

// Premier affichage sans déplacer le focus (le visiteur n'a encore rien fait)
tui.show(parseRoute(), { focus: false });
onRouteChange((route) => tui.show(route));

document.addEventListener('keydown', (event) => {
  // Touche pressée dans une fenêtre ouverte par-dessus la page (visionneuse…) :
  // c'est elle qui la gère (Échap la ferme sans revenir en arrière dans le menu).
  if (event.target.closest?.('dialog')) return;
  tui.handleKey(event);
});
