// =============================================================================
// Point d'entrée de l'application, chargé par index.html
// -----------------------------------------------------------------------------
// Il construit la page, affiche l'écran demandé par l'URL, lance la séquence
// de démarrage, puis suit les changements d'URL et les touches du clavier.
//
// La page contient deux « vues », une seule visible à la fois :
//   - l'interface RémiOS (menu whiptail, fiches) ;
//   - la vue rapide jury (#/jury), sobre et imprimable.
// Le boot est un calque posé par-dessus, le temps du démarrage.
// =============================================================================

// Styles du site : Vite les regroupe en un seul fichier CSS au build.
import './styles/index.css';
import { parseRoute, onRouteChange, navigate, link } from './router.js';
import { createTui } from './tui/tui.js';
import { createLightbox } from './tui/lightbox.js';
import { createJuryView } from './jury/jury-view.js';
import { createSystemBar } from './ui/system-bar.js';
import { createBoot } from './boot/sequence.js';
import { isTerminalShortcut } from './terminal/shortcut.js';
import { createSounds } from './audio/sounds.js';
import { setupPagers } from './ui/pager.js';
import { setupTabs } from './ui/tabs.js';
import { isTypingTarget } from './utils/keyboard.js';
import { countView, handleCountingToggle } from './utils/audience.js';
import appHtml from './app.html?raw';

// --- Construction de la page ---------------------------------------------------

// Structure de la page (app.html) : barre fixe, les deux vues, calque du boot
const app = document.querySelector('#app');
app.innerHTML = appHtml;

const tuiRoot = app.querySelector('#tui');
const juryRoot = app.querySelector('#jury');
const bootOverlay = app.querySelector('.boot');

const sounds = createSounds();
createSystemBar(app.querySelector('.system-bar'), { sounds });
createLightbox();
setupPagers(app); // barres « < 1 2 3 > » des listes paginées (veille)
setupTabs(app); // onglets « Dernières actualités » / « Mes synthèses » (veille)

// Terminal caché : son code (commandes, système de fichiers simulé, générique,
// textes sources des fiches) forme un fichier JavaScript à part, téléchargé
// seulement à sa première ouverture. La page se charge ainsi plus vite.
let terminal = null;
async function openTerminal() {
  if (!terminal) {
    try {
      const { createTerminal } = await import('./terminal/terminal.js');
      terminal ??= createTerminal({ onReboot: reboot, sounds });
    } catch (error) {
      // Hors ligne, ou nouvelle version du site publiée depuis l'ouverture de
      // la page (le fichier du terminal a changé de nom) : rien ne s'ouvre.
      console.error('Terminal indisponible :', error);
      return;
    }
  }
  terminal.open();
}

const tui = createTui(tuiRoot, { onReboot: reboot, onOpenTerminal: openTerminal });
const jury = createJuryView(juryRoot);

const boot = createBoot({
  overlay: bootOverlay,
  skipButton: app.querySelector('.boot-skip'),
  content: tuiRoot,
  // Sons : bip POST au démarrage, clics de disque quand des lignes s'affichent
  hooks: { onStart: sounds.post, onLines: sounds.disk },
  onFinish: ({ reducedMotion }) => {
    // Sans boot (animations réduites), rien ne change à l'écran : on ne
    // déplace pas le focus, la touche Tab mène d'abord à « Vue rapide jury ».
    if (reducedMotion) return;
    // Après le boot, le focus clavier se place sur le menu, prêt à naviguer
    if (!isJuryRoute(parseRoute())) tui.focusMenu();
    tui.announce('Démarrage terminé. Menu principal.');
  },
});

// --- Affichage de l'écran demandé -----------------------------------------------

function isJuryRoute(route) {
  return route.name === 'jury' || route.name === 'jury-fiche' || route.name === 'jury-tag';
}

function render(route, options) {
  // Un changement d'écran pendant le boot (clic sur « Vue rapide jury »,
  // bouton Précédent…) interrompt le démarrage.
  if (boot.isRunning() && route.name !== 'home') boot.skip();

  // Bip de validation à l'ouverture d'une rubrique ou d'une fiche
  // (pas au premier affichage : le visiteur n'a encore rien choisi)
  if (options?.focus !== false && ['section', 'veille', 'fiche', 'tag'].includes(route.name)) sounds.select();

  // Mesure d'audience : un écran affiché = une page vue (voir utils/audience.js)
  countView();

  const juryMode = isJuryRoute(route);
  // L'attribut data-view sur <html> permet au CSS d'adapter le fond de page
  document.documentElement.dataset.view = juryMode ? 'jury' : 'tui';
  tuiRoot.hidden = juryMode;
  juryRoot.hidden = !juryMode;
  if (juryMode) jury.show(route, options);
  else tui.show(route, options);
}

// « <Redémarrer> » : retour au menu principal et nouveau démarrage
function reboot() {
  boot.start();
  navigate(link.home());
}

// Premier affichage : l'écran demandé est rendu tout de suite (sous le boot),
// sans déplacer le focus. Le boot ne se joue qu'à l'arrivée sur l'accueil :
// un lien direct (#/jury, #/realisations/nas…) affiche la page sans attendre.
handleCountingToggle(); // #toggle-goatcounter : ne plus compter ses propres visites
const firstRoute = parseRoute();
render(firstRoute, { focus: false });
if (firstRoute.name === 'home') boot.start();

onRouteChange((route) => render(handleCountingToggle() ? parseRoute() : route));

// --- Passer le démarrage -----------------------------------------------------------

app.querySelector('.boot-skip').addEventListener('click', () => boot.skip());

// Un clic (ou un appui tactile) n'importe où sur l'écran de boot le passe
bootOverlay.addEventListener('pointerdown', () => boot.skip());

// --- Son : autorisation du navigateur -------------------------------------------------

// Les navigateurs n'autorisent le son qu'après un clic ou une touche : à chaque
// interaction, on prépare le son (s'il est activé). « capture » : avant tout
// autre traitement, pour que le bip d'une rubrique ouverte au clavier sonne.
document.addEventListener('pointerdown', sounds.unlock, { capture: true });
document.addEventListener('keydown', sounds.unlock, { capture: true });

// --- Clavier ---------------------------------------------------------------------

document.addEventListener('keydown', (event) => {
  // Pendant le boot, n'importe quelle touche le passe. Exceptions : Tab et
  // Maj, pour pouvoir atteindre au clavier les boutons « Vue rapide jury » et
  // « Passer le démarrage ». La touche continue ensuite son chemin : une
  // flèche ou un chiffre agit directement sur le menu.
  if (boot.isRunning() && !['Tab', 'Shift'].includes(event.key)) boot.skip();

  // Terminal caché : ` ou ², ou Ctrl+Alt+T (depuis l'interface RémiOS)
  if (
    isTerminalShortcut(event) &&
    !terminal?.isOpen() &&
    !isTypingTarget(event.target) &&
    !isJuryRoute(parseRoute())
  ) {
    event.preventDefault(); // le caractère ` ne doit pas s'écrire dans le terminal
    openTerminal();
    return;
  }

  // Touche pressée dans une fenêtre ouverte par-dessus la page (visionneuse…) :
  // c'est elle qui la gère (Échap la ferme sans revenir en arrière dans le menu).
  if (event.target.closest?.('dialog')) return;

  if (isJuryRoute(parseRoute())) jury.handleKey(event);
  else tui.handleKey(event);
});
