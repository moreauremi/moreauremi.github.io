// =============================================================================
// Navigateur simulé pour les tests (jsdom)
// -----------------------------------------------------------------------------
// Charge le site CONSTRUIT (dist/) dans jsdom, une implémentation du DOM
// écrite en JavaScript : pas d'affichage, mais le vrai code du site s'exécute
// (routeur, rubriques, vue jury, terminal…) comme dans un navigateur.
//
// Les fichiers JavaScript de dist/assets/ sont chargés comme de vrais modules
// (import et import() compris) grâce à vm.SourceTextModule de Node, qui
// demande l'option --experimental-vm-modules (voir « test » dans package.json).
//
// Quelques fonctions absentes de jsdom sont remplacées par des versions
// minimales : fenêtres <dialog>, préférences d'affichage, canvas…
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

export const DIST = path.resolve(import.meta.dirname, '..', 'dist');
const ORIGIN = 'https://remim.me/';

// Ouvre index.html à l'adresse `hash` (#/jury…) et exécute le site, pour le
// test `t` : la fenêtre est fermée à la fin du test (sinon ses minuteries,
// comme le curseur clignotant du titre, empêcheraient Node de s'arrêter).
// Renvoie la fenêtre, la liste des erreurs JavaScript rencontrées et `wait`
// (laisse le site réagir : changement d'adresse, chargement du terminal…).
export async function openSite(t, hash = '') {
  if (typeof vm.SourceTextModule !== 'function') {
    throw new Error('Lancer les tests avec : npm test (option --experimental-vm-modules)');
  }
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const entry = /<script type="module"[^>]*src="\.\/([^"]+)"/.exec(html)[1];

  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => errors.push(error));
  virtualConsole.on('error', (...args) => errors.push(new Error(args.join(' '))));

  const dom = new JSDOM(html.replace(/<script type="module"[^>]*><\/script>/, ''), {
    url: ORIGIN + hash,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole,
  });
  const { window } = dom;
  t.after(() => window.close());
  addMissingApis(window);

  const context = dom.getInternalVMContext();
  const modules = new Map();
  const load = async (file) => {
    if (modules.has(file)) return modules.get(file);
    const module = new vm.SourceTextModule(fs.readFileSync(path.join(DIST, file), 'utf8'), {
      context,
      identifier: file,
      initializeImportMeta: (meta) => {
        meta.url = ORIGIN + file;
      },
      importModuleDynamically: async (specifier) => {
        const target = await load(path.posix.join(path.posix.dirname(file), specifier));
        if (target.status === 'linked') await target.evaluate();
        return target;
      },
    });
    modules.set(file, module);
    await module.link((specifier) => load(path.posix.join(path.posix.dirname(file), specifier)));
    return module;
  };

  await (await load(entry)).evaluate();
  const wait = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));
  return { window, document: window.document, errors, wait, loadedFiles: () => [...modules.keys()] };
}

function addMissingApis(window) {
  // Animations normales (le boot se joue), comme sur la plupart des appareils
  window.matchMedia = (media) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} });
  window.HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  window.HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
  window.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  window.document.fonts = { load: () => Promise.resolve() };
  // Canvas sans dessin : chaque méthode existe mais ne fait rien
  window.HTMLCanvasElement.prototype.getContext = () =>
    new Proxy(
      {},
      {
        get: (target, key) => (key === 'measureText' ? (text) => ({ width: text.length * 8 }) : (target[key] ?? (() => {}))),
        set: (target, key, value) => ((target[key] = value), true),
      },
    );
  window.scrollTo = () => {};
}
