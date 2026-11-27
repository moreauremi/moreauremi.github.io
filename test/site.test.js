// =============================================================================
// Tests du site construit : `npm test` (après `npm run build`)
// -----------------------------------------------------------------------------
// Vérifie ce qu'un visiteur obtient réellement dans dist/ : chaque page
// attendue, la politique de sécurité, les liens internes, les brouillons et
// les repères [À COMPLÉTER] absents, le gabarit des fiches, la règle de
// discrétion sur l'environnement de 1Life, les couleurs du thème.
// Aucun test ne dépend du texte exact du contenu.
// =============================================================================

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import matter from 'gray-matter';
import site from '../content/site.config.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const read = (file) => fs.readFileSync(path.join(DIST, file), 'utf8');

// Toutes les pages HTML de dist/ (chemins relatifs, en « / »)
function htmlFiles(dir = DIST) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith('.html') ? [path.relative(DIST, full).split(path.sep).join('/')] : [];
  });
}

const fiches = fs
  .readdirSync(path.join(ROOT, 'content/realisations'))
  .filter((name) => name.endsWith('.md'))
  .map((name) => matter(fs.readFileSync(path.join(ROOT, 'content/realisations', name), 'utf8')).data);
const published = fiches.filter((f) => !f.brouillon);
const drafts = fiches.filter((f) => f.brouillon);

const PAGES = ['index.html', 'projets/index.html', 'formations/index.html', 'veille/index.html', 'contact/index.html', 'mentions-legales/index.html'];
const isRedirect = (html) => html.includes('http-equiv="refresh"');
const sitePages = () => htmlFiles().filter((file) => !isRedirect(read(file)));

test('chaque page attendue existe, avec une fiche par réalisation publiée', () => {
  for (const page of [...PAGES, ...published.map((f) => `projets/${f.slug}/index.html`)]) {
    assert.ok(fs.existsSync(path.join(DIST, page)), `${page} absente`);
  }
});

test('les brouillons ne sont publiés nulle part', () => {
  const everything = htmlFiles().map(read).join('\n') + fs.readdirSync(path.join(DIST, 'assets')).map((f) => fs.readFileSync(path.join(DIST, 'assets', f), 'latin1')).join('\n');
  for (const draft of drafts) {
    assert.ok(!fs.existsSync(path.join(DIST, 'projets', draft.slug)), `projets/${draft.slug}/ publiée`);
    assert.ok(!everything.includes(draft.titre), `le titre du brouillon « ${draft.titre} » apparaît dans dist/`);
  }
});

test('aucun repère [À COMPLÉTER] ni commentaire HTML dans les pages publiées', () => {
  for (const file of htmlFiles()) {
    const html = read(file);
    assert.ok(!html.includes('À COMPLÉTER'), `${file} contient un repère [À COMPLÉTER]`);
    assert.ok(!html.includes('<!--'), `${file} contient un commentaire`);
  }
});

test('chaque page a une CSP qui autorise exactement les blocs écrits dans la page', () => {
  for (const file of sitePages()) {
    const html = read(file);
    const csp = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1].replaceAll('&#39;', "'");
    assert.ok(csp, `${file} : balise CSP absente`);
    assert.ok(!/<script[^>]+src="https?:/.test(html), `${file} : script extérieur`);
    const blocks = [
      ...[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]),
      ...[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]),
    ];
    for (const text of blocks) {
      const hash = `'sha256-${crypto.createHash('sha256').update(text).digest('base64')}'`;
      assert.ok(csp.includes(hash), `${file} : un bloc écrit dans la page n'est pas autorisé par la CSP`);
    }
  }
});

test('la page 503 fonctionne sans rien télécharger', () => {
  const html = read('503.html');
  assert.ok(!/<script\b/.test(html), 'aucun script');
  assert.ok(!/<link[^>]+rel="stylesheet"/.test(html), 'aucune feuille de style extérieure');
  assert.ok(/<style>/.test(html), 'style écrit dans la page');
});

