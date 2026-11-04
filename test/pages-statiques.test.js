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
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import matter from 'gray-matter';
import { DIST } from './browser.js';
import site from '../content/site.config.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(DIST, file), 'utf8');
const PLACEHOLDER = 'À COMPLÉTER';

// Fiches du dépôt : publiées et brouillons (fichiers français ; les
// traductions <slug>.en.md ont leur propre liste, plus bas)
const fiches = fs
  .readdirSync(path.join(ROOT, 'content', 'realisations'))
  .filter((name) => name.endsWith('.md') && !name.endsWith('.en.md'))
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

// Version anglaise : une page par texte traduit (fichier <nom>.en.md)
const translated = (file) => fs.existsSync(path.join(ROOT, 'content', file.replace(/\.md$/, '.en.md')));
const EN_PAGES = [
  ...['presentation', 'alternance', 'veille'].filter((name) => translated(`pages/${name}.md`)).map((name) => `en/${name}/`),
  'en/realisations/',
  ...publiees.filter((f) => translated(`realisations/${f.slug}.md`)).map((f) => `en/realisations/${f.slug}/`),
  ...site.veille.sujets.filter((s) => translated(`veille/${s.id}/sujet.md`)).map((s) => `en/veille/${s.id}/`),
];
const ALL_PAGES = [...PAGES, ...EN_PAGES];

test('chaque rubrique, fiche publiée et sujet de veille a sa page, avec du vrai texte', () => {
  for (const page of ALL_PAGES) {
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
  const all = ['index.html', ...ALL_PAGES.map((p) => `${p}index.html`)].map((file) => [file, description(file)]);
  const seen = new Map();
  for (const [file, text] of all) {
    assert.ok(!seen.has(text), `${file} : même description que ${seen.get(text)}`);
    seen.set(text, file);
  }
  // Un titre de section en tête de description (« Pourquoi ce sujet Les PME… »)
  for (const page of ALL_PAGES) {
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
    assert.ok(!fs.existsSync(path.join(DIST, 'en', 'realisations', f.slug)), `brouillon publié en anglais : ${f.slug}`);
    assert.ok(!llms.includes(`realisations/${f.slug}/`), `brouillon dans llms.txt : ${f.slug}`);
  }
  for (const page of ALL_PAGES) assert.ok(!read(`${page}index.html`).includes(PLACEHOLDER), `${page} : repère [À COMPLÉTER] publié`);
});

test('aucune capture provisoire (a-venir.svg) dans le site publié : pages statiques, RémiOS et terminal', () => {
  const PENDING = 'a-venir.svg';
  for (const page of ALL_PAGES) assert.ok(!read(`${page}index.html`).includes(PENDING), `${page} : capture provisoire publiée`);
  // Fiches, vue jury et textes du terminal sont dans les fichiers JavaScript du site
  for (const file of fs.readdirSync(path.join(DIST, 'assets')).filter((name) => name.endsWith('.js'))) {
    assert.ok(!read(`assets/${file}`).includes(PENDING), `assets/${file} : capture provisoire publiée`);
  }
});

test('plan du site et llms.txt listent toutes les pages', () => {
  const sitemap = read('sitemap.xml');
  const llms = read('llms.txt');
  assert.match(llms, /^# /);
  for (const page of ALL_PAGES) {
    assert.ok(sitemap.includes(`<loc>${site.urlPublique}${page}</loc>`), `sitemap.xml : ${page} absente`);
    if (page.startsWith('realisations/') && page !== 'realisations/') {
      assert.ok(llms.includes(`(${site.urlPublique}${page})`), `llms.txt : ${page} absente`);
    }
  }
});

test("l'accueil sans JavaScript mène aux pages statiques", () => {
  const noscript = /<noscript>([\s\S]*?)<\/noscript>/.exec(read('index.html'))?.[1] ?? '';
  for (const page of ['presentation/', 'realisations/', 'veille/']) assert.ok(noscript.includes(`href="${page}"`), `lien vers ${page} absent`);
});

test('les liens et images des pages statiques mènent à des fichiers publiés', () => {
  for (const page of ALL_PAGES) {
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

test('les liens de téléchargement enregistrent un fichier publié, sans nouvel onglet', () => {
  for (const page of ALL_PAGES) {
    const html = read(path.join(page, 'index.html'));
    for (const [tag] of html.matchAll(/<a\b[^>]*\sdownload\b[^>]*>/g)) {
      assert.doesNotMatch(tag, /target=/, `${page} : un lien de téléchargement ne s'ouvre pas dans un nouvel onglet`);
      const href = /href="([^"]+)"/.exec(tag)?.[1];
      assert.ok(href && !/^([a-z]+:)?\/\//i.test(href), `${page} : lien de téléchargement vers un fichier du site`);
    }
  }
});

// --- Version anglaise -------------------------------------------------------------

test('version anglaise : une page par texte traduit, en anglais, reliée à sa version française', () => {
  assert.ok(EN_PAGES.length > 1, 'au moins une page traduite');
  for (const page of EN_PAGES) {
    const html = read(`${page}index.html`);
    assert.match(html, /<html lang="en">/, `${page} : langue de la page`);
    const french = page.replace(/^en\//, '');
    // Chaque page a sa version dans l'autre langue (hreflang), et un lien vers elle
    assert.ok(html.includes(`hreflang="fr" href="${site.urlPublique}${french}"`), `${page} : hreflang vers ${french}`);
    assert.ok(read(`${french}index.html`).includes(`hreflang="en" href="${site.urlPublique}${page}"`), `${french} : hreflang vers ${page}`);
    assert.ok(html.includes('#/en/'), `${page} : le lien vers RémiOS ouvre la version anglaise`);
  }
  // Une fiche non traduite n'a pas de page anglaise : la liste anglaise mène à sa page française
  for (const f of publiees.filter((p) => !translated(`realisations/${p.slug}.md`))) {
    assert.ok(!fs.existsSync(path.join(DIST, 'en', 'realisations', f.slug)), `page anglaise d'une fiche non traduite : ${f.slug}`);
    assert.ok(read('en/realisations/index.html').includes(`href="realisations/${f.slug}/"`), `lien vers la fiche française ${f.slug}`);
  }
});

test('version anglaise : en/ ouvre RémiOS en anglais, et l\'accueil sans JavaScript y mène', () => {
  const html = read('en/index.html');
  assert.match(html, /<meta http-equiv="refresh" content="0; url=\.\.\/#\/en\/">/);
  assert.match(html, /<meta name="robots" content="noindex">/);
  const noscript = /<noscript>([\s\S]*?)<\/noscript>/.exec(read('index.html'))?.[1] ?? '';
  assert.ok(noscript.includes('href="en/realisations/"'), 'lien vers les pages anglaises');
});

test('traductions : leur en-tête ne contient que des champs à traduire, et chacune a son fichier français', () => {
  const TRANSLATED_FIELDS = ['titre', 'resume', 'statut', 'description', 'lettre'];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  const files = walk(path.join(ROOT, 'content')).filter((file) => file.endsWith('.en.md'));
  assert.ok(files.length > 0);
  for (const file of files) {
    assert.ok(fs.existsSync(file.replace(/\.en\.md$/, '.md')), `${file} : fichier français absent`);
    for (const key of Object.keys(matter(fs.readFileSync(file, 'utf8')).data)) {
      assert.ok(TRANSLATED_FIELDS.includes(key), `${file} : « ${key} » vient du fichier français`);
    }
  }
});
