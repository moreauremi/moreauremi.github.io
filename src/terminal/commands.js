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

import { site, realisations } from '../content.js';
import { link } from '../router.js';
import { LOGO } from '../tui/home.js';
import { SECTIONS, findSection } from '../tui/sections.js';
import { resolvePath, getNode } from './filesystem.js';

// Commandes affichées par `help`, avec leur syntaxe et leur description
const HELP = [
  ['help', 'affiche cette aide'],
  ['whoami', 'qui suis-je ?'],
  ['neofetch', 'informations système'],
  ['ls [dossier]', "liste le contenu d'un dossier"],
  ['cd <dossier>', 'change de dossier (cd .. pour remonter)'],
  ['pwd', 'affiche le dossier courant'],
  ['cat <fichier>', 'affiche un fichier (ex. cat realisations/perso/nas.md)'],
  ['open <nom>', 'ouvre une fiche ou une rubrique (ex. open nas)'],
  ['jury', 'ouvre la vue rapide jury'],
  ['history', 'commandes déjà tapées'],
  ['clear', "efface l'écran (ou Ctrl+L)"],
  ['reboot', 'redémarre RémiOS'],
  ['exit', 'ferme le terminal (ou Échap)'],
];

export const COMMANDS = {
  help(args, ctx) {
    ctx.print(['Commandes disponibles (tout est simulé, rien n\'est exécuté) :', 'term-dim']);
    for (const [usage, description] of HELP) {
      ctx.print(['  ' + usage.padEnd(16), 'term-key'], description);
    }
    ctx.print(['Tab complète les commandes et les chemins, ↑ ↓ parcourent l\'historique.', 'term-dim']);
    ctx.print(['Quelques commandes cachées attendent aussi les curieux… Que la force soit avec vous.', 'term-dim']);
  },

  whoami(args, ctx) {
    const facts = Object.fromEntries(site.neofetch);
    ctx.print(site.identite.utilisateur);
    ctx.print([`${site.identite.nom} : ${facts.Formation}, ${facts.Poste.toLowerCase()} chez ${facts.Alternance}.`, 'term-dim']);
  },

  neofetch(args, ctx) {
    const { utilisateur, machine } = site.identite;
    const title = `${utilisateur}@${machine}`;
    const right = [
      [[title, 'term-key']],
      ['-'.repeat(title.length)],
      [['OS', 'term-key'], ': RémiOS 1.0 x86_64'],
      [['Noyau', 'term-key'], ': 6.8.0-remios'],
      [['Shell', 'term-key'], ': bash (simulé)'],
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
    if (!node) return ctx.print([`ls: impossible d'accéder à '${target}' : aucun fichier ou dossier de ce nom`, 'term-err']);
    if (node.type === 'file') return ctx.print(target);

    const names = Object.keys(node.children).sort((a, b) => a.localeCompare(b, 'fr'));
    if (names.length === 0) return ctx.print(['(dossier vide : à venir)', 'term-dim']);
    const parts = names.flatMap((name) =>
      node.children[name].type === 'dir' ? [[`${name}/`, 'term-dir'], '  '] : [name, '  '],
    );
    ctx.print(...parts);
  },

  cd(args, ctx) {
    const path = resolvePath(ctx.cwd, args[0] ?? '~');
    const node = getNode(ctx.fs, path);
    if (!node) return ctx.print([`cd: ${args[0]} : aucun fichier ou dossier de ce nom`, 'term-err']);
    if (node.type !== 'dir') return ctx.print([`cd: ${args[0]} : n'est pas un dossier`, 'term-err']);
    ctx.setCwd(path);
  },

  pwd(args, ctx) {
    ctx.print(ctx.cwd);
  },

  cat(args, ctx) {
    if (args.length === 0) return ctx.print(['cat: opérande manquant. Exemple : cat presentation.md', 'term-err']);
    for (const arg of args) {
      const node = getNode(ctx.fs, resolvePath(ctx.cwd, arg));
      if (!node) ctx.print([`cat: ${arg} : aucun fichier ou dossier de ce nom`, 'term-err']);
      else if (node.type === 'dir') ctx.print([`cat: ${arg} : est un dossier`, 'term-err']);
      else ctx.print(node.content.trimEnd());
    }
  },

  open(args, ctx) {
    const name = args[0];
    if (!name) return ctx.print(['open: précisez une fiche ou une rubrique. Exemple : open nas', 'term-err']);
    const route = findRoute(name, ctx);
    if (!route) {
      ctx.print([`open: « ${name} » introuvable.`, 'term-err']);
      return ctx.print(['Essayez : ' + openTargets().join(', '), 'term-dim']);
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
    ctx.print([`telnet: impossible de joindre ${args[0] ?? 'l\'hôte'} : ce terminal est simulé, il n'a pas accès au réseau.`, 'term-err']);
  },

  sudo(args, ctx) {
    ctx.print(`[sudo] Mot de passe de ${site.identite.utilisateur} : ********`);
    ctx.print([`${site.identite.utilisateur} n'appartient pas au fichier sudoers. Cet incident sera signalé… au jury.`, 'term-warn']);
  },

  rm(args, ctx) {
    const recursive = args.some((arg) => /^-[a-z]*r/i.test(arg));
    const root = args.some((arg) => arg === '/' || arg === '/*');
    if (recursive && root) {
      ctx.print("rm: suppression récursive de « / »…");
      ctx.print('[', ['  OK  ', 'term-ok'], '] Stopped portfolio.service.');
      ctx.print('[', [' WARN ', 'term-warn'], '] Un membre du jury regarde peut-être.');
      ctx.print(['Bien essayé : ce portfolio est en lecture seule, aucun fichier n\'a été supprimé (ni ne pouvait l\'être).', 'term-dim']);
      return;
    }
    ctx.print([`rm: impossible de supprimer « ${args.at(-1) ?? ''} » : système de fichiers en lecture seule`, 'term-err']);
  },
};

// --- Aides pour « open » ---------------------------------------------------------

// Ce que `open` accepte : un chemin (nas.md, realisations/perso), le slug d'une
// fiche (nas) ou l'identifiant d'une rubrique (veille, contact, mentions-legales…).
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
    candidates = HELP.map(([usage]) => usage.split(' ')[0]);
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