test('chaque lien interne mène à un fichier qui existe', () => {
  for (const file of htmlFiles().filter((f) => !['404.html', '403.html', '503.html'].includes(f))) {
    const html = read(file);
    for (const [, url] of html.matchAll(/\s(?:href|src)="(\.[^"#?]*)/g)) {
      if (url === '' || url.startsWith('data:')) continue;
      let target = path.join(DIST, path.dirname(file), url);
      if (url.endsWith('/') || fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      assert.ok(fs.existsSync(target), `${file} : lien cassé vers ${url}`);
    }
    // Un refresh de redirection mène aussi à une page qui existe
    const refresh = /content="0; url=([^"#]+)/.exec(html)?.[1];
    if (refresh) assert.ok(fs.existsSync(path.join(DIST, path.dirname(file), refresh, refresh.endsWith('/') ? 'index.html' : '')), `${file} : redirection cassée`);
  }
});

test('anciennes adresses : chaque fiche RémiOS renvoie vers sa nouvelle page', () => {
  for (const f of published) {
    for (const slug of [f.slug, ...(f.anciennesAdresses ?? [])]) {
      const html = read(`realisations/${slug}/index.html`);
      assert.ok(html.includes(`url=../../projets/${f.slug}/`), `realisations/${slug}/ ne renvoie pas vers projets/${f.slug}/`);
    }
  }
});

test('gabarit : chaque fiche a résumé, contexte, ce que j\'ai fait (3 puces au plus) et compétences', () => {
  for (const f of published) {
    const html = read(`projets/${f.slug}/index.html`);
    assert.ok(html.includes('class="resume"'), `${f.slug} : résumé absent`);
    for (const label of ['contexte', "ce que j'ai fait", 'compétences']) {
      assert.ok(html.includes(`<dt>${label}</dt>`), `${f.slug} : « ${label} » absent`);
    }
    const actions = /<ul class="actions">([\s\S]*?)<\/ul>/.exec(html)[1].match(/<li>/g).length;
    assert.ok(actions >= 1 && actions <= 3, `${f.slug} : ${actions} puces`);
  }
});

test('projets : trois sections dans l\'ordre, l\'applicatif avant l\'infra', () => {
  const html = read('projets/index.html');
  const order = ['formation', 'entreprise', 'perso'].map((id) => html.indexOf(`<section class="section" id="${id}"`));
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'sections dans le désordre');
  for (const section of html.split('<section').slice(1)) {
    const domains = [...section.matchAll(/<p class="meta">[^<]*<span[^>]*>[^<]*<\/span>(applicatif|infra)/g)].map((m) => m[1]);
    assert.deepEqual(domains, [...domains].sort(), 'un projet infra est placé avant un projet applicatif');
  }
});

test('1Life : aucune machine, aucun accès ni outil interne nommé', () => {
  const forbidden = /\bVM\b|machine virtuelle|\bSSH\b|MyFab|app-manager|sql-update|openprod-info|maj_base|ScriptAppManager/i;
  const entreprise = published.filter((f) => f.type === 'entreprise');
  for (const f of entreprise) {
    const html = read(`projets/${f.slug}/index.html`);
    const article = /<article[\s\S]*?<\/article>/.exec(html)[0];
    assert.ok(!forbidden.test(article), `${f.slug} : ${forbidden.exec(article)?.[0]}`);
  }
  const section = /<section class="section" id="entreprise"[\s\S]*?<\/section>/.exec(read('projets/index.html'))[0];
  assert.ok(!forbidden.test(section), `projets, section entreprise : ${forbidden.exec(section)?.[0]}`);
});

test('accueil : sphère, carte, et menu accueil · projets · veille · cv · github · linkedin', () => {
  const html = read('index.html');
  assert.ok(html.includes('class="sphere-canvas"'), 'sphère absente');
  assert.ok(/<section class="card"/.test(html), 'carte absente');
  const nav = /<ul class="nav">([\s\S]*?)<\/ul>/.exec(html)[1];
  const labels = [...nav.matchAll(/>([^<]+)<\/a>/g)].map((m) => m[1]);
  assert.deepEqual(labels, ['accueil', 'projets', 'veille', 'cv', 'github', 'linkedin']);
  for (const value of Object.values(site.accueil)) assert.ok(html.includes(value.replaceAll("'", '&#39;')), `carte : « ${value} » absent`);
});

test('plan du site : toutes les pages, sans brouillon ni page de remerciement', () => {
  const xml = read('sitemap.xml');
  for (const f of published) assert.ok(xml.includes(`projets/${f.slug}/`), `${f.slug} absente du plan`);
  for (const f of drafts) assert.ok(!xml.includes(`projets/${f.slug}/`), `brouillon ${f.slug} dans le plan`);
  assert.ok(!xml.includes('contact/merci/'));
});

// --- Couleurs : contraste d'au moins 4,5:1 sur le fond ------------------------------

function luminance(hex) {
  const [r, g, b] = hex.match(/\w\w/g).map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

test('thème : texte, texte secondaire et liens à 4,5:1 au moins sur le fond', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/site.css'), 'utf8');
  const value = (name) => new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(css)[1];
  for (const name of ['text', 'muted', 'accent']) {
    const ratio = contrast(value(name), value('bg'));
    assert.ok(ratio >= 4.5, `--${name} : ${ratio.toFixed(2)}:1`);
  }
});

test('thème : aucune taille de texte sous 12 px', () => {
  for (const file of ['site.css', 'terminal.css']) {
    const css = fs.readFileSync(path.join(ROOT, 'src/styles', file), 'utf8');
    for (const [, px] of css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) assert.ok(Number(px) >= 12, `${file} : ${px}px`);
  }
});
