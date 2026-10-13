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
import site from '../content/site.config.js';

const PAGES = ['index.html', '404.html', '403.html', '503.html'];
const read = (file) => fs.readFileSync(path.join(DIST, file), 'utf8');
const boxTitle = (document) => document.querySelector('.tui-box-title')?.textContent ?? '';
// Texte sans les espaces insécables ni les retours à la ligne, pour comparer
const plain = (text) => text.replace(/\s+/g, ' ').trim();

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
    // #tui : la vue jury, masquée, garde la page affichée juste avant
    for (const badge of document.querySelectorAll('#tui .fiche-meta a.techno')) {
      assert.equal(badge.getAttribute('href'), `#/technos/${badge.dataset.techno}`, `techno « ${badge.textContent} » de « ${title} »`);
    }

    window.location.hash = href.replace('#/realisations/', '#/jury/');
    await wait();
    assert.equal(document.querySelector('#jury h1').textContent, title, `fiche « ${title} », vue jury`);
    for (const badge of document.querySelectorAll('#jury .fiche-meta a.techno')) {
      assert.equal(badge.getAttribute('href'), `#/jury/technos/${badge.dataset.techno}`, `techno « ${badge.textContent} » de « ${title} », vue jury`);
    }
  }
  assert.deepEqual(errors, []);
});

test('technos : chaque étiquette mène aux réalisations qui l\'utilisent, dans RémiOS et la vue jury', async (t) => {
  const { window, document, errors, wait } = await openSite(t, '#/realisations');
  const fiches = [...document.querySelectorAll('.fiche-link')].map((a) => a.getAttribute('href'));
  const seen = new Set();

  for (const fiche of fiches) {
    window.location.hash = fiche;
    await wait();
    const badges = [...document.querySelectorAll('#tui .fiche-meta a.techno')].map((a) => ({
      href: a.getAttribute('href'),
      slug: a.dataset.techno,
      name: plain(a.textContent),
    }));

    for (const { href, slug, name } of badges) {
      seen.add(slug);
      // RémiOS : titre, fiche d'origine dans la liste, techno mise en évidence, retour
      // (la techno est reconnue à son identifiant : deux fiches peuvent l'écrire
      // un peu différemment, « Github » et « GitHub » par exemple)
      window.location.hash = href;
      await wait();
      assert.ok(plain(boxTitle(document)).includes('Réalisations : '), `page de « ${name} »`);
      const listed = [...document.querySelectorAll('.tui-box-inner .fiche-link')].map((a) => a.getAttribute('href'));
      assert.ok(listed.includes(fiche), `« ${name} » liste ${fiche}`);
      assert.equal(document.querySelector('.tui-box-inner .tags--all .is-current')?.dataset.techno, slug, `« ${name} » mise en évidence`);
      assert.equal(document.querySelector('[data-back]').getAttribute('href'), '#/realisations');

      // Vue jury : même liste, liens vers les fiches en style sobre
      window.location.hash = `#/jury/technos/${slug}`;
      await wait();
      assert.ok(plain(document.querySelector('#jury h1').textContent).includes('Réalisations : '), `« ${name} », vue jury`);
      assert.equal(document.querySelector('#jury .tags--all .is-current')?.dataset.techno, slug, `« ${name} » mise en évidence, vue jury`);
      const juryListed = [...document.querySelectorAll('#jury .fiche-link')].map((a) => a.getAttribute('href'));
      assert.ok(juryListed.includes(fiche.replace('#/realisations/', '#/jury/')), `« ${name} » liste ${fiche}, vue jury`);
    }
  }
  assert.ok(seen.size > 0, 'au moins une techno publiée');

  // Toutes les technos de la liste ont une page (et seulement celles des fiches)
  const all = [...document.querySelectorAll('#jury .tags--all .techno')].map((el) => el.dataset.techno);
  assert.deepEqual(new Set(all), seen, 'liste « Toutes les technos » = technos des fiches publiées');
  assert.deepEqual(errors, []);
});

test('technos : chaque couleur de technos.css se lit bien (contraste d\'au moins 4,5:1)', () => {
  const css = fs.readFileSync(path.resolve(import.meta.dirname, '../src/styles/technos.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, body]) => ({
    selector: selector.trim(),
    bg: /--techno-bg:\s*(#[0-9a-f]{6})/i.exec(body)?.[1],
    ink: /--techno-ink:\s*(#[0-9a-f]{6})/i.exec(body)?.[1],
  }));
  const base = rules.find((r) => r.selector === '.techno');
  assert.ok(base?.bg && base?.ink, 'couleurs par défaut (.techno)');

  // Contraste selon les règles d'accessibilité (WCAG 2)
  const luminance = (hex) =>
    [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  for (const { selector, bg, ink } of rules) {
    assert.ok(bg, `${selector} : --techno-bg au format #rrvvbb`);
    const ratio = contrast(bg, ink ?? base.ink);
    assert.ok(ratio >= 4.5, `${selector} : contraste ${ratio.toFixed(2)}:1, il faut au moins 4,5:1 (essayer --techno-ink: #000000)`);
  }
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

test('mesure d\'audience : annoncée dans les mentions légales et autorisée par la CSP, rien d\'envoyé en test', async (t) => {
  const counter = site.audience?.goatcounter ? new URL(site.audience.goatcounter).origin : null;
  const csp = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(read('index.html'))[1].replaceAll('&#39;', "'");
  assert.equal(/connect-src [^;]*goatcounter/.test(csp), Boolean(counter), 'connect-src');

  const { window, document, errors, wait } = await openSite(t, '#/mentions-legales');
  const text = document.querySelector('.tui-box-inner').textContent;
  assert.equal(text.includes('GoatCounter'), Boolean(counter), 'paragraphe « Mesure d\'audience »');
  assert.equal(text.includes("n'utilise aucun outil de mesure d'audience"), !counter);

  // Navigateur piloté par un programme (les tests, les robots) : rien n'est compté
  const sent = [];
  window.navigator.sendBeacon = (url) => sent.push(new URL(url)) > 0;
  window.location.hash = '#/veille';
  await wait();
  assert.deepEqual(sent, []);

  // Visiteur ordinaire : une page vue par écran affiché, envoyée à GoatCounter
  if (counter) {
    Object.defineProperty(window.navigator, 'webdriver', { value: false, configurable: true });
    window.location.hash = '#/realisations';
    await wait();
    assert.equal(sent.length, 1);
    assert.equal(`${sent[0].origin}${sent[0].pathname}`, `${counter}/count`);
    assert.equal(sent[0].searchParams.get('p'), '/realisations');
  }
  assert.deepEqual(errors, []);
});

test('adresse inconnue ou mal encodée : écran d\'erreur, sans plantage', async (t) => {
  // Premier affichage directement sur une adresse mal encodée
  const first = await openSite(t, '#/%E9');
  assert.ok(boxTitle(first.document).includes('Erreur'));
  assert.deepEqual(first.errors, []);

  const { window, document, errors, wait } = await openSite(t, '#/');
  for (const hash of ['#/rubrique-inconnue', '#/realisations/inconnue', '#/technos/inconnue', '#/veille/inconnu', '#/a/b/c', '#/%E9']) {
    window.location.hash = hash;
    await wait();
    assert.ok(boxTitle(document).includes('Erreur'), hash);
  }
  for (const hash of ['#/jury/inconnue', '#/jury/technos/inconnue']) {
    window.location.hash = hash;
    await wait();
    assert.match(document.querySelector('#jury h1').textContent, /introuvable/, hash);
  }
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
