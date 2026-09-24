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
//   4,05 → 4,8 s  connexion automatique, frappe de « portfolio --menu »
//   4,8 → 5 s     fondu vers le menu
//
// Performance (60 images par seconde) :
//   - une seule boucle requestAnimationFrame : le navigateur l'appelle avant
//     chaque image, et elle affiche d'un coup toutes les lignes dont l'heure
//     est venue (ajout groupé : un seul recalcul de mise en page par image) ;
//   - le nombre de lignes présentes dans la page est limité à la hauteur de
//     l'écran : les plus anciennes sont supprimées ;
//   - le défilement vient du CSS (lignes calées en bas), sans calcul en JS ;
//   - le seul effet animé, le fondu final, n'utilise que `opacity`.
// =============================================================================

import { grubScreen } from './grub.js';
import { kernelLines, unitLines, loginLines, promptText, COMMAND } from './journal.js';

const GRUB_END = 1500;
const KERNEL_END = 2600;
const UNITS_START = 2650;
const UNITS_END = 4000;
const LOGIN_START = 4050;
const LEAVE_AT = 4800;
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
  let command = null;
  let maxLines = 60;

  // Réglage système « réduire les animations » (accessibilité) : pas de boot
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function start() {
    if (running) finish();
    if (reducedMotion.matches) {
      onFinish({ reducedMotion: true });
      return;
    }

    running = true;
    overlay.classList.remove('is-leaving');
    overlay.innerHTML = `${grubScreen(2)}<div class="boot-log" hidden></div>`;
    overlay.hidden = false;
    skipButton.hidden = false;
    log = overlay.querySelector('.boot-log');
    command = null;

    // Le menu reste dans la page mais devient « inerte » : ni focus clavier,
    // ni clic, ni lecteur d'écran tant que le calque est affiché.
    content.inert = true;

    // Assez de lignes pour remplir l'écran, pas davantage
    maxLines = Math.ceil(window.innerHeight / 16) + 4;

    events = buildTimeline();
    next = 0;
    startTime = performance.now();
    frameId = requestAnimationFrame(frame);
    hooks.onStart?.();
  }

  // Appelée par le navigateur avant chaque image affichée
  function frame(now) {
    const elapsed = now - startTime;
    const batch = document.createDocumentFragment();
    let newLines = 0;

    while (next < events.length && events[next].at <= elapsed) {
      const event = events[next++];
      if (event.type === 'line') {
        batch.append(renderLine(event.line));
        newLines++;
      } else if (event.type === 'type') {
        flush(batch);
        command.textContent += event.char;
      } else if (event.type === 'countdown') {
        overlay.querySelector('[data-countdown]').textContent = event.value;
      } else if (event.type === 'show-log') {
        overlay.querySelector('.grub').remove();
        log.hidden = false;
      } else if (event.type === 'leave') {
        overlay.classList.add('is-leaving'); // fondu CSS sur opacity
      } else if (event.type === 'end') {
        finish();
        return;
      }
    }

    flush(batch);
    if (newLines > 0) hooks.onLines?.(newLines);
    frameId = requestAnimationFrame(frame);
  }

  // Ajoute d'un coup les lignes préparées, puis retire les plus anciennes
  function flush(batch) {
    if (!batch.hasChildNodes()) return;
    log.append(batch);
    while (log.childElementCount > maxLines) log.firstElementChild.remove();
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
    list.push({ at: (at += 60), type: 'line', line: { kind: 'prompt' } });
    // Frappe de la commande, une lettre toutes les 15 ms
    for (const char of COMMAND) list.push({ at: (at += 15), type: 'type', char });

    list.push({ at: LEAVE_AT, type: 'leave' });
    list.push({ at: END_AT, type: 'end' });
    return list.sort((a, b) => a.at - b.at);
  }

  // --- Rendu d'une ligne ------------------------------------------------------------

  // Construit la ligne avec des nœuds texte (textContent) : aucun HTML à
  // analyser, c'est plus rapide et sans risque d'injection.
  function renderLine(line) {
    const row = document.createElement('div');

    if (line.kind === 'kernel') {
      row.append(span('boot-ts', line.ts), ` ${line.text}`);
    } else if (line.kind === 'unit') {
      const label = line.status === 'ok' ? '  OK  ' : ' WARN ';
      row.append(
        '[',
        span(`boot-status boot-status--${line.status}`, label),
        `] ${line.before}`,
        span('boot-unit', line.unit),
        line.after,
      );
    } else if (line.kind === 'prompt') {
      command = span('boot-command', '');
      row.append(span('boot-prompt', promptText()), command, span('boot-cursor', '█'));
    } else {
      row.textContent = line.text;
    }
    return row;
  }

  return { start, skip: finish, isRunning: () => running };
}

function span(className, text) {
  const element = document.createElement('span');
  element.className = className;
  element.textContent = text;
  return element;
}
