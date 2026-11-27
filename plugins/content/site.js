// =============================================================================
// Lecture et vérification de tout le contenu du site
// -----------------------------------------------------------------------------
// Rassemble en un objet la configuration (content/site.config.js), les fiches
// (content/realisations/*.md), la veille (content/pages/veille.md et
// content/veille/<id>/) : c'est ce que les gabarits de pages (pages.js) et le
// terminal caché reçoivent.
//
// Une erreur de contenu arrête le build avec un message en français qui
// indique le fichier et ce qu'il faut corriger. Le site en ligne reste intact.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { CONFIG_FILE, veilleFile, loadSiteConfig, checkDocuments, checkConfig, checkVeilleConfig, checkVeille } from './config.js';
import { checkRealisation } from './realisation.js';
import { renderMarkdown } from './markdown.js';
import { formatErrors } from './utils.js';

export class ContentError extends Error {}

function fail(file, errors) {
  if (errors.length) throw new ContentError(formatErrors(file, errors));
}

// `dev` : avec `npm run dev`, les brouillons sont visibles et les repères
// [À COMPLÉTER] surlignés ; au build, les brouillons sont absents.
export async function loadSite(root, { dev = false } = {}) {
  const config = await loadSiteConfig(root);
  fail(CONFIG_FILE, [...checkDocuments(config, root), ...checkConfig(config, root), ...checkVeilleConfig(config)]);

  const dir = path.join(root, 'content', 'realisations');
  const all = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const file = `content/realisations/${name}`;
      const { data } = matter(fs.readFileSync(path.join(root, file), 'utf8'));
      const errors = [];
      const meta = checkRealisation(data, file, config, root, errors);
      fail(file, errors);
      return meta;
    });
  const projets = all.filter((p) => dev || !p.brouillon).sort(byDomainThenDate);

  const veille = {
    ...readPage(root, 'content/pages/veille.md', dev),
    sujets: config.veille.sujets.map((sujet) => readSujet(root, sujet, dev)),
  };

  return { config, projets, veille, dev };
}

// Applicatif d'abord, puis infra ; à domaine égal, les plus récentes d'abord
// (pour une période début/fin, c'est la date de fin qui compte).
function byDomainThenDate(a, b) {
  if (a.domaine !== b.domaine) return a.domaine === 'applicatif' ? -1 : 1;
  const end = (p) => String(p.date).split('/').pop();
  return end(b).localeCompare(end(a)) || a.titre.localeCompare(b.titre, 'fr');
}

function readPage(root, file, dev) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return { data: {}, html: '' };
  const { data, content } = matter(fs.readFileSync(full, 'utf8'));
  return { data, html: renderMarkdown(content, { hidePlaceholders: !dev }).html };
}

// Un sujet de veille : pourquoi (sujet.md), mes synthèses (syntheses.md, une
// par titre de niveau 2 « JJ/MM/AAAA - titre »), actualités (actualites.json).
function readSujet(root, sujet, dev) {
  const base = `content/veille/${sujet.id}`;
  const pourquoi = readPage(root, `${base}/sujet.md`, dev);

  const synthesesFile = path.join(root, base, 'syntheses.md');
  const syntheses = fs.existsSync(synthesesFile) ? splitSyntheses(matter(fs.readFileSync(synthesesFile, 'utf8')).content, dev) : [];

  fail(veilleFile(sujet.id), checkVeille(root, sujet.id));
  const actuFile = path.join(root, veilleFile(sujet.id));
  const actualites = fs.existsSync(actuFile)
    ? JSON.parse(fs.readFileSync(actuFile, 'utf8')).actualites.slice().sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return { ...sujet, titre: pourquoi.data.titre ?? sujet.sujet, pourquoi: pourquoi.html, syntheses, actualites };
}

function splitSyntheses(markdown, dev) {
  const withoutComments = markdown.replace(/<!--[\s\S]*?-->/g, '');
  return withoutComments
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const [heading, ...rest] = block.split('\n');
      const match = /^(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(.+)$/.exec(heading.trim());
      const date = match ? `${match[3]}-${match[2]}-${match[1]}` : '';
      const titre = match ? match[4].trim() : heading.trim();
      return { date, titre, html: renderMarkdown(rest.join('\n'), { hidePlaceholders: !dev }).html };
    });
}
