// =============================================================================
// Terminal caché (easter egg)
// -----------------------------------------------------------------------------
// S'ouvre avec la touche ` (ou ² sur un clavier AZERTY PC), Ctrl+Alt+T, ou le
// bouton [tty2] de la barre du haut (seul moyen sur mobile).
//
//   - invite « remi@remios:~$ » qui suit le dossier courant ;
//   - historique : flèches ↑ ↓ ;
//   - autocomplétion : Tab (ou le bouton « Tab » sur mobile) ;
//   - Ctrl+L efface l'écran, Ctrl+C abandonne la ligne, Échap ferme.
//
// C'est une fenêtre <dialog> native : focus piégé à l'intérieur, Échap pour
// fermer, focus rendu au bouton d'origine à la fermeture.
// Tout est simulé (commands.js) : rien n'est exécuté réellement.
// =============================================================================

import { site } from '../content.js';
import { navigate } from '../router.js';
import { reducedMotion } from '../utils/motion.js';
import { htmlToElement } from '../utils/template.js';
import { COMMANDS, complete } from './commands.js';
import { buildFilesystem, displayPath, HOME } from './filesystem.js';
import { playCrawl, crawlTranscript } from './movie.js';
import terminalHtml from './terminal.html?raw';

const MAX_OUTPUT_LINES = 500; // au-delà, les plus anciennes lignes sont retirées

export function createTerminal({ onReboot, sounds }) {
  const { utilisateur, machine } = site.identite;

  // Fenêtre du terminal (terminal.html) : barre de titre, zone de texte,
  // ligne de saisie. Le titre se termine par « remi@remios ».
  const dialog = htmlToElement(terminalHtml);
  dialog.querySelector('[data-slot="hote"]').textContent = `${utilisateur}@${machine}`;
  document.body.append(dialog);

  const output = dialog.querySelector('.terminal-output');
  const form = dialog.querySelector('.terminal-form');
  const prompt = dialog.querySelector('.terminal-prompt');
  const input = dialog.querySelector('.terminal-input');

  const history = [];
  let historyIndex = 0; // position dans l'historique pendant la navigation ↑ ↓
  let welcomed = false;

  // Contexte transmis aux commandes (voir commands.js)
  const ctx = {
    fs: buildFilesystem(),
    cwd: HOME,
    history,
    setCwd(path) {
      ctx.cwd = path;
      updatePrompt();
    },
    print,
    clear: () => output.replaceChildren(),
    close,
    go(hash) {
      close();
      navigate(hash);
    },
    reboot() {
      close();
      onReboot();
    },
    playMovie,
  };

  // --- Easter egg : générique façon Star Wars (commande `starwars`) ------------

  let movie = null; // générique en cours de lecture

  function playMovie() {
    if (movie) return;
    if (reducedMotion.matches) {
      // Animations réduites : le générique est simplement affiché en texte
      for (const line of crawlTranscript()) print([line, 'term-warn']);
      return;
    }
    print(['Transmission entrante… (Échap pour arrêter)', 'term-dim']);
    // L'animation est cachée aux lecteurs d'écran : ils reçoivent son texte ici
    print([crawlTranscript().join(' '), 'visually-hidden']);
    movie = playCrawl(dialog, {
      sounds,
      onEnd() {
        movie = null;
        print(['Fin de la transmission.', 'term-dim']);
        input.focus();
      },
    });
  }

  // Échap pendant le générique : l'arrête, sans fermer le terminal
  dialog.addEventListener('cancel', (event) => {
    if (!movie) return;
    event.preventDefault();
    movie.stop();
  });

  // --- Ouverture / fermeture -------------------------------------------------

  function open() {
    if (dialog.open) return;
    dialog.showModal();
    if (!welcomed) {
      welcomed = true;
      print(['RémiOS 1.0 — terminal de démonstration.', 'term-key']);
      print(['Tout est simulé dans le navigateur : aucune commande n\'est réellement exécutée.', 'term-dim']);
      print('Tapez ', ['help', 'term-key'], ' pour la liste des commandes.');
    }
    updatePrompt();
    input.focus();
  }

  function close() {
    movie?.stop();
    if (dialog.open) dialog.close();
  }

  // --- Affichage ---------------------------------------------------------------

  // Ajoute une ligne. Chaque morceau est un texte, ou [texte, classe CSS] pour
  // le colorer. textContent est utilisé partout : ce que tape le visiteur
  // n'est jamais interprété comme du HTML.
  function print(...parts) {
    const line = document.createElement('div');
    for (const part of parts) {
      if (Array.isArray(part)) {
        const span = document.createElement('span');
        span.textContent = part[0];
        if (part[1]) span.className = part[1];
        line.append(span);
      } else {
        line.append(part);
      }
    }
    output.append(line);
    while (output.childElementCount > MAX_OUTPUT_LINES) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  }

  function promptText() {
    return `${utilisateur}@${machine}:${displayPath(ctx.cwd)}$`;
  }

  function updatePrompt() {
    prompt.textContent = promptText();
  }

  // --- Exécution d'une commande ------------------------------------------------

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const line = input.value.trim();
    input.value = '';
    print([`${promptText()} `, 'term-prompt'], line);
    if (line === '') return;

    if (history.at(-1) !== line) history.push(line);
    historyIndex = history.length;

    const [name, ...args] = line.split(/\s+/);
    const command = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : null;
    if (command) command(args, ctx);
    else print([`${name} : commande introuvable. Tapez help pour la liste des commandes.`, 'term-err']);
  });

  // --- Clavier dans le champ de saisie --------------------------------------------

  input.addEventListener('keydown', (event) => {
    if (movie) {
      // Pendant le générique : Échap, q ou Ctrl+C l'arrêtent, le reste est ignoré
      event.preventDefault();
      const key = event.key.toLowerCase();
      if (key === 'escape' || key === 'q' || (event.ctrlKey && key === 'c')) movie.stop();
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      browseHistory(event.key === 'ArrowUp' ? -1 : 1);
    } else if (event.key === 'Tab' && !event.shiftKey) {
      // Maj+Tab reste disponible pour sortir du champ au clavier
      event.preventDefault();
      autocomplete();
    } else if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      ctx.clear();
    } else if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      print([`${promptText()} `, 'term-prompt'], `${input.value}^C`);
      input.value = '';
    }
  });

  function browseHistory(step) {
    if (history.length === 0) return;
    historyIndex = Math.min(Math.max(historyIndex + step, 0), history.length);
    input.value = history[historyIndex] ?? '';
    // Curseur en fin de ligne
    requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
  }

  function autocomplete() {
    const { value, suggestions } = complete(input.value, ctx);
    input.value = value;
    if (suggestions.length > 0) {
      print([`${promptText()} `, 'term-prompt'], input.value);
      print(['  ' + suggestions.join('  '), 'term-dir']);
    }
    input.focus();
  }

  // --- Boutons et clics ------------------------------------------------------------

  dialog.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'close') close();
    if (action === 'tab') autocomplete();
  });

  // Un clic dans la zone de texte redonne le focus au champ (sauf si l'on
  // sélectionne du texte pour le copier)
  output.addEventListener('click', () => {
    if (String(window.getSelection()) === '') input.focus();
  });

  return { open, close, isOpen: () => dialog.open };
}
