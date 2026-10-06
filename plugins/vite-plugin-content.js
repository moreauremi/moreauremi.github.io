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
// Une fiche marquée « brouillon: true » est visible avec `npm run dev`, mais
// absente du site publié : au build, son module est vide (null), et son texte
// n'apparaît nulle part dans les fichiers envoyés aux visiteurs.
//
// gray-matter (lecture du frontmatter) et marked (Markdown → HTML) ne tournent
// que sur la machine qui fabrique le site : le navigateur reçoit du HTML déjà
// prêt et n'a aucune bibliothèque à télécharger.
//
// Si une fiche est mal remplie, le build s'arrête avec un message en français
// qui indique le fichier et ce qu'il faut corriger.
// =============================================================================

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { escapeHtml, markPlaceholders, frenchSpacing } from '../src/utils/html.js';
import { FORM_ACTION } from '../src/utils/contact-form.js';

const TYPES = ['entreprise', 'formation', 'perso'];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Une date (AAAA, AAAA-MM, AAAA-MM-JJ) ou une période « début/fin » (2026-01/2026-08)
const DATE_PATTERN = /^\d{4}(?:-\d{2}){0,2}(?:\/\d{4}(?:-\d{2}){0,2})?$/;
const SINGLE_DATE_PATTERN = /^\d{4}(?:-\d{2}){0,2}$/;
const CONFIG_FILE = 'content/site.config.js';
// Adresses réservées à des pages de la vue jury (#/jury/mentions-legales) :
// une fiche ne peut pas porter ces noms.
const RESERVED_SLUGS = ['mentions-legales'];
const CERTIFICATION_CATEGORIES = ['certification', 'langue', 'formation', 'badge'];
const CERTIFICATION_STATUSES = ['obtenue', 'en cours'];

// Politique de sécurité du contenu : scripts, styles, polices et images ne
// peuvent venir que du site lui-même. Même règle que docker/security-headers.conf
// (sauf frame-ancestors, qui n'est pas autorisé dans une balise meta).
// Seule exception : si le formulaire de contact est activé, il peut être
// envoyé au service qui transmet les messages.
// `styleHashes` : empreintes des styles écrits dans la page (voir inlineStyleHashes).
function contentSecurityPolicy(site, styleHashes = []) {
  const formAction = site.formulaire?.cle ? `'self' ${new URL(FORM_ACTION).origin}` : "'self'";
  return [
    "default-src 'self'",
    "script-src 'self'",
    ["style-src 'self'", ...styleHashes].join(' '),
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    `form-action ${formAction}`,
  ].join('; ');
}

// Empreintes SHA-256 des blocs <style> écrits dans la page (seule 503.html en a,
// car elle ne peut charger aucun fichier) : la CSP autorise exactement ces
// styles-là, et aucun autre, au lieu de tous les autoriser avec 'unsafe-inline'.
// Calculées sur le HTML final : Vite a déjà minifié le contenu des <style>.
function inlineStyleHashes(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
    ([, css]) => `'sha256-${crypto.createHash('sha256').update(css).digest('base64')}'`,
  );
}

