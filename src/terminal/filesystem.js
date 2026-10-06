// =============================================================================
// Système de fichiers simulé du terminal
// -----------------------------------------------------------------------------
// Une arborescence construite en mémoire à partir du contenu du site. Rien
// n'existe sur disque : `ls`, `cd` et `cat` ne font que parcourir cet objet.
//
//   /home/remi                  (~, dossier de départ)
//   ├── presentation.md
//   ├── alternance.md
//   ├── competences.txt
//   ├── veille.md
//   ├── certifications.txt
//   ├── contact.txt
//   ├── mentions-legales.txt
//   └── realisations/
//       ├── entreprise/   1life-realisation-1.md …
//       ├── formation/
//       └── perso/        caffein.md, nas.md …
//   /etc/os-release
//
// Chaque élément peut porter une `route` : l'écran que `open` affiche.
// =============================================================================

import { site, pages, realisations, getRealisation, TYPES } from '../content.js';
import { link } from '../router.js';
import { formatDate } from '../utils/dates.js';

export const HOME = `/home/${site.identite.utilisateur}`;

const dir = (children = {}, extra = {}) => ({ type: 'dir', children, ...extra });
const file = (content, extra = {}) => ({ type: 'file', content, ...extra });

export function buildFilesystem() {
  // Un sous-dossier par type de réalisation, une fiche = un fichier .md
  const realisationsDir = dir({}, { route: link.section('realisations') });
  for (const type of Object.keys(TYPES)) {
    realisationsDir.children[type] = dir({}, { route: link.section('realisations') });
  }
  for (const r of realisations) {
    realisationsDir.children[r.type].children[`${r.slug}.md`] = file(r.raw, {
      route: link.fiche(r.slug),
      slug: r.slug,
    });
  }

  const home = dir({
    'presentation.md': file(pages.presentation.raw, { route: link.section('presentation') }),
    'alternance.md': file(pages.alternance.raw, { route: link.section('alternance') }),
    'competences.txt': file(competencesText(), { route: link.section('competences') }),
    'veille.md': file(pages.veille.raw, { route: link.section('veille') }),
    'certifications.txt': file(certificationsText(), { route: link.section('certifications') }),
    'contact.txt': file(contactText(), { route: link.section('contact') }),
    'mentions-legales.txt': file(mentionsText(), { route: link.legal() }),
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
  const { email, github, linkedin, localisation, disponibilite } = site.contact;
  return [
    site.identite.nom,
    disponibilite ? `Statut   : ${disponibilite}` : '',
    localisation ? `Lieu     : ${localisation}` : '',
    `E-mail   : ${email}`,
    `GitHub   : ${github}`,
    `LinkedIn : ${linkedin}`,
    `CV       : ${site.documents.cv || '[À COMPLÉTER : CV en PDF]'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

// Savoir-faire, façon sortie de commande : « Linux        [####----] Guidé »
function competencesText() {
  const { niveaux, domaines } = site.savoirFaire;
  const width = Math.max(...domaines.flatMap((d) => d.items.map((item) => item.nom.length)));
  const lines = [];
  for (const domaine of domaines) {
    lines.push('', `# ${domaine.nom}`);
    for (const item of domaine.items) {
      const level = item.niveau
        ? `[${'##'.repeat(item.niveau)}${'--'.repeat(niveaux.length - item.niveau)}] ${niveaux[item.niveau - 1].nom}`
        : '[À COMPLÉTER]';
      const fiches = (item.preuves ?? []).filter(getRealisation);
      lines.push(`${item.nom.padEnd(width)}  ${level}${fiches.length ? `  → ${fiches.join(', ')}` : ''}`);
    }
  }
  lines.push('', 'Niveaux :', ...niveaux.map((n, i) => `  ${i + 1}. ${n.nom} : ${n.description}`));
  return lines.join('\n').trimStart();
}

function certificationsText() {
  const certifications = site.certifications ?? [];
  if (certifications.length === 0) return 'Aucune certification pour le moment : à venir.';
  return certifications
    .map((c) => `${c.titre} (${c.organisme}) — ${formatDate(String(c.date))}${c.statut === 'en cours' ? ', en cours' : ''}`)
    .join('\n');
}

function mentionsText() {
  const { hebergeur } = site.mentionsLegales;
  return [
    `Éditeur      : ${site.identite.nom} (site personnel, non professionnel)`,
    `Contact      : ${site.contact.email}`,
    `Hébergeur    : ${hebergeur.nom}`,
    `               ${hebergeur.adresse}`,
    'Cookies      : aucun. Aucune mesure d\'audience.',
    '',
    'Version complète : open mentions-legales',
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
