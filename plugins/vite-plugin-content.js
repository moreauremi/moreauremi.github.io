// =============================================================================
// Plugin Vite « remios-content » : transforme le Markdown en modules JavaScript
// -----------------------------------------------------------------------------
// Chaque fichier .md de content/ devient, au moment du build, un module :
//
//   content/realisations/nas.md          →  export default { meta, html }
//   content/realisations/nas.md?source   →  export default '…texte source…'
//
//   - meta   : le frontmatter (bloc entre --- en tête de fichier), vérifié ;
//   - html   : le corps du fichier converti en HTML ;
//   - source : le texte source sans commentaires, affiché par `cat` dans le
//              terminal. Module à part : il n'est téléchargé qu'avec le
//              terminal, à sa première ouverture.
//
// Une fiche marquée « brouillon: true » est visible avec `npm run dev`, mais
// absente du site publié : au build, ses modules sont vides (null), et son
// texte n'apparaît nulle part dans les fichiers envoyés aux visiteurs.
//
// gray-matter (lecture du frontmatter) et marked (Markdown → HTML) ne tournent
// que sur la machine qui fabrique le site : le navigateur reçoit du HTML déjà
// prêt et n'a aucune bibliothèque à télécharger.
//
// Si une fiche est mal remplie, le build s'arrête avec un message en français
// qui indique le fichier et ce qu'il faut corriger.
//
// Le plugin s'appuie sur les modules de plugins/content/ :
//   config.js       lecture et vérification de la configuration et de la veille
//   realisation.js  vérification d'une fiche
//   markdown.js     conversion Markdown → HTML
//   seo.js          référencement (titre, données structurées, sitemap, robots)
//   csp.js          politique de sécurité du contenu
// =============================================================================

import path from 'node:path';
import matter from 'gray-matter';
import { publicBase } from '../src/utils/url.js';
import { CONFIG_FILE, VEILLE_FILE, loadSiteConfig, checkDocuments, checkConfig, checkVeille } from './content/config.js';
import { contentSecurityPolicy, cspHash, inlineStyleHashes, checkNginxPolicy, NGINX_HEADERS_FILE } from './content/csp.js';
import { renderMarkdown, stripComments } from './content/markdown.js';
import { checkRealisation, checkImage } from './content/realisation.js';
import { applySeo, structuredData, sitemapXml, robotsTxt } from './content/seo.js';
import { formatErrors, toPosix } from './content/utils.js';

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
    // les compétences ne peuvent renvoyer qu'à des fiches existantes, et nginx
    // doit annoncer la même politique de sécurité que les pages.
    async buildStart() {
      const site = await loadSiteConfig(root);
      const errors = [...checkDocuments(site, root), ...checkConfig(site, root)];
      if (errors.length) this.error(formatErrors(CONFIG_FILE, errors));
      // Actualités écrites chaque semaine par scripts/veille.mjs
      const veilleErrors = checkVeille(root);
      if (veilleErrors.length) this.error(formatErrors(VEILLE_FILE, veilleErrors));
      const headerErrors = checkNginxPolicy(site, root);
      if (headerErrors.length) this.error(formatErrors(NGINX_HEADERS_FILE, headerErrors));
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

      // Aperçus de lien et données structurées : page du site seulement
      const url = site.urlPublique;
      let jsonLd = '';
      if (isMainPage && url) {
        if (!/^https?:\/\//.test(url)) {
          this.error(formatErrors(CONFIG_FILE, ['« urlPublique » doit commencer par http:// ou https://']));
        }
        const base = publicBase(url);
        const meta = (attrs) => ({ tag: 'meta', attrs, injectTo: 'head' });
        jsonLd = structuredData(site, base);
        tags.push(
          { tag: 'link', attrs: { rel: 'canonical', href: base }, injectTo: 'head' },
          meta({ property: 'og:url', content: base }),
          meta({ property: 'og:image', content: `${base}og-image.png` }),
          meta({ property: 'og:image:width', content: '1200' }),
          meta({ property: 'og:image:height', content: '630' }),
          meta({ property: 'og:image:alt', content: 'Menu principal de RémiOS, le portfolio de Rémi Moreau' }),
          meta({ name: 'twitter:card', content: 'summary_large_image' }),
          // Données structurées : fiche « personne » lue par les moteurs de recherche
          { tag: 'script', attrs: { type: 'application/ld+json' }, children: jsonLd, injectTo: 'head' },
        );
      }

      // Au build seulement :
      //  - les commentaires HTML (explications destinées à qui lit le code
      //    source) sont retirés des pages publiées ;
      //  - politique de sécurité (CSP) en balise meta : GitHub Pages ne permet
      //    pas d'envoyer des en-têtes HTTP (la version Docker les envoie via
      //    nginx). Pas en développement : Vite y insère des styles à la volée,
      //    qu'une politique aussi stricte bloquerait.
      // Les données structurées sont un bloc <script> écrit dans la page : le
      // navigateur ne l'exécute pas, mais la CSP l'autorise quand même
      // explicitement, par son empreinte (le validateur du W3C le demande).
      if (!context.server) {
        html = html.replace(/\s*<!--[\s\S]*?-->/g, '');
        const csp = contentSecurityPolicy(site, {
          scriptHashes: jsonLd ? [cspHash(jsonLd)] : [],
          styleHashes: inlineStyleHashes(html),
        });
        tags.push(
          { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' },
          { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head' },
        );
      }

      return { html, tags };
    },

    // Au build : plan du site (sitemap.xml) et consignes aux robots (robots.txt)
    async generateBundle() {
      const site = await loadSiteConfig(root);
      const base = publicBase(site.urlPublique);
      if (base) {
        const today = new Date().toISOString().slice(0, 10);
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(base, today) });
      }
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(base) });
    },

    // Appelé par Vite pour chaque fichier importé : on ne traite que les .md de content/
    async transform(source, id) {
      const [filePath, query = ''] = id.split('?');
      if (!filePath.endsWith('.md')) return null;
      const file = toPosix(path.relative(root, filePath));
      if (!file.startsWith('content/')) return null;

      // Texte source pour le terminal (`cat`). Brouillon : publié seulement
      // en développement, comme la fiche elle-même.
      if (new URLSearchParams(query).has('source')) {
        const text = matter(source).data.brouillon && !isDev ? null : stripComments(source);
        return { code: `export default ${JSON.stringify(text)};`, map: null };
      }

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

      return { code: `export default ${JSON.stringify({ meta, html })};`, map: null };
    },
  };
}