export default function contentPlugin() {
  let root = process.cwd();
  let isDev = false;

  return {
    name: 'remios-content',

    // Dossier racine du projet et mode (développement ou build), fournis par Vite
    configResolved(config) {
      root = config.root;
      isDev = config.command === 'serve';
    },

    // Au démarrage (en dev comme au build) : les fichiers déclarés dans la
    // configuration (PDF, photo, justificatifs) doivent exister dans public/,
    // et les compétences ne peuvent renvoyer qu'à des fiches existantes.
    async buildStart() {
      const site = await loadSiteConfig(root);
      const errors = [...checkDocuments(site, root), ...checkConfig(site, root)];
      if (errors.length) this.error(formatErrors(CONFIG_FILE, errors));
    },

    // Balises qui exigent l'adresse complète du site (aperçus de lien) : ajoutées
    // à index.html seulement si urlPublique est renseignée dans la configuration.
    // Ajoute aussi, au build seulement, la politique de sécurité du contenu.
    // Référencement : titre, description et version sans JavaScript viennent
    // de la rubrique « referencement » de la configuration.
    // Appelé pour chaque page : index.html et les pages d'erreur (404.html…).
    async transformIndexHtml(html, context) {
      const tags = [];
      const site = await loadSiteConfig(root);
      // Le référencement ne concerne que la page du site : les pages d'erreur
      // gardent leur propre titre et ne sont pas proposées aux moteurs.
      const isMainPage = path.basename(context.filename) === 'index.html';
      if (isMainPage) html = applySeo(html, site);

      // Politique de sécurité (CSP) en balise meta : GitHub Pages ne permet pas
      // d'envoyer des en-têtes HTTP (la version Docker les envoie via nginx).
      // Seulement au build : en développement, Vite insère des styles à la volée,
      // qu'une politique aussi stricte bloquerait.
      if (!context.server) {
        const csp = contentSecurityPolicy(site, inlineStyleHashes(html));
        tags.push(
          { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' },
          { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head' },
        );
      }

      if (!isMainPage) return { html, tags };

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
          // Données structurées : fiche « personne » lue par les moteurs de recherche
          { tag: 'script', attrs: { type: 'application/ld+json' }, children: structuredData(site, base), injectTo: 'head' },
        );
      }
      return { html, tags };
    },

    // Au build : plan du site (sitemap.xml) et consignes aux robots (robots.txt)
    async generateBundle() {
      const site = await loadSiteConfig(root);
      const base = site.urlPublique ? site.urlPublique.replace(/\/?$/, '/') : '';
      const today = new Date().toISOString().slice(0, 10);
      // Le CV (docs/) n'est pas proposé aux moteurs de recherche : il contient
      // un numéro de téléphone qu'il vaut mieux ne pas voir dans les résultats.
      const robots = ['User-agent: *', 'Allow: /', 'Disallow: /docs/'];
      if (base) {
        robots.push('', `Sitemap: ${base}sitemap.xml`);
        // Le site n'a qu'une page réelle : les écrans (#/…) sont dans la même page
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}</loc>
    <lastmod>${today}</lastmod>
  </url>
</urlset>
`,
        });
      }
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots.join('\n')}\n` });
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

      // Brouillon : publié seulement en développement
      if (meta.brouillon && !isDev) return { code: 'export default null;', map: null };

      const module = { meta, html, raw: stripComments(source) };
      return { code: `export default ${JSON.stringify(module)};`, map: null };
    },
  };
}

// --- Référencement ------------------------------------------------------------

// Remplace titre, description et version sans JavaScript d'index.html par
// les valeurs de la configuration (une seule source pour tout le site).
function applySeo(html, site) {
  const seo = site.referencement;
  if (!seo) return html;
  const title = escapeHtml(`RémiOS — ${seo.titre}`);
  const description = escapeHtml(seo.description);
  const { email, github, linkedin } = site.contact;
  const cv = site.documents.cv;
  const links = [
    `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`,
    `<a href="${escapeHtml(github)}">GitHub</a>`,
    `<a href="${escapeHtml(linkedin)}">LinkedIn</a>`,
    cv ? `<a href="${escapeHtml(cv)}">CV (PDF)</a>` : '',
  ].filter(Boolean);
  const fallback = `<noscript>
      <div class="noscript">
        <h1>${escapeHtml(seo.titre.replace(' · ', ' — '))}</h1>
        <p>${description}</p>
        <p>Ce portfolio interactif a besoin de JavaScript pour s'afficher. Contact : ${links.join(' · ')}</p>
      </div>
    </noscript>`;
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeHtml(seo.titre)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/<noscript data-fallback>[\s\S]*?<\/noscript>/, fallback);
}

// Données structurées schema.org (JSON-LD) : le site, la page de profil et la
// personne qu'elle présente. C'est ce qui aide Google à associer le nom
// « Rémi Moreau » à ce site, à ses comptes GitHub et LinkedIn, à sa formation
// et à son entreprise.
function structuredData(site, base) {
  const seo = site.referencement ?? {};
  const person = {
    '@type': 'Person',
    '@id': `${base}#personne`,
    name: site.identite.nom,
    url: base,
    description: seo.description,
    jobTitle: seo.poste,
    worksFor: seo.entreprise && {
      '@type': 'Organization',
      name: seo.entreprise,
      parentOrganization: seo.groupe && { '@type': 'Organization', name: seo.groupe },
    },
    affiliation: seo.ecole && { '@type': 'EducationalOrganization', name: seo.ecole },
    address: seo.ville && { '@type': 'PostalAddress', addressLocality: seo.ville, addressCountry: 'FR' },
    knowsAbout: seo.domaines,
    sameAs: [site.contact.github, site.contact.linkedin].filter(Boolean),
  };
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${base}#site`, url: base, name: `RémiOS — portfolio de ${site.identite.nom}`, inLanguage: 'fr-FR' },
      { '@type': 'ProfilePage', '@id': `${base}#page`, url: base, name: seo.titre, inLanguage: 'fr-FR', isPartOf: { '@id': `${base}#site` }, mainEntity: { '@id': `${base}#personne` } },
      person,
    ],
  };
  // « < » échappé : le texte ne peut jamais fermer la balise <script> par erreur
  return JSON.stringify(data, null, 2).replaceAll('<', '\\u003c');
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

