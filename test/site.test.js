// =============================================================================
// Tests du site construit : `npm test` (après `npm run build`)
// -----------------------------------------------------------------------------
// Vérifie ce qu'un visiteur obtient réellement : les pages publiées (CSP,
// page 503 autonome) et le site exécuté dans un navigateur simulé (voir
// browser.js) : chaque rubrique, chaque fiche, la vue jury, les erreurs, le
// terminal. Aucun test ne dépend du texte exact du contenu : on peut modifier
// les fiches sans toucher aux tests.
// =============================================================================

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { DIST, openSite } from './browser.js';

const PAGES = ['index.html', '404.html', '403.html', '503.html'];
const read = (file) => fs.readFileSync(path.join(DIST, file), 'utf8');
const boxTitle = (document) => document.querySelector('.tui-box-title')?.textContent ?? '';

// --- Pages publiées -----------------------------------------------------------

test('chaque bloc écrit dans une page est autorisé par la CSP de cette page', () => {
  for (const page of PAGES) {
    const html = read(page);
    const csp = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1].replaceAll('&#39;', "'");
    assert.ok(csp, `${page} : balise CSP absente`);
    const blocks = [
      ...[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]),
      ...[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]),
    ];
    for (const text of blocks) {
      const hash = `'sha256-${crypto.createHash('sha256').update(text).digest('base64')}'`;
      assert.ok(csp.includes(hash), `${page} : un bloc écrit dans la page n'est pas autorisé par la CSP`);
    }
  }
});

test('les pages publiées ne contiennent aucun commentaire HTML', () => {
  for (const page of PAGES) assert.ok(!read(page).includes('<!--'), `${page} contient un commentaire`);
});

