// =============================================================================
// Commandes du terminal
// -----------------------------------------------------------------------------
// Tout est simulé dans le navigateur : aucune commande n'est réellement
// exécutée, rien n'est envoyé à un serveur. Chaque commande est une fonction
// qui reçoit ses arguments et un « contexte » `ctx` fourni par terminal.js :
//
//   ctx.fs            arborescence simulée (filesystem.js)
//   ctx.cwd           dossier courant (chemin absolu)
//   ctx.setCwd(path)  change de dossier
//   ctx.print(...)    affiche une ligne ; chaque morceau est un texte ou
//                     [texte, classeCss] pour le colorer
//   ctx.clear()       efface l'écran
//   ctx.close()       ferme le terminal
//   ctx.go(hash)      ferme le terminal et affiche un écran du site
//   ctx.reboot()      ferme le terminal et rejoue le démarrage
//   ctx.playMovie()   lance le générique façon Star Wars (easter egg)
//   ctx.history       commandes déjà tapées
// =============================================================================

import { site, realisations, neofetchValue } from '../content.js';
import { link } from '../router.js';
import { tr } from '../utils/lang.js';
import { LOGO } from '../tui/home.js';
import { SECTIONS, findSection } from '../tui/sections.js';
import { resolvePath, getNode } from './filesystem.js';

// Commandes affichées par `help`, avec leur syntaxe et leur description,
// dans la langue affichée
const help = () => [
  ['help', tr('affiche cette aide', 'shows this help')],
  ['whoami', tr('qui suis-je ?', 'who am I?')],
  ['neofetch', tr('informations système', 'system information')],
  [tr('ls [dossier]', 'ls [folder]'), tr("liste le contenu d'un dossier", 'lists the contents of a folder')],
  [tr('cd <dossier>', 'cd <folder>'), tr('change de dossier (cd .. pour remonter)', 'changes folder (cd .. to go up)')],
  ['pwd', tr('affiche le dossier courant', 'shows the current folder')],
  [tr('cat <fichier>', 'cat <file>'), tr('affiche un fichier (ex. cat realisations/perso/homelab.md)', 'shows a file (e.g. cat realisations/perso/homelab.md)')],
  [tr('open <nom>', 'open <name>'), tr('ouvre une fiche ou une rubrique (ex. open homelab)', 'opens a project or a section (e.g. open homelab)')],
  ['jury', tr('ouvre la vue rapide jury', 'opens the quick jury view')],
  ['history', tr('commandes déjà tapées', 'commands already typed')],
  ['clear', tr("efface l'écran (ou Ctrl+L)", 'clears the screen (or Ctrl+L)')],
  ['reboot', tr('redémarre RémiOS', 'reboots RémiOS')],
  ['exit', tr('ferme le terminal (ou Échap)', 'closes the terminal (or Esc)')],
];

// « … : aucun fichier ou dossier de ce nom », façon bash
const noSuchFile = (command, name) => tr(`${command}: ${name} : aucun fichier ou dossier de ce nom`, `${command}: ${name}: No such file or directory`);

