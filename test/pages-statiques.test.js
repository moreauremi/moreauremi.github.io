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
    assert.match(html, /<meta name="description" content="[^"]{20,}">/, `${page} : description absente`);
    assert.match(html, /http-equiv="Content-Security-Policy"/, `${page} : CSP absente`);
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
