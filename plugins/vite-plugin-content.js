// =============================================================================
// Plugin Vite « remios-content » : transforme le Markdown en modules JavaScript
// -----------------------------------------------------------------------------
// Chaque fichier .md de content/ devient, au moment du build, un module :
//
//   content/realisations/nas.md  →  export default { meta, html, raw }
//
//   - meta : le frontmatter (bloc entre --- en tête de fichier), vérifié ;
//   - html : le corps du fichier converti en HTML ;
//   - raw  : le texte source sans commentaires, affiché par `cat` dans le terminal.
//
// gray-matter (lecture du frontmatter) et marked (Markdown → HTML) ne tournent
// que sur la machine qui fabrique le site : le navigateur reçoit du HTML déjà
// prêt et n'a aucune bibliothèque à télécharger.
//
// Si une fiche est mal remplie, le build s'arrête avec un message en français
// qui indique le fichier et ce qu'il faut corriger.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { escapeHtml, markPlaceholders, frenchSpacing } from '../src/utils/html.js';

const TYPES = ['entreprise', 'formation', 'perso'];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Une date (AAAA, AAAA-MM, AAAA-MM-JJ) ou une période « début/fin » (2026-01/2026-08)
const DATE_PATTERN = /^\d{4}(?:-\d{2}){0,2}(?:\/\d{4}(?:-\d{2}){0,2})?$/;
const CONFIG_FILE = 'content/site.config.js';

// Politique de sécurité du contenu : scripts, styles, polices et images ne
// peuvent venir que du site lui-même. Même règle que docker/security-headers.conf
// (sauf frame-ancestors, qui n'est pas autorisé dans une balise meta).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export default function contentPlugin() {
  let root = process.cwd();

  return {
    name: 'remios-content',

    // Dossier racine du projet, fourni par Vite
    configResolved(config) {
      root = config.root;
    },

    // Au démarrage (en dev comme au build) : les documents PDF déclarés dans
    // la configuration doivent exister dans public/.
    async buildStart() {
      const site = await loadSiteConfig(root);
      const errors = checkDocuments(site, root);
      if (errors.length) this.error(formatErrors(CONFIG_FILE, errors));
    },

    // Balises qui exigent l'adresse complète du site (aperçus de lien) : ajoutées
    // à index.html seulement si urlPublique est renseignée dans la configuration.
    // Ajoute aussi, au build seulement, la politique de sécurité du contenu.
    async transformIndexHtml(html, context) {
      const tags = [];

      // Politique de sécurité (CSP) en balise meta : GitHub Pages ne permet pas
      // d'envoyer des en-têtes HTTP (la version Docker les envoie via nginx).
      // Seulement au build : en développement, Vite insère des styles à la volée,
      // qu'une politique aussi stricte bloquerait.
      if (!context.server) {
        tags.push(
          { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
          { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head' },
        );
      }

      const site = await loadSiteConfig(root);
      const url = site.urlPublique;
      if (url) {
        if (!/^https?:\/\//.test(url)) {
          this.error(formatErrors(CONFIG_FILE, ['« urlPublique » doit commencer par http:// ou https://']));
        }
        const base = url.endsWith('/') ? url : `${url}/`;
        const meta = (attrs) => ({ tag: 'meta', attrs, injectTo: 'head' });
        tags.push(
          { tag: 'link', attrs: { rel: 'canonical', href: base }, injectTo: 'head' },
          meta({ property: 'og:url', content: base }),
          meta({ property: 'og:image', content: `${base}og-image.png` }),
          meta({ property: 'og:image:width', content: '1200' }),
          meta({ property: 'og:image:height', content: '630' }),
          meta({ property: 'og:image:alt', content: 'Menu principal de RémiOS, le portfolio de Rémi Moreau' }),
          meta({ name: 'twitter:card', content: 'summary_large_image' }),
        );
      }
      return { html, tags };
    },

    // Appelé par Vite pour chaque fichier importé : on ne traite que les .md de content/
    async transform(source, id) {
      if (!id.endsWith('.md')) return null;
      const file = toPosix(path.relative(root, id));
      if (!file.startsWith('content/')) return null;

      // La vérification des compétences dépend de la configuration : si elle
      // change, Vite doit retraiter les fiches.
      this.addWatchFile(path.join(root, CONFIG_FILE));
      const site = await loadSiteConfig(root);

      const { data, content } = matter(source);
      const errors = [];
      const meta = file.startsWith('content/realisations/')
        ? checkRealisation(data, file, site, errors)
        : data;

      const { html, images } = renderMarkdown(content);
      for (const src of images) checkImage(src, root, errors);

      if (errors.length) this.error(formatErrors(file, errors));

      const module = { meta, html, raw: stripComments(source) };
      return { code: `export default ${JSON.stringify(module)};`, map: null };
    },
  };
}

// --- Configuration -----------------------------------------------------------

// Charge content/site.config.js. Le paramètre ?v= (date de modification) force
// Node à relire le fichier quand il a changé, au lieu de garder l'ancienne version.
async function loadSiteConfig(root) {
  const file = path.join(root, CONFIG_FILE);
  const version = fs.statSync(file).mtimeMs;
  const module = await import(`${pathToFileURL(file).href}?v=${version}`);
  return module.default;
}

function checkDocuments(site, root) {
  const errors = [];
  for (const [name, file] of Object.entries(site.documents ?? {})) {
    if (!file) continue; // vide = pas encore disponible, c'est permis
    if (!fs.existsSync(path.join(root, 'public', file))) {
      errors.push(`le document « ${name} » pointe vers public/${file}, qui n'existe pas.`);
    }
  }
  return errors;
}

// --- Vérification d'une fiche de réalisation --------------------------------

function checkRealisation(data, file, site, errors) {
  const meta = { ...data };
  const fileSlug = path.basename(file, '.md');

  if (!isFilled(data.titre)) errors.push('« titre » est obligatoire.');

  if (!SLUG_PATTERN.test(fileSlug)) {
    errors.push('le nom du fichier ne doit contenir que des minuscules sans accent, des chiffres et des tirets.');
  } else if (data.slug !== fileSlug) {
    errors.push(`« slug » doit être identique au nom du fichier : slug: ${fileSlug}`);
  }

  if (!TYPES.includes(data.type)) {
    errors.push(`« type » doit valoir ${TYPES.join(', ')} (valeur actuelle : « ${data.type ?? 'absente'} »).`);
  }

  meta.date = normalizeDate(data.date);
  if (meta.date === null) {
    errors.push('« date » doit être au format AAAA, AAAA-MM ou AAAA-MM-JJ, une période début/fin (ex. 2026-01/2026-08), ou valoir "[À COMPLÉTER]".');
  }

  if (!isFilled(data.statut)) errors.push('« statut » est obligatoire (ex. : en cours, terminé).');

  meta.technos = data.technos ?? [];
  if (!isTextList(meta.technos)) errors.push('« technos » doit être une liste de textes.');

  meta.competences = data.competences ?? [];
  const codes = site.competences.map((c) => c.code);
  if (!isTextList(meta.competences)) {
    errors.push('« competences » doit être une liste de codes (ex. : [C1, C3]).');
  } else {
    for (const code of meta.competences) {
      if (!codes.includes(code)) {
        errors.push(`compétence « ${code} » inconnue. Codes possibles : ${codes.join(', ')} (voir ${CONFIG_FILE}).`);
      }
    }
  }

  if (data.resume !== undefined && typeof data.resume !== 'string') {
    errors.push('« resume » doit être un texte.');
  }

  return meta;
}

// Le lecteur YAML transforme « 2026-09-15 » en objet Date et « 2026 » en nombre :
// on ramène tout à du texte. Renvoie null si le format n'est pas reconnu.
function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value ?? '');
  if (DATE_PATTERN.test(text) || text.includes('[À COMPLÉTER')) return text;
  return null;
}

