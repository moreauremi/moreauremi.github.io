// =============================================================================
// Terminal caché
// -----------------------------------------------------------------------------
// S'ouvre avec ` (ou ²) ou Ctrl+Alt+T, se ferme avec Échap ou `exit`. Le site
// y est parcouru comme un système de fichiers simulé : rien n'est exécuté.
//   ~/a-propos.txt, ~/contact.txt, ~/formations.txt
//   ~/projets/<formation|entreprise|perso>/<fiche>.md
//   ~/veille/<sujet>.md
// Contenu : module virtual:site-data, fabriqué au build depuis content/.
// =============================================================================

import data from 'virtual:site-data';
import '../styles/terminal.css';

const TYPES = { formation: 'en formation', entreprise: 'en entreprise (1Life)', perso: 'perso' };
const PAGES = { accueil: '', projets: 'projets/', veille: 'veille/', formations: 'formations/', contact: 'contact/', 'mentions-legales': 'mentions-legales/' };
const HOME = '~';

// --- Système de fichiers simulé ----------------------------------------------------

const file = (content, route) => ({ type: 'file', content, route });
const dir = (children) => ({ type: 'dir', children });

function projetText(p) {
  return [
    `# ${p.titre}`,
    `${p.date} · ${p.domaine} · ${p.statut}`,
    '',
    p.resume,
    '',
    `contexte : ${p.contexte}`,
    "ce que j'ai fait :",
    ...p.actions.map((a) => `  - ${a}`),
    `compétences : ${p.tags.join(' · ')}`,
    ...p.liens.map((l) => `${l.libelle} : ${l.url}`),
  ].join('\n');
}

function buildFs() {
  const projets = Object.fromEntries(
    Object.keys(TYPES).map((type) => [
      type,
      dir(Object.fromEntries(data.projets.filter((p) => p.type === type).map((p) => [`${p.slug}.md`, file(projetText(p), `projets/${p.slug}/`)]))),
    ]),
  );
  const { formation, alternance, activite, ville } = data.accueil;
  return dir({
    'a-propos.txt': file([data.nom.toLowerCase(), formation, alternance, activite, ville].join('\n'), ''),
    'contact.txt': file(
      [`e-mail   : ${data.contact.email}`, `github   : ${data.contact.github}`, `linkedin : ${data.contact.linkedin}`, data.cv ? 'cv       : open cv' : ''].filter(Boolean).join('\n'),
      'contact/',
    ),
    'formations.txt': file(data.formations.map((f) => `${f.date.padEnd(18)} ${f.titre} (${f.organisme})`).join('\n'), 'formations/'),
    projets: dir(projets),
    veille: dir(Object.fromEntries(data.veille.map((s) => [`${s.id}.md`, file(`# ${s.titre}\n${s.syntheses} synthèse(s) publiée(s).`, `veille/#${s.id}`)]))),
  });
}

