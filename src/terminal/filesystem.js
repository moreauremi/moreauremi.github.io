// =============================================================================
// Système de fichiers simulé du terminal
// -----------------------------------------------------------------------------
// Une arborescence construite en mémoire à partir du contenu du site. Rien
// n'existe sur disque : `ls`, `cd` et `cat` ne font que parcourir cet objet.
//
//   /home/remi                  (~, dossier de départ)
//   ├── presentation.md
//   ├── veille.md
//   ├── contact.txt
//   └── realisations/
//       ├── entreprise/   1life-realisation-1.md …
//       ├── formation/
//       └── perso/        caffein.md, nas.md …
//   /etc/os-release
//
// Chaque élément peut porter une `route` : l'écran que `open` affiche.
// =============================================================================

import { site, pages, realisations, TYPES } from '../content.js';
import { link } from '../router.js';

export const HOME = `/home/${site.identite.utilisateur}`;

const dir = (children = {}, extra = {}) => ({ type: 'dir', children, ...extra });
const file = (content, extra = {}) => ({ type: 'file', content, ...extra });

export function buildFilesystem() {
  // Un sous-dossier par type de réalisation, une fiche = un fichier .md
  const realisationsDir = dir();
  for (const type of Object.keys(TYPES)) {
    realisationsDir.children[type] = dir({}, { route: link.section(TYPES[type].section) });
  }
  for (const r of realisations) {
    realisationsDir.children[r.type].children[`${r.slug}.md`] = file(r.raw, {
      route: link.fiche(r.slug),
      slug: r.slug,
    });
  }

  const home = dir({
    'presentation.md': file(pages.presentation.raw, { route: link.section('presentation') }),
    'veille.md': file(pages.veille.raw, { route: link.section('veille') }),
    'contact.txt': file(contactText(), { route: link.section('contact') }),
    realisations: realisationsDir,
  });

  return dir({
    home: dir({ [site.identite.utilisateur]: home }),
    etc: dir({ 'os-release': file(osRelease()) }),
  });
}

// Transforme un chemin tapé (relatif, absolu, avec ~ ou ..) en chemin absolu
export function resolvePath(cwd, input = '') {
  let path = input;
  if (path === '' || path === '~') return HOME;
  if (path.startsWith('~/')) path = HOME + path.slice(1);
  else if (!path.startsWith('/')) path = `${cwd}/${path}`;

  const parts = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return `/${parts.join('/')}`;
}

// Élément situé à un chemin absolu, ou null s'il n'existe pas
export function getNode(root, absolutePath) {
  let node = root;
  for (const part of absolutePath.split('/').filter(Boolean)) {
    if (node.type !== 'dir' || !node.children[part]) return null;
    node = node.children[part];
  }
  return node;
}

// /home/remi/realisations → ~/realisations (affichage dans l'invite)
export function displayPath(absolutePath) {
  return absolutePath.startsWith(HOME) ? `~${absolutePath.slice(HOME.length)}` : absolutePath;
}

function contactText() {
  const { email, github, linkedin } = site.contact;
  return [
    site.identite.nom,
    `E-mail   : ${email}`,
    `GitHub   : ${github}`,
    `LinkedIn : ${linkedin}`,
    `CV       : ${site.documents.cv || '[À COMPLÉTER : CV en PDF]'}`,
  ].join('\n');
}

function osRelease() {
  return [
    'NAME="RémiOS"',
    'VERSION="1.0"',
    'ID=remios',
    'PRETTY_NAME="RémiOS 1.0 (portfolio BTS SIO SISR)"',
    `HOME_URL="${site.urlPublique}"`,
  ].join('\n');
}