function checkImage(src, root, errors) {
  if (/^([a-z]+:)?\/\//i.test(src) || src.startsWith('data:')) {
    errors.push(`image « ${src} » : les images doivent être hébergées dans public/ (pas de lien externe).`);
  } else if (src.startsWith('/')) {
    errors.push(`image « ${src} » : utilise un chemin sans « / » au début (ex. captures/nas/schema.webp).`);
  } else if (!fs.existsSync(path.join(root, 'public', src))) {
    errors.push(`image introuvable : public/${src}`);
  }
}

// --- Conversion Markdown → HTML ---------------------------------------------

function renderMarkdown(markdown) {
  const images = []; // chemins des images rencontrées, vérifiés ensuite

  const marked = new Marked({
    gfm: true, // Markdown « GitHub » : tableaux, listes de tâches…
    renderer: {
      // Image cliquable : le lien ouvre l'image en grand (la visionneuse du
      // site l'intercepte ; sans JavaScript, l'image s'ouvre seule).
      image({ href, text }) {
        images.push(href);
        const src = escapeHtml(href);
        return `<a class="shot" href="${src}"><img src="${src}" alt="${escapeHtml(text)}" loading="lazy" decoding="async"></a>`;
      },

      // Paragraphe qui ne contient qu'une image : devient une figure, avec le
      // titre de l'image comme légende : ![description](chemin "Légende")
      paragraph({ tokens }) {
        const inner = this.parser.parseInline(tokens);
        if (tokens.length === 1 && tokens[0].type === 'image') {
          const caption = tokens[0].title;
          return `<figure class="shot-figure">${inner}${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>\n`;
        }
        return `<p>${inner}</p>\n`;
      },

      // Liens externes : ouverts dans un nouvel onglet, sans que la page ouverte
      // puisse agir sur celle-ci (rel="noopener noreferrer").
      link({ href, title, tokens }) {
        const label = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const target = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(href)}"${titleAttr}${target}>${label}</a>`;
      },
    },
  });

  return { html: frenchSpacing(markPlaceholders(marked.parse(markdown))), images };
}

// --- Utilitaires -------------------------------------------------------------

// Retire les commentaires <!-- … --> (consignes de rédaction) du texte source
function stripComments(source) {
  return source.replace(/<!--[\s\S]*?-->\s*/g, '');
}

function formatErrors(file, errors) {
  return `\n\n${file} : à corriger\n${errors.map((e) => `  - ${e}`).join('\n')}\n`;
}

function isFilled(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isTextList(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function toPosix(file) {
  return file.split(path.sep).join('/');
}