// Photo, savoir-faire et certifications
function checkConfig(site, root) {
  const errors = [];
  const inPublic = (file) => fs.existsSync(path.join(root, 'public', file));

  const photo = site.identite?.photo;
  if (photo && !inPublic(photo)) errors.push(`« identite.photo » pointe vers public/${photo}, qui n'existe pas.`);

  // Slugs des fiches existantes : nom des fichiers de content/realisations/
  const slugs = fs
    .readdirSync(path.join(root, 'content/realisations'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.slice(0, -3));

  const { niveaux = [], domaines = [] } = site.savoirFaire ?? {};
  for (const domaine of domaines) {
    for (const item of domaine.items ?? []) {
      const label = `savoir-faire « ${item.nom} »`;
      if (item.niveau !== null && !(Number.isInteger(item.niveau) && item.niveau >= 1 && item.niveau <= niveaux.length)) {
        errors.push(`${label} : « niveau » doit être un nombre de 1 à ${niveaux.length}, ou null.`);
      }
      if (!isTextList(item.preuves ?? [])) {
        errors.push(`${label} : « preuves » doit être une liste de slugs de fiches (ex. ['nas']).`);
        continue;
      }
      for (const slug of item.preuves ?? []) {
        if (!slugs.includes(slug)) errors.push(`${label} : la fiche « ${slug} » n'existe pas dans content/realisations/.`);
      }
    }
  }

  for (const [index, certif] of (site.certifications ?? []).entries()) {
    const label = `certification n° ${index + 1}${isFilled(certif.titre) ? ` (« ${certif.titre} »)` : ''}`;
    if (!isFilled(certif.titre)) errors.push(`${label} : « titre » est obligatoire.`);
    if (!isFilled(certif.organisme)) errors.push(`${label} : « organisme » est obligatoire.`);
    if (!CERTIFICATION_CATEGORIES.includes(certif.categorie)) {
      errors.push(`${label} : « categorie » doit valoir ${CERTIFICATION_CATEGORIES.join(', ')}.`);
    }
    if (!CERTIFICATION_STATUSES.includes(certif.statut)) {
      errors.push(`${label} : « statut » doit valoir ${CERTIFICATION_STATUSES.join(' ou ')}.`);
    }
    if (!SINGLE_DATE_PATTERN.test(String(certif.date ?? ''))) {
      errors.push(`${label} : « date » doit être au format AAAA, AAAA-MM ou AAAA-MM-JJ, entre guillemets.`);
    }
    if (certif.justificatif && !inPublic(certif.justificatif)) {
      errors.push(`${label} : le justificatif public/${certif.justificatif} n'existe pas.`);
    }
    if (certif.lien && !/^https?:\/\//.test(certif.lien)) {
      errors.push(`${label} : « lien » doit commencer par http:// ou https://.`);
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
  } else if (RESERVED_SLUGS.includes(fileSlug)) {
    errors.push(`le nom « ${fileSlug} » est réservé à une page du site : choisis-en un autre.`);
  } else if (data.slug !== fileSlug) {
    errors.push(`« slug » doit être identique au nom du fichier : slug: ${fileSlug}`);
  }

  if (data.brouillon !== undefined && typeof data.brouillon !== 'boolean') {
    errors.push('« brouillon » doit valoir true ou false.');
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
      // Dans RémiOS, l'image (capture d'écran ou schéma) est présentée dans une
      // fenêtre, avec une barre de titre : nom du fichier et « [agrandir] ».
      // La barre est décorative (aria-hidden) : le lien garde pour nom la
      // description de l'image.
      image({ href, text }) {
        images.push(href);
        const src = escapeHtml(href);
        const bar = `<span class="shot-bar" aria-hidden="true"><span class="shot-bar-name">${escapeHtml(path.posix.basename(href))}</span><span class="shot-bar-zoom">[agrandir]</span></span>`;
        return `<a class="shot shot--window" href="${src}">${bar}<img src="${src}" alt="${escapeHtml(text)}" loading="lazy" decoding="async"></a>`;
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
