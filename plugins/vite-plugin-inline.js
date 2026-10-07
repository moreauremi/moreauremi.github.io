// =============================================================================
// Plugin Vite « remios-inline » : recopie des fichiers à l'intérieur des pages
// -----------------------------------------------------------------------------
// Deux besoins des pages servies hors de l'application (404, 403, 503) :
//
// 1. Fonctionner sans rien télécharger (503.html, affichée quand le site est
//    arrêté). Ses styles et son icône restent pourtant dans leurs propres
//    fichiers (un langage par fichier) : chaque balise <link> marquée
//    data-inline est remplacée par le contenu du fichier.
//
//      <link rel="stylesheet" href="/src/styles/x.css" data-inline>  →  <style>…</style>
//      <link rel="icon" href="/favicon.svg" data-inline>             →  href="data:image/svg+xml,…"
//
// 2. Partager un cadre commun (404.html et 403.html) : le contenu d'une balise
//    <template data-layout="/src/cadre.html"> est inséré dans ce fichier, à la
//    place de sa balise <slot></slot>.
//
// Le remplacement a lieu en développement comme au build, AVANT que Vite ne
// traite la page (order: 'pre') : le style recopié est ensuite minifié par
// Vite, puis autorisé par la CSP grâce à son empreinte (vite-plugin-content.js).
// Une adresse qui commence par « / » désigne public/ si le fichier s'y
// trouve, sinon la racine du projet (même règle que Vite).
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';

// Balise <link …> qui porte l'attribut data-inline
const INLINE_LINK = /<link\b[^>]*\sdata-inline\b[^>]*>/g;
// Contenu à insérer dans un cadre commun
const LAYOUT = /<template data-layout="([^"]+)">([\s\S]*?)<\/template>/g;

export default function inlinePlugin() {
  let root = process.cwd();

  return {
    name: 'remios-inline',

    configResolved(config) {
      root = config.root;
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        const page = path.basename(context.filename);
        // Remplacements par des fonctions : un « $ » du contenu (invite
        // « visiteur@remios:~$ ») est ainsi recopié tel quel.
        return html
          .replace(LAYOUT, (_, href, content) => insertInLayout(href, content, root, page))
          .replace(INLINE_LINK, (tag) => inlineLink(tag, root, page));
      },
    },
  };
}

function insertInLayout(href, content, root, page) {
  const layout = readFile(root, href, page, 'data-layout');
  if (!layout.includes('<slot></slot>')) throw new Error(`${page} : le cadre « ${href} » n'a pas de balise <slot></slot>.`);
  return layout.trim().replace('<slot></slot>', () => content.trim());
}

function inlineLink(tag, root, page) {
  const rel = attribute(tag, 'rel');
  const href = attribute(tag, 'href');
  const content = readFile(root, href, page, 'data-inline');

  if (rel === 'stylesheet') return `<style>\n${content}</style>`;
  if (rel === 'icon' && href.endsWith('.svg')) {
    return tag.replace(/\shref="[^"]*"/, () => ` href="${svgDataUri(content)}"`).replace(/\s+data-inline\b/, '');
  }
  throw new Error(`${page} : data-inline ne sait recopier qu'une feuille de style ou une icône SVG (balise ${tag}).`);
}

function attribute(tag, name) {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1] ?? '';
}

function readFile(root, href, page, marker) {
  const candidates = href.startsWith('/')
    ? [path.join(root, 'public', href), path.join(root, href)]
    : [path.join(root, href)];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) throw new Error(`${page} : fichier « ${href} » introuvable (${marker}).`);
  return fs.readFileSync(file, 'utf8');
}

// Image SVG → adresse data: la plus courte possible, sans commentaires ni
// espaces entre les balises. Les guillemets doubles deviennent simples pour
// tenir dans l'attribut href="…".
function svgDataUri(svg) {
  const compact = svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .trim()
    .replaceAll('"', "'");
  const encoded = encodeURIComponent(compact).replace(/%2F/g, '/').replace(/%3A/g, ':').replace(/%3D/g, '=');
  return `data:image/svg+xml,${encoded}`;
}