test('la page 503 fonctionne sans rien télécharger', () => {
  const html = read('503.html');
  assert.ok(!/<script\b/.test(html), 'aucun script');
  assert.ok(/<style>/.test(html), 'style écrit dans la page');
  for (const [tag] of html.matchAll(/<(?:link|img)\b[^>]*>/g)) {
    assert.match(tag, /(?:href|src)="data:/, `ressource téléchargée : ${tag}`);
  }
});

test('icône pour Google : favicon.ico déclaré, avec une image de 48 px', () => {
  assert.match(read('index.html'), /<link rel="icon" href="\.?\/favicon\.ico"/, 'favicon.ico déclaré');
  // En-tête ICO : nombre d'images, puis largeur et hauteur de chacune (0 = 256)
  const ico = fs.readFileSync(path.join(DIST, 'favicon.ico'));
  const sizes = Array.from({ length: ico.readUInt16LE(4) }, (_, i) => [ico[6 + 16 * i] || 256, ico[7 + 16 * i] || 256]);
  assert.ok(sizes.some(([w, h]) => w === h && w % 48 === 0), `une image carrée multiple de 48 px (trouvé : ${sizes.map((s) => s.join('×')).join(', ')})`);
});

// --- Site exécuté dans le navigateur simulé -------------------------------------

test('accueil : démarrage, puis chaque rubrique du menu s\'ouvre', async (t) => {
  const { window, document, errors, wait } = await openSite(t, '#/');
  assert.ok(document.querySelector('.boot .grub'), 'écran GRUB affiché au démarrage');

  const items = [...document.querySelectorAll('.menu-item')];
  assert.ok(items.length >= 8, 'au moins huit rubriques');
  for (const item of items) {
    const label = item.querySelector('span:last-child').textContent;
    window.location.hash = item.getAttribute('href');
    await wait();
    assert.ok(boxTitle(document).includes(label), `rubrique « ${label} »`);
    assert.ok(document.querySelector('.tui-box-inner').children.length > 0, `rubrique « ${label} » vide`);
  }
  assert.deepEqual(errors, []);
});

test('chaque fiche s\'ouvre dans RémiOS et dans la vue jury, sans consignes de rédaction', async (t) => {
  const { window, document, errors, wait } = await openSite(t, '#/realisations');
  const fiches = [...document.querySelectorAll('.fiche-link')].map((a) => ({
    href: a.getAttribute('href'),
    title: a.querySelector('.fiche-link-title').textContent,
  }));
  assert.ok(fiches.length > 0, 'au moins une fiche publiée');

  for (const { href, title } of fiches) {
    window.location.hash = href;
    await wait();
    assert.ok(boxTitle(document).includes(title), `fiche « ${title} »`);
    assert.ok(document.querySelector('.tui-box-inner .fiche'), `contenu de « ${title} »`);
    assert.ok(!document.querySelector('.tui-stage').innerHTML.includes('<!--'), `commentaire publié dans « ${title} »`);

    window.location.hash = href.replace('#/realisations/', '#/jury/');
    await wait();
    assert.equal(document.querySelector('#jury h1').textContent, title, `fiche « ${title} », vue jury`);
  }
  assert.deepEqual(errors, []);
});

test('vue jury : sommaire et parties', async (t) => {
  const { document, errors } = await openSite(t, '#/jury');
  const toc = document.querySelectorAll('.jury-toc li');
  assert.ok(toc.length >= 8, 'sommaire complet');
  assert.equal(document.querySelectorAll('.jury-part').length, toc.length, 'une partie par entrée du sommaire');
  assert.deepEqual(errors, []);
});

test('veille : un onglet par sujet, et dans chacun « actualités » et « synthèses »', async (t) => {
  const { window, document, errors, wait } = await openSite(t, '#/veille');
  const topics = () => [...document.querySelectorAll('.tabs--main > .tab-list > [role="tab"]')];
  const panels = () => [...document.querySelectorAll('.tabs--main > .tab-panels > [role="tabpanel"]')];
  assert.ok(topics().length >= 2, 'plusieurs sujets');
  for (const panel of panels()) {
    assert.equal(panel.querySelectorAll(':scope > .tabs > .tab-list > [role="tab"]').length, 2, `deux onglets dans « ${panel.dataset.title} »`);
  }

  // Changer de sujet : seul le panneau du sujet choisi est affiché
  topics()[1].click();
  assert.deepEqual(panels().map((p) => !p.hasAttribute('data-off')), panels().map((_, i) => i === 1));

  // Onglet intérieur : ne change pas le sujet affiché
  const inner = panels()[1].querySelectorAll(':scope > .tabs > .tab-list > [role="tab"]');
  inner[1].click();
  assert.equal(inner[1].getAttribute('aria-selected'), 'true');
  assert.equal(topics()[1].getAttribute('aria-selected'), 'true', 'le sujet reste choisi');

  // Adresse d'un sujet : son onglet ouvert d'emblée
  const id = panels()[2 % panels().length].querySelector('[id^="veille-"][id$="-sources"]').id.replace(/^veille-|-sources$/g, '');
  window.location.hash = `#/veille/${id}`;
  await wait();
  assert.equal(topics()[2 % topics().length].getAttribute('aria-selected'), 'true', `#/veille/${id}`);

  // Page d'un tag (s'il y en a), avec retour vers l'onglet du sujet
  const tag = document.querySelector('.tabs--main a.tag');
  if (tag) {
    window.location.hash = tag.getAttribute('href');
    await wait();
    assert.match(document.querySelector('.tui-box-title').textContent, /Veille .+ : /);
    assert.match(document.querySelector('[data-back]').getAttribute('href'), /^#\/veille\/[a-z0-9-]+$/);
  }
  assert.deepEqual(errors, []);
});

test('adresse inconnue ou mal encodée : écran d\'erreur, sans plantage', async (t) => {
  // Premier affichage directement sur une adresse mal encodée
  const first = await openSite(t, '#/%E9');
  assert.ok(boxTitle(first.document).includes('Erreur'));
  assert.deepEqual(first.errors, []);

  const { window, document, errors, wait } = await openSite(t, '#/');
  for (const hash of ['#/rubrique-inconnue', '#/realisations/inconnue', '#/veille/inconnu', '#/a/b/c', '#/%E9']) {
    window.location.hash = hash;
    await wait();
    assert.ok(boxTitle(document).includes('Erreur'), hash);
  }
  window.location.hash = '#/jury/inconnue';
  await wait();
  assert.match(document.querySelector('#jury h1').textContent, /introuvable/);
  assert.deepEqual(errors, []);
});

test('terminal : téléchargé à la première ouverture, commandes et textes des fiches', async (t) => {
  const { window, document, errors, wait, loadedFiles } = await openSite(t, '#/');
  const isTerminalFile = (file) => /terminal-[^/]*\.js$/.test(file);
  assert.ok(!loadedFiles().some(isTerminalFile), 'terminal absent au chargement de la page');
  assert.equal(document.querySelector('dialog.terminal'), null);

  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: '`', code: 'Backquote', bubbles: true }));
  await wait(300);
  assert.ok(loadedFiles().some(isTerminalFile), 'terminal téléchargé');
  assert.ok(document.querySelector('dialog.terminal').open, 'terminal ouvert');

  const output = document.querySelector('.terminal-output');
  const run = (command) => {
    document.querySelector('.terminal-input').value = command;
    document.querySelector('.terminal-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
    return output.lastElementChild?.textContent ?? '';
  };

  run('help');
  assert.match(output.textContent, /Commandes disponibles/);
  assert.match(run('cat presentation.md'), /^---/, 'texte source d\'une page');
  run('cd realisations');
  const fiche = run('ls perso').split(/\s+/).find((name) => name.endsWith('.md'));
  assert.ok(fiche, 'au moins une fiche dans ~/realisations/perso');
  const source = run(`cat perso/${fiche}`);
  assert.match(source, /^---\ntitre:/, `texte source de ${fiche}`);
  assert.ok(!source.includes('<!--'), `consignes de rédaction affichées par cat ${fiche}`);
  assert.match(run('cat /etc/os-release'), /RémiOS/);
  assert.deepEqual(errors, []);
});
