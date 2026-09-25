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
import { createTerminal, isTerminalShortcut } from './terminal/terminal.js';
import { createSounds } from './audio/sounds.js';
import { isTypingTarget } from './utils/keyboard.js';

// --- Construction de la page ---------------------------------------------------

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="system-bar" role="region" aria-label="Accès rapides"></div>
  <main class="tui" id="tui"></main>
  <main class="jury" id="jury" hidden></main>
  <div class="boot" hidden aria-hidden="true"></div>
  <button type="button" class="boot-skip" hidden>Passer le démarrage</button>`;

const tuiRoot = app.querySelector('#tui');
const juryRoot = app.querySelector('#jury');
const bootOverlay = app.querySelector('.boot');

const sounds = createSounds();
createSystemBar(app.querySelector('.system-bar'), { sounds });
createLightbox();

const terminal = createTerminal({ onReboot: reboot, sounds });
const tui = createTui(tuiRoot, { onReboot: reboot, onOpenTerminal: () => terminal.open() });
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
  return route.name === 'jury' || route.name === 'jury-fiche';
}

function render(route, options) {
  // Un changement d'écran pendant le boot (clic sur « Vue rapide jury »,
  // bouton Précédent…) interrompt le démarrage.
  if (boot.isRunning() && route.name !== 'home') boot.skip();

  // Bip de validation à l'ouverture d'une rubrique ou d'une fiche
  // (pas au premier affichage : le visiteur n'a encore rien choisi)
  if (options?.focus !== false && (route.name === 'section' || route.name === 'fiche')) sounds.select();

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
const firstRoute = parseRoute();
render(firstRoute, { focus: false });
if (firstRoute.name === 'home') boot.start();

onRouteChange((route) => render(route));

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
    !terminal.isOpen() &&
    !isTypingTarget(event.target) &&
    !isJuryRoute(parseRoute())
  ) {
    event.preventDefault(); // le caractère ` ne doit pas s'écrire dans le terminal
    terminal.open();
    return;
  }

  // Touche pressée dans une fenêtre ouverte par-dessus la page (visionneuse…) :
  // c'est elle qui la gère (Échap la ferme sans revenir en arrière dans le menu).
  if (event.target.closest?.('dialog')) return;

  if (isJuryRoute(parseRoute())) jury.handleKey(event);
  else tui.handleKey(event);
});
