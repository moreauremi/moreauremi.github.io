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
//   ├── veille/
//   │   ├── cybersecurite/   sujet.md, syntheses.md
//   │   └── …                (un dossier par sujet de veille)
//   ├── formations.txt
//   ├── certifications.txt
//   ├── contact.txt
//   ├── mentions-legales.txt
//   └── realisations/
//       ├── entreprise/   environnement-open-prod.md …
//       ├── formation/
//       └── perso/        homelab.md, rmutils.md …
//   /etc/os-release
//
// Chaque élément peut porter une `route` : l'écran que `open` affiche.
//
// Les noms des fichiers restent les mêmes dans les deux langues (ce sont
// ceux des adresses) ; leur contenu suit la langue du site : terminal.js
// reconstruit l'arborescence quand elle change.
// =============================================================================

import { site, realisations, getRealisation, veilles, TYPES } from '../content.js';
import { link } from '../router.js';
import { formatDate } from '../utils/dates.js';
import { levelBarText, levelName } from '../utils/levels.js';
import { currentLang, tr } from '../utils/lang.js';

export const HOME = `/home/${site.identite.utilisateur}`;

const dir = (children = {}, extra = {}) => ({ type: 'dir', children, ...extra });
const file = (content, extra = {}) => ({ type: 'file', content, ...extra });

// Textes sources des fiches et des pages (Markdown sans les commentaires),
// affichés par `cat`. Ils ne sont téléchargés qu'avec le terminal (voir
// plugins/vite-plugin-content.js, modules « ?source »). Les traductions
// anglaises forment un fichier à part (sources-en.js), téléchargé seulement
// sur le site en anglais.
const FRENCH_SOURCES = import.meta.glob(['../../content/**/*.md', '!../../content/**/*.en.md'], {
  query: '?source',
  import: 'default',
  eager: true,
});
let englishSources = null;

// À appeler avant buildFilesystem() : télécharge les textes anglais si besoin
export async function loadSources(lang) {
  if (lang === 'en' && !englishSources) englishSources = (await import('./sources-en.js')).default;
}

// Texte source d'un fichier de content/ (« realisations/homelab ») : la
// traduction sur le site en anglais si elle existe, sinon le français
function source(file) {
  const english = currentLang() === 'en' ? englishSources?.[`../../content/${file}.en.md`] : null;
  return english ?? FRENCH_SOURCES[`../../content/${file}.md`];
}
const ficheSource = (slug) => source(`realisations/${slug}`);
const pageSource = (name) => source(`pages/${name}`);
const veilleSource = (id, name) => source(`veille/${id}/${name}`);

export function buildFilesystem() {
  // Un sous-dossier par type de réalisation, une fiche = un fichier .md
  const realisationsDir = dir({}, { route: link.section('realisations') });
  for (const type of Object.keys(TYPES)) {
    realisationsDir.children[type] = dir({}, { route: link.section('realisations') });
  }
  for (const r of realisations) {
    realisationsDir.children[r.type].children[`${r.slug}.md`] = file(ficheSource(r.slug), {
      route: link.fiche(r.slug),
      slug: r.slug,
    });
  }

  // Un dossier par sujet de veille : pourquoi ce sujet, mes synthèses
  const veilleDir = dir({}, { route: link.section('veille') });
  for (const v of veilles) {
    veilleDir.children[v.id] = dir(
      {
        'sujet.md': file(veilleSource(v.id, 'sujet'), { route: link.veille(v.id) }),
        'syntheses.md': file(veilleSource(v.id, 'syntheses'), { route: link.veille(v.id) }),
      },
      { route: link.veille(v.id) },
    );
  }

  const home = dir({
    'presentation.md': file(pageSource('presentation'), { route: link.section('presentation') }),
    'alternance.md': file(pageSource('alternance'), { route: link.section('alternance') }),
    'competences.txt': file(competencesText(), { route: link.section('competences') }),
    'veille.md': file(pageSource('veille'), { route: link.section('veille') }),
    veille: veilleDir,
    'formations.txt': file(formationsText(), { route: link.section('formations') }),
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
  // Libellés alignés, comme dans un fichier texte : « Statut   : … »
  const line = (fr, en, value) => `${tr(`${fr.padEnd(8)} :`, `${en.padEnd(8)}:`)} ${value}`;
  return [
    site.identite.nom,
    disponibilite ? line('Statut', 'Status', disponibilite) : '',
    localisation ? line('Lieu', 'Location', localisation) : '',
    line('E-mail', 'E-mail', email),
    line('GitHub', 'GitHub', github),
    line('LinkedIn', 'LinkedIn', linkedin),
    // CV absent : repère avec `npm run dev`, ligne retirée du site publié
    site.documents.cv || import.meta.env.DEV ? line('CV', 'CV', site.documents.cv || '[À COMPLÉTER : CV en PDF]') : '',
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
        ? `${levelBarText(item.niveau, niveaux.length)} ${levelName(item.niveau, niveaux)}`
        : import.meta.env.DEV ? '[À COMPLÉTER]' : '—';
      const fiches = (item.preuves ?? []).filter(getRealisation);
      lines.push(`${item.nom.padEnd(width)}  ${level}${fiches.length ? `  → ${fiches.join(', ')}` : ''}`);
    }
  }
  lines.push('', tr('Niveaux :', 'Levels:'), ...niveaux.map((n, i) => `  ${i + 1}. ${n.nom}${tr(' :', ':')} ${n.description}`));
  return lines.join('\n').trimStart();
}

// Une entrée par ligne, les plus récentes d'abord ; la description en retrait
function entriesText(entries, empty) {
  if (entries.length === 0) return empty;
  return [...entries]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map((c) => [
      `${c.titre} (${c.organisme}) — ${formatDate(String(c.date))}${c.statut === 'en cours' ? tr(', en cours', ', in progress') : ''}`,
      ...(c.description ? [`  ${c.description}`] : []),
    ].join('\n'))
    .join('\n');
}

function formationsText() {
  const formations = (site.certifications ?? []).filter((c) => c.categorie === 'formation');
  return entriesText(formations, tr('Aucune formation pour le moment : à venir.', 'No training yet: coming soon.'));
}

function certificationsText() {
  const certifications = (site.certifications ?? []).filter((c) => c.categorie !== 'formation');
  return entriesText(certifications, tr('Aucune certification pour le moment : à venir.', 'No certification yet: coming soon.'));
}

function mentionsText() {
  const { hebergeur } = site.mentionsLegales;
  const audience = Boolean(site.audience?.goatcounter);
  return tr(
    [
      `Éditeur      : ${site.identite.nom} (site personnel, non professionnel)`,
      `Contact      : ${site.contact.email}`,
      `Hébergeur    : ${hebergeur.nom}`,
      `               ${hebergeur.adresse}`,
      `Cookies      : aucun.${audience ? ' Audience mesurée sans cookie (GoatCounter).' : " Aucune mesure d'audience."}`,
      '',
      'Version complète : open mentions-legales',
    ],
    [
      `Publisher    : ${site.identite.nom} (personal, non-professional website)`,
      `Contact      : ${site.contact.email}`,
      `Host         : ${hebergeur.nom}`,
      `               ${hebergeur.adresse}`,
      `Cookies      : none.${audience ? ' Cookie-free audience measurement (GoatCounter).' : ' No audience measurement.'}`,
      '',
      'Full version : open mentions-legales',
    ],
  ).join('\n');
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
