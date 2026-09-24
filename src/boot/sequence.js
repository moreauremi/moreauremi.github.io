// =============================================================================
// Séquence de démarrage : GRUB → journal du noyau → systemd → connexion → menu
// -----------------------------------------------------------------------------
// Le boot est un calque noir posé PAR-DESSUS le menu, qui est déjà affiché
// dessous dès le chargement. Conséquences :
//   - « Passer » est instantané : il suffit de retirer le calque ;
//   - le navigateur (et Lighthouse) voit le contenu principal immédiatement.
//
// Planning (5 secondes au maximum) :
//   0 → 1,5 s     écran GRUB et compte à rebours
//   1,5 → 2,6 s   messages du noyau, très rapides
//   2,65 → 4 s    services systemd [  OK  ]
//   4,05 → 4,75 s connexion automatique, frappe de « portfolio --menu »
//   5 s           coupure nette vers le menu, sans transition, comme un vrai
//                 système qui efface l'écran pour lancer un programme
//
// Performance (60 images par seconde) :
//   - une seule boucle requestAnimationFrame : le navigateur l'appelle avant
//     chaque image, et elle traite d'un coup toutes les lignes dont l'heure
//     est venue (un seul recalcul de mise en page par image) ;
//   - l'écran du journal est une grille fixe de lignes (autant que la hauteur
//     de l'écran en contient), créées une seule fois. Pour faire défiler, on
//     réécrit seulement leur texte : aucun élément n'est ajouté, supprimé ni
//     déplacé, donc pas de « décalage de mise en page » (mesure CLS de
//     Lighthouse) et un nombre de lignes dans la page qui ne grandit jamais ;
//   - le seul effet animé, le curseur clignotant, n'utilise que `opacity`.
// =============================================================================

import { grubScreen } from './grub.js';
import { kernelLines, unitLines, loginLines, promptText, COMMAND } from './journal.js';

const GRUB_END = 1500;
const KERNEL_END = 2600;
const UNITS_START = 2650;
const UNITS_END = 4000;
const LOGIN_START = 4050;
const END_AT = 5000;