function resolve(cwd, target = '') {
  const parts = target.startsWith('~') || target.startsWith('/') ? [] : cwd.split('/').slice(1);
  for (const part of target.replace(/^~\/?|^\//, '').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return [HOME, ...parts].join('/');
}

function nodeAt(fs, path) {
  let node = fs;
  for (const part of path.split('/').slice(1)) {
    node = node?.type === 'dir' ? node.children[part] : undefined;
  }
  return node;
}

// --- Terminal --------------------------------------------------------------------------

export function createTerminal({ root }) {
  const fs = buildFs();
  let cwd = HOME;
  const history = [];
  let historyIndex = 0;
  let previousFocus = null;

  const panel = document.createElement('div');
  panel.className = 'term';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'terminal');
  panel.innerHTML = `<div class="term-inner">
    <div class="term-out" role="log" aria-live="polite"></div>
    <form class="term-line"><label class="term-prompt" for="term-input"></label><input id="term-input" class="term-input" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go"></form>
  </div>`;
  document.body.append(panel);
  const out = panel.querySelector('.term-out');
  const input = panel.querySelector('.term-input');
  const prompt = panel.querySelector('.term-prompt');
  const promptText = () => `visiteur@remim.me:${cwd}$`;

  function print(text = '', className = '') {
    const line = document.createElement('div');
    line.textContent = text;
    if (className) line.className = className;
    out.append(line);
  }

  const go = (route) => window.location.assign(root + route);

  const COMMANDS = {
    help() {
      print('commandes (tout est simulé, rien n’est exécuté) :', 'dim');
      for (const [name, text] of [
        ['help', 'cette aide'],
        ['whoami', 'qui suis-je'],
        ['ls [dossier]', 'liste un dossier'],
        ['cd <dossier>', 'change de dossier (cd .. pour remonter)'],
        ['pwd', 'dossier courant'],
        ['cat <fichier>', 'affiche un fichier'],
        ['open <nom>', 'ouvre une page ou une fiche (ex. open glpi)'],
        ['history', 'commandes tapées'],
        ['clear', 'efface l’écran'],
        ['exit', 'ferme le terminal (ou Échap)'],
      ]) print(`  ${name.padEnd(15)} ${text}`);
    },
    whoami() {
      print(`${data.nom.toLowerCase()} : ${data.accueil.alternance}.`);
    },
    ls(args) {
      const target = args.find((a) => !a.startsWith('-'));
      const node = nodeAt(fs, resolve(cwd, target));
      if (!node) return print(`ls: ${target} : aucun fichier ou dossier de ce nom`, 'err');
      if (node.type === 'file') return print(target);
      print(Object.entries(node.children).map(([name, child]) => (child.type === 'dir' ? `${name}/` : name)).join('  ') || '(vide)');
    },
    cd(args) {
      const path = resolve(cwd, args[0] ?? HOME);
      const node = nodeAt(fs, path);
      if (!node) return print(`cd: ${args[0]} : aucun fichier ou dossier de ce nom`, 'err');
      if (node.type !== 'dir') return print(`cd: ${args[0]} : n'est pas un dossier`, 'err');
      cwd = path;
    },
    pwd() {
      print(cwd);
    },
    cat(args) {
      if (!args.length) return print('cat: opérande manquant. exemple : cat a-propos.txt', 'err');
      for (const arg of args) {
        const node = nodeAt(fs, resolve(cwd, arg));
        if (!node) print(`cat: ${arg} : aucun fichier ou dossier de ce nom`, 'err');
        else if (node.type === 'dir') print(`cat: ${arg} : est un dossier`, 'err');
        else print(node.content);
      }
    },
    open(args) {
      const name = (args[0] ?? '').replace(/\.(md|txt)$/, '');
      if (!name) return print('open: précisez une page ou une fiche. exemple : open projets', 'err');
      if (name === 'cv' && data.cv) return go(data.cv);
      if (name === 'github' || name === 'linkedin') return window.location.assign(data.contact[name]);
      if (Object.hasOwn(PAGES, name)) return go(PAGES[name]);
      const node = nodeAt(fs, resolve(cwd, args[0]));
      if (node?.route !== undefined) return go(node.route);
      const projet = data.projets.find((p) => p.slug === name);
      if (projet) return go(`projets/${projet.slug}/`);
      print(`open: « ${name} » introuvable. essayez : ${Object.keys(PAGES).join(', ')}, cv, ou une fiche (ls projets/*)`, 'err');
    },
    history() {
      history.forEach((line, i) => print(`${String(i + 1).padStart(4)}  ${line}`));
    },
    clear() {
      out.replaceChildren();
    },
    exit() {
      close();
    },
    sudo() {
      print('[sudo] mot de passe de visiteur : ********');
      print("visiteur n'appartient pas au fichier sudoers. cet incident sera signalé.", 'warn');
    },
    rm(args) {
      print(`rm: impossible de supprimer « ${args.at(-1) ?? ''} » : système de fichiers en lecture seule`, 'err');
    },
  };

  function run(line) {
    print(`${promptText()} ${line}`, 'echo');
    const [name, ...args] = line.trim().split(/\s+/);
    if (!name) return;
    history.push(line);
    const command = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : null;
    if (command) command(args);
    else print(`${name} : commande introuvable. tapez help.`, 'err');
  }

  function complete() {
    const words = input.value.split(/\s+/);
    const partial = words.at(-1);
    let candidates;
    if (words.length === 1) candidates = Object.keys(COMMANDS);
    else {
      const slash = partial.lastIndexOf('/');
      const base = partial.slice(0, slash + 1);
      const node = nodeAt(fs, resolve(cwd, base || '.'));
      candidates = node?.type === 'dir' ? Object.entries(node.children).map(([n, c]) => base + n + (c.type === 'dir' ? '/' : '')) : [];
      if (words[0] === 'open' && !base) candidates.push(...Object.keys(PAGES), 'cv', ...data.projets.map((p) => p.slug));
    }
    const matches = [...new Set(candidates.filter((c) => c.startsWith(partial)))];
    if (matches.length === 1) input.value = [...words.slice(0, -1), matches[0]].join(' ') + (matches[0].endsWith('/') ? '' : ' ');
    else if (matches.length > 1) print(matches.join('  '), 'dim');
  }

  function refresh() {
    prompt.textContent = promptText();
    out.scrollTop = out.scrollHeight;
  }

  panel.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const line = input.value;
    input.value = '';
    run(line);
    historyIndex = history.length;
    refresh();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      complete();
      refresh();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = history[historyIndex] ?? '';
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      COMMANDS.clear();
    }
  });

  panel.addEventListener('click', (event) => {
    if (event.target === panel) close();
    else if (!window.getSelection()?.toString()) input.focus();
  });

  function open() {
    previousFocus = document.activeElement;
    panel.hidden = false;
    document.body.classList.add('term-open');
    if (!out.childElementCount) {
      print('terminal simulé. tapez help pour la liste des commandes.', 'dim');
    }
    refresh();
    input.focus();
  }

  function close() {
    panel.hidden = true;
    document.body.classList.remove('term-open');
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  }

  return { open, close, isOpen: () => !panel.hidden };
}