export const COMMANDS = {
  help(args, ctx) {
    ctx.print([tr('Commandes disponibles (tout est simulé, rien n\'est exécuté) :', 'Available commands (everything is simulated, nothing is executed):'), 'term-dim']);
    for (const [usage, description] of help()) {
      ctx.print(['  ' + usage.padEnd(16), 'term-key'], description);
    }
    ctx.print([tr('Tab complète les commandes et les chemins, ↑ ↓ parcourent l\'historique.', 'Tab completes commands and paths, ↑ ↓ browse the history.'), 'term-dim']);
    ctx.print([tr('Quelques commandes cachées attendent aussi les curieux… Que la force soit avec vous.', 'A few hidden commands await the curious… May the force be with you.'), 'term-dim']);
  },

  whoami(args, ctx) {
    const [formation, poste, alternance] = ['Formation', 'Poste', 'Alternance'].map(neofetchValue);
    ctx.print(site.identite.utilisateur);
    ctx.print([
      tr(`${site.identite.nom} : ${formation}, ${poste.toLowerCase()} chez ${alternance}.`, `${site.identite.nom}: ${formation}, ${poste} at ${alternance}.`),
      'term-dim',
    ]);
  },

  neofetch(args, ctx) {
    const { utilisateur, machine } = site.identite;
    const title = `${utilisateur}@${machine}`;
    const right = [
      [[title, 'term-key']],
      ['-'.repeat(title.length)],
      [['OS', 'term-key'], ': RémiOS 1.0 x86_64'],
      [[tr('Noyau', 'Kernel'), 'term-key'], ': 6.8.0-remios'],
      [['Shell', 'term-key'], tr(': bash (simulé)', ': bash (simulated)')],
      ...site.neofetch.map(([key, value]) => [[key, 'term-key'], `: ${value}`]),
    ];
    const left = LOGO.split('\n');
    const width = Math.max(...left.map((line) => line.length)) + 3;
    const rows = Math.max(left.length, right.length);
    for (let i = 0; i < rows; i++) {
      ctx.print([(left[i] ?? '').padEnd(width), 'term-logo'], ...(right[i] ?? []));
    }
  },

  ls(args, ctx) {
    const target = args.find((arg) => !arg.startsWith('-')); // options (-la…) ignorées
    const path = resolvePath(ctx.cwd, target ?? '.');
    const node = getNode(ctx.fs, path);
    if (!node) return ctx.print([tr(`ls: impossible d'accéder à '${target}' : aucun fichier ou dossier de ce nom`, `ls: cannot access '${target}': No such file or directory`), 'term-err']);
    if (node.type === 'file') return ctx.print(target);

    const names = Object.keys(node.children).sort((a, b) => a.localeCompare(b, 'fr'));
    if (names.length === 0) return ctx.print([tr('(dossier vide : à venir)', '(empty folder: coming soon)'), 'term-dim']);
    const parts = names.flatMap((name) =>
      node.children[name].type === 'dir' ? [[`${name}/`, 'term-dir'], '  '] : [name, '  '],
    );
    ctx.print(...parts);
  },

  cd(args, ctx) {
    const path = resolvePath(ctx.cwd, args[0] ?? '~');
    const node = getNode(ctx.fs, path);
    if (!node) return ctx.print([noSuchFile('cd', args[0]), 'term-err']);
    if (node.type !== 'dir') return ctx.print([tr(`cd: ${args[0]} : n'est pas un dossier`, `cd: ${args[0]}: Not a directory`), 'term-err']);
    ctx.setCwd(path);
  },

  pwd(args, ctx) {
    ctx.print(ctx.cwd);
  },

  cat(args, ctx) {
    if (args.length === 0) return ctx.print([tr('cat: opérande manquant. Exemple : cat presentation.md', 'cat: missing operand. Example: cat presentation.md'), 'term-err']);
    for (const arg of args) {
      const node = getNode(ctx.fs, resolvePath(ctx.cwd, arg));
      if (!node) ctx.print([noSuchFile('cat', arg), 'term-err']);
      else if (node.type === 'dir') ctx.print([tr(`cat: ${arg} : est un dossier`, `cat: ${arg}: Is a directory`), 'term-err']);
      else ctx.print(node.content.trimEnd());
    }
  },

  open(args, ctx) {
    const name = args[0];
    if (!name) return ctx.print([tr('open: précisez une fiche ou une rubrique. Exemple : open homelab', 'open: name a project or a section. Example: open homelab'), 'term-err']);
    const route = findRoute(name, ctx);
    if (!route) {
      ctx.print([tr(`open: « ${name} » introuvable.`, `open: “${name}” not found.`), 'term-err']);
      return ctx.print([tr('Essayez : ', 'Try: ') + openTargets().join(', '), 'term-dim']);
    }
    ctx.go(route);
  },

  jury(args, ctx) {
    ctx.go(link.jury());
  },

  history(args, ctx) {
    ctx.history.forEach((line, i) => ctx.print([String(i + 1).padStart(4) + '  ', 'term-dim'], line));
  },

  clear(args, ctx) {
    ctx.clear();
  },

  reboot(args, ctx) {
    ctx.reboot();
  },

  exit(args, ctx) {
    ctx.close();
  },

  // --- Commandes cachées (absentes de help) ---------------------------------------

  // Générique façon Star Wars, 30 secondes (voir movie.js)
  starwars(args, ctx) {
    ctx.playMovie();
  },

  // Clin d'œil au célèbre Star Wars en ASCII, accessible par `telnet towel.blinkenlights.nl`
  telnet(args, ctx) {
    if (args[0] === 'towel.blinkenlights.nl') return ctx.playMovie();
    ctx.print([
      tr(
        `telnet: impossible de joindre ${args[0] ?? 'l\'hôte'} : ce terminal est simulé, il n'a pas accès au réseau.`,
        `telnet: could not reach ${args[0] ?? 'the host'}: this terminal is simulated and has no network access.`,
      ),
      'term-err',
    ]);
  },

  sudo(args, ctx) {
    const user = site.identite.utilisateur;
    ctx.print(tr(`[sudo] Mot de passe de ${user} : ********`, `[sudo] password for ${user}: ********`));
    ctx.print([tr(`${user} n'appartient pas au fichier sudoers. Cet incident sera signalé… au jury.`, `${user} is not in the sudoers file. This incident will be reported… to the jury.`), 'term-warn']);
  },

  rm(args, ctx) {
    const recursive = args.some((arg) => /^-[a-z]*r/i.test(arg));
    const root = args.some((arg) => arg === '/' || arg === '/*');
    if (recursive && root) {
      ctx.print(tr('rm: suppression récursive de « / »…', "rm: recursively removing '/'…"));
      ctx.print('[', ['  OK  ', 'term-ok'], '] Stopped portfolio.service.');
      ctx.print('[', [' WARN ', 'term-warn'], tr('] Un membre du jury regarde peut-être.', '] A jury member may be watching.'));
      ctx.print([tr('Bien essayé : ce portfolio est en lecture seule, aucun fichier n\'a été supprimé (ni ne pouvait l\'être).', 'Nice try: this portfolio is read-only, no file was deleted (nor could it be).'), 'term-dim']);
      return;
    }
    ctx.print([tr(`rm: impossible de supprimer « ${args.at(-1) ?? ''} » : système de fichiers en lecture seule`, `rm: cannot remove '${args.at(-1) ?? ''}': Read-only file system`), 'term-err']);
  },
};

