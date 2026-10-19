// =============================================================================
// Tests des pages lisibles sans JavaScript : `npm test` (après `npm run build`)
// -----------------------------------------------------------------------------
// Vérifie ce que lit un robot qui n'exécute pas JavaScript (IA, moteurs) :
// une page par rubrique, fiche publiée et sujet de veille, listée dans le plan
// du site et dans llms.txt, sans brouillon ni repère [À COMPLÉTER], et dont
// les liens et images mènent à des fichiers qui existent. Aucun test ne
// dépend du texte exact du contenu.
// =============================================================================

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import matter from 'gray-matter';
import { DIST } from './browser.js';
import site from '../content/site.config.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(DIST, file), 'utf8');
const PLACEHOLDER = 'À COMPLÉTER';

// Fiches du dépôt : publiées et brouillons
const fiches = fs
  .readdirSync(path.join(ROOT, 'content', 'realisations'))
  .filter((name) => name.endsWith('.md'))
  .map((name) => matter(fs.readFileSync(path.join(ROOT, 'content', 'realisations', name), 'utf8')).data);
const publiees = fiches.filter((f) => !f.brouillon);
const brouillons = fiches.filter((f) => f.brouillon);

const PAGES = [
  'presentation/',
  'alternance/',
  'realisations/',
  'veille/',
  ...publiees.map((f) => `realisations/${f.slug}/`),
  ...site.veille.sujets.map((s) => `veille/${s.id}/`),
];

test('chaque rubrique, fiche publiée et sujet de veille a sa page, avec du vrai texte', () => {
  for (const page of PAGES) {
    const html = read(`${page}index.html`);
    const h1 = /<h1>([^<]+)<\/h1>/.exec(html)?.[1];
    assert.ok(h1, `${page} : titre absent`);
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    assert.ok(text.length > 400, `${page} : presque pas de texte`);
    assert.ok(!html.includes('<script'), `${page} : la page ne doit pas dépendre de JavaScript`);
    assert.ok(!html.includes('[agrandir]'), `${page} : barre décorative des captures lue comme du texte`);
    assert.match(html, /<meta name="description" content="[^"]{20,}">/, `${page} : description absente`);
    assert.match(html, /http-equiv="Content-Security-Policy"/, `${page} : CSP absente`);
  }
});

test('chaque page a sa propre description, faite de texte et pas de titres', () => {
  const description = (file) => /<meta name="description" content="([^"]*)"/.exec(read(file))?.[1];
  const all = ['index.html', ...PAGES.map((p) => `${p}index.html`)].map((file) => [file, description(file)]);
  const seen = new Map();
  for (const [file, text] of all) {
    assert.ok(!seen.has(text), `${file} : même description que ${seen.get(text)}`);
    seen.set(text, file);
  }
  // Un titre de section en tête de description (« Pourquoi ce sujet Les PME… »)
  for (const page of PAGES) {
    const html = read(`${page}index.html`);
    const article = /<h1>[^<]*<\/h1>\s*(?:<dl[\s\S]*?<\/dl>)?\s*<h2>([^<]*)<\/h2>/.exec(html)?.[1];
    if (article) assert.ok(!description(`${page}index.html`).startsWith(article.trim()), `${page} : la description commence par le titre « ${article} »`);
  }
});

test('aucun brouillon ni repère à compléter dans les pages statiques et llms.txt', () => {
  const llms = read('llms.txt');
  assert.ok(!llms.includes(PLACEHOLDER));
  for (const f of brouillons) {
    assert.ok(!fs.existsSync(path.join(DIST, 'realisations', f.slug)), `brouillon publié : ${f.slug}`);
    assert.ok(!llms.includes(`realisations/${f.slug}/`), `brouillon dans llms.txt : ${f.slug}`);
  }
  for (const page of PAGES) assert.ok(!read(`${page}index.html`).includes(PLACEHOLDER), `${page} : repère [À COMPLÉTER] publié`);
});

test('plan du site et llms.txt listent toutes les pages', () => {
  const sitemap = read('sitemap.xml');
  const llms = read('llms.txt');
  assert.match(llms, /^# /);
  for (const page of PAGES) {
    assert.ok(sitemap.includes(`<loc>${site.urlPublique}${page}</loc>`), `sitemap.xml : ${page} absente`);
    if (page.startsWith('realisations/') && page !== 'realisations/') {
      assert.ok(llms.includes(`(${site.urlPublique}${page})`), `llms.txt : ${page} absente`);
    }
  }
});

test('dates du plan du site : celles des commits, jamais dans le futur, accueil le plus récent', () => {
  const sitemap = read('sitemap.xml');
  const urls = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
    loc: /<loc>([^<]+)<\/loc>/.exec(m[1])[1],
    lastmod: /<lastmod>([^<]+)<\/lastmod>/.exec(m[1])?.[1],
  }));
  // Avec tout l'historique git (publication), chaque page a sa date ; avec un
  // historique partiel, aucune (mieux vaut pas de date qu'une date fausse)
  let complet = false;
  try {
    complet = execFileSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: ROOT, encoding: 'utf8' }).trim() === 'false';
  } catch {
    // git absent : pas de date attendue
  }
  const home = urls.find((u) => u.loc === site.urlPublique);
  for (const { loc, lastmod } of urls) {
    if (!complet) {
      assert.equal(lastmod, undefined, `${loc} : date sans historique complet`);
      continue;
    }
    assert.match(lastmod ?? '', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/, `${loc} : date « ${lastmod} »`);
    assert.ok(new Date(lastmod) <= new Date(), `${loc} : date dans le futur`);
    // L'accueil montre tout le contenu : aucune page n'est plus récente
    assert.ok(new Date(lastmod) <= new Date(home.lastmod), `${loc} : plus récente que l'accueil`);
  }
});

test("chaque page a son aperçu de partage (LinkedIn…), à sa propre adresse", () => {
  for (const page of PAGES) {
    const html = read(`${page}index.html`);
    const og = (key) => new RegExp(`<meta property="og:${key}" content="([^"]*)">`).exec(html)?.[1];
    assert.equal(og('url'), `${site.urlPublique}${page}`, `${page} : adresse d'aperçu`);
    assert.ok(og('title') && og('description'), `${page} : titre ou description d'aperçu absent`);
    const image = og('image') ?? '';
    assert.ok(image.startsWith(site.urlPublique), `${page} : image d'aperçu sans adresse complète`);
    assert.ok(fs.existsSync(path.join(DIST, image.slice(site.urlPublique.length))), `${page} : image d'aperçu absente`);
  }
});

test("l'accueil sans JavaScript mène aux pages statiques", () => {
  const noscript = /<noscript>([\s\S]*?)<\/noscript>/.exec(read('index.html'))?.[1] ?? '';
  for (const page of ['presentation/', 'realisations/', 'veille/']) assert.ok(noscript.includes(`href="${page}"`), `lien vers ${page} absent`);
});

test('les liens et images des pages statiques mènent à des fichiers publiés', () => {
  for (const page of PAGES) {
    const html = read(`${page}index.html`);
    const urls = [...html.matchAll(/(?:href|src)="([^"#:]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('//'));
    for (const url of urls) {
      // Toutes les adresses relatives partent de la racine du site (<base>)
      if (url.startsWith('../') || url === './') continue;
      const target = path.join(DIST, decodeURIComponent(url.split('?')[0]));
      const exists = fs.existsSync(target) && (fs.statSync(target).isFile() || fs.existsSync(path.join(target, 'index.html')));
      assert.ok(exists, `${page} : lien cassé « ${url} »`);
    }
  }
});
