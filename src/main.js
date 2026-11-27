// =============================================================================
// JavaScript commun à toutes les pages
// -----------------------------------------------------------------------------
// Le contenu est déjà dans le HTML (fabriqué au build) : ce fichier n'ajoute
// que ce qui demande du JavaScript.
//   - la sphère ASCII de l'accueil ;
//   - le terminal caché (` ou ², ou Ctrl+Alt+T), téléchargé à sa première
//     ouverture seulement ;
//   - la mesure d'audience ;
//   - les anciennes adresses du site RémiOS (#/realisations/glpi…), renvoyées
//     vers les nouvelles pages.
// =============================================================================

import './styles/site.css';
import { countView, handleCountingToggle } from './audience.js';

const html = document.documentElement;
const root = html.dataset.root || './';

// --- Anciennes adresses (#/…) ----------------------------------------------------

const LEGACY = [
  [/^realisations\/([a-z0-9-]+)$/, (m) => `projets/${m[1]}/`],
  [/^(realisations|technos)(\/.*)?$/, () => 'projets/'],
  [/^veille\/([a-z0-9-]+)$/, (m) => `veille/#${m[1]}`],
  [/^veille$/, () => 'veille/'],
  [/^(formations|certifications)$/, () => 'formations/'],
  [/^contact$/, () => 'contact/'],
  [/^message-envoye$/, () => 'contact/merci/'],
  [/^(jury\/)?mentions-legales$/, () => 'mentions-legales/'],
];

function legacyTarget(hash) {
  const route = hash.replace(/^#\/?/, '').replace(/^en(\/|$)/, '').replace(/\/+$/, '');
  for (const [pattern, target] of LEGACY) {
    const match = pattern.exec(route);
    if (match) return target(match);
  }
  return null;
}

if (html.dataset.page === '' && window.location.hash.startsWith('#/')) {
  const target = legacyTarget(window.location.hash);
  if (target) window.location.replace(root + target);
  else history.replaceState(null, '', window.location.pathname);
}

// --- Sphère de l'accueil ---------------------------------------------------------

const canvas = document.querySelector('.sphere-canvas');
if (canvas) import('./sphere.js').then(({ startSphere }) => startSphere(canvas));

// --- Terminal caché ------------------------------------------------------------------

let terminal = null;
async function openTerminal() {
  try {
    terminal ??= (await import('./terminal/terminal.js')).createTerminal({ root });
    terminal.open();
  } catch (error) {
    // Hors ligne, ou nouvelle version publiée depuis l'ouverture de la page
    console.error('terminal indisponible :', error);
  }
}

const isTyping = (target) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

function isTerminalShortcut(event) {
  if (event.ctrlKey && event.altKey && event.code === 'KeyT') return true;
  if (event.ctrlKey || event.altKey || event.metaKey) return false;
  return event.key === '`' || event.key === '²' || event.code === 'Backquote';
}

document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || isTyping(event.target) || terminal?.isOpen()) return;
  if (!isTerminalShortcut(event)) return;
  event.preventDefault();
  openTerminal();
});

// --- Mesure d'audience ---------------------------------------------------------------

if (!handleCountingToggle()) countView({ endpoint: html.dataset.goatcounter, site: html.dataset.site });