// --- Aides pour « open » ---------------------------------------------------------

// Ce que `open` accepte : un chemin (homelab.md, realisations/perso), le slug d'une
// fiche (homelab) ou l'identifiant d'une rubrique (veille, contact, mentions-legales…).
function findRoute(name, ctx) {
  const node = getNode(ctx.fs, resolvePath(ctx.cwd, name));
  if (node?.route) return node.route;
  const slug = name.replace(/\.(md|txt)$/, '');
  if (realisations.some((r) => r.slug === slug)) return link.fiche(slug);
  if (findSection(slug)) return link.section(slug);
  if (slug === 'jury') return link.jury();
  return null;
}

function openTargets() {
  return [...realisations.map((r) => r.slug), ...SECTIONS.map((s) => s.id), 'mentions-legales'];
}

// --- Autocomplétion (touche Tab) ----------------------------------------------------

// Renvoie la nouvelle valeur du champ et, s'il y a plusieurs possibilités,
// la liste à afficher sous la ligne.
export function complete(input, ctx) {
  const words = input.split(/\s+/);
  const partial = words.at(-1);
  const isCommand = words.length === 1;

  let candidates;
  if (isCommand) {
    candidates = help().map(([usage]) => usage.split(' ')[0]);
  } else if (words[0] === 'open' && !partial.includes('/')) {
    candidates = [...openTargets(), ...pathCandidates(partial, ctx, false)];
  } else {
    candidates = pathCandidates(partial, ctx, words[0] === 'cd');
  }

  const matches = [...new Set(candidates.filter((c) => c.startsWith(partial)))].sort();
  if (matches.length === 0) return { value: input, suggestions: [] };

  const prefix = commonPrefix(matches);
  let value = words.slice(0, -1).concat(prefix).join(' ');
  // Une seule possibilité : on la complète entièrement (espace après un nom,
  // rien après un dossier pour pouvoir continuer le chemin)
  if (matches.length === 1 && !prefix.endsWith('/')) value += ' ';
  return { value, suggestions: matches.length > 1 && prefix === partial ? matches : [] };
}

// Noms de fichiers et dossiers qui peuvent compléter le chemin commencé
function pathCandidates(partial, ctx, dirsOnly) {
  const slash = partial.lastIndexOf('/');
  const base = partial.slice(0, slash + 1); // partie déjà tapée jusqu'au dernier /
  const node = getNode(ctx.fs, resolvePath(ctx.cwd, base || '.'));
  if (!node || node.type !== 'dir') return [];
  return Object.entries(node.children)
    .filter(([, child]) => !dirsOnly || child.type === 'dir')
    .map(([name, child]) => base + name + (child.type === 'dir' ? '/' : ''));
}

function commonPrefix(words) {
  let prefix = words[0];
  for (const word of words) {
    while (!word.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