// `overlay` : calque du boot ; `skipButton` : bouton « Passer le démarrage » ;
// `content` : ce qui est dessous (rendu inerte pendant le boot) ;
// `onFinish` : appelé quand le boot se termine, passé ou non ;
// `hooks` : points d'accroche facultatifs (sons…).
export function createBoot({ overlay, skipButton, content, onFinish, hooks = {} }) {
  let running = false;
  let events = [];
  let next = 0;
  let startTime = 0;
  let frameId = 0;
  let log = null;
  let rows = []; // emplacements de lignes, créés une fois au début du journal
  let shown = []; // lignes actuellement affichées, de haut en bas

  // Réglage système « réduire les animations » (accessibilité) : pas de boot
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function start() {
    if (running) finish();
    if (reducedMotion.matches) {
      onFinish({ reducedMotion: true });
      return;
    }

    running = true;
    overlay.innerHTML = `${grubScreen(2)}<div class="boot-log" hidden></div>`;
    overlay.hidden = false;
    skipButton.hidden = false;
    log = overlay.querySelector('.boot-log');
    rows = [];
    shown = [];

    // Le menu reste dans la page mais devient « inerte » : ni focus clavier,
    // ni clic, ni lecteur d'écran tant que le calque est affiché.
    content.inert = true;

    events = buildTimeline();
    next = 0;
    startTime = performance.now();
    frameId = requestAnimationFrame(frame);
    hooks.onStart?.();
  }

  // Appelée par le navigateur avant chaque image affichée
  function frame(now) {
    const elapsed = now - startTime;
    let newLines = 0;
    let changed = false;

    while (next < events.length && events[next].at <= elapsed) {
      const event = events[next++];
      if (event.type === 'line') {
        shown.push(event.line);
        newLines++;
        changed = true;
      } else if (event.type === 'type') {
        shown.at(-1).typed += event.char; // la dernière ligne est l'invite
        changed = true;
      } else if (event.type === 'countdown') {
        overlay.querySelector('[data-countdown]').textContent = event.value;
      } else if (event.type === 'show-log') {
        overlay.querySelector('.grub').remove();
        log.hidden = false;
        createRows();
      } else if (event.type === 'end') {
        finish();
        return;
      }
    }

    if (changed) paintRows();
    if (newLines > 0) hooks.onLines?.(newLines);
    frameId = requestAnimationFrame(frame);
  }

  // Crée les emplacements de lignes : autant que l'écran peut en afficher.
  // La hauteur d'une ligne est lue une seule fois dans le CSS.
  function createRows() {
    const style = getComputedStyle(log);
    // (repli si le navigateur renvoie « normal » : taille du texte × 1,45)
    const rowHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.45;
    const available = window.innerHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const count = Math.max(5, Math.floor(available / rowHeight));
    rows = Array.from({ length: count }, () => {
      const row = document.createElement('div');
      row.className = 'boot-row';
      return row;
    });
    log.append(...rows);
  }

  // Affiche les dernières lignes dans les emplacements, de haut en bas. Quand
  // l'écran est plein, les lignes « remontent » d'un cran : c'est le défilement.
  // Seuls les emplacements dont le contenu change sont réécrits.
  function paintRows() {
    if (shown.length > rows.length) shown.splice(0, shown.length - rows.length);
    shown.forEach((line, i) => {
      const row = rows[i];
      if (row.line === line && line.kind !== 'prompt') return;
      row.line = line;
      row.replaceChildren(...renderLine(line));
    });
  }

  // Termine le boot (fin normale ou « Passer ») et révèle le menu
  function finish() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(frameId);
    overlay.hidden = true;
    overlay.innerHTML = '';
    skipButton.hidden = true;
    content.inert = false;
    onFinish({ reducedMotion: false });
  }

  // --- Planning -----------------------------------------------------------------

  function buildTimeline() {
    const list = [
      { at: 0, type: 'countdown', value: 2 },
      { at: 750, type: 'countdown', value: 1 },
      { at: GRUB_END, type: 'show-log' },
    ];

    // Répartit des lignes sur un intervalle, avec un léger décalage aléatoire
    // pour imiter l'irrégularité d'un vrai démarrage.
    const spread = (lines, from, to) => {
      const step = (to - from) / lines.length;
      lines.forEach((line, i) => {
        list.push({ at: from + (i + Math.random() * 0.8) * step, type: 'line', line });
      });
    };

    spread(kernelLines(), GRUB_END, KERNEL_END);
    spread(unitLines(), UNITS_START, UNITS_END);

    let at = LOGIN_START;
    for (const line of loginLines()) {
      list.push({ at, type: 'line', line });
      at += 80;
    }
    list.push({ at: (at += 60), type: 'line', line: { kind: 'prompt', typed: '' } });
    // Frappe de la commande, une lettre toutes les 15 ms
    for (const char of COMMAND) list.push({ at: (at += 15), type: 'type', char });

    // Fin : le calque disparaît d'un coup, le menu apparaît aussitôt
    list.push({ at: END_AT, type: 'end' });
    return list.sort((a, b) => a.at - b.at);
  }

  // --- Rendu d'une ligne ------------------------------------------------------------

  // Renvoie les morceaux d'une ligne (textes et <span> colorés). Tout passe
  // par des nœuds texte : aucun HTML à analyser, plus rapide et sans risque
  // d'injection.
  function renderLine(line) {
    if (line.kind === 'kernel') {
      return [span('boot-ts', line.ts), ` ${line.text}`];
    }
    if (line.kind === 'unit') {
      const label = line.status === 'ok' ? '  OK  ' : ' WARN ';
      return [
        '[',
        span(`boot-status boot-status--${line.status}`, label),
        `] ${line.before}`,
        span('boot-unit', line.unit),
        line.after,
      ];
    }
    if (line.kind === 'prompt') {
      return [span('boot-prompt', promptText()), line.typed, span('boot-cursor', '█')];
    }
    return [line.text];
  }

  return { start, skip: finish, isRunning: () => running };
}

function span(className, text) {
  const element = document.createElement('span');
  element.className = className;
  element.textContent = text;
  return element;
}
