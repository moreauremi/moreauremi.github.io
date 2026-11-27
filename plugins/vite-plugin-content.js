// =============================================================================
// Plugin Vite « site-content » : fabrique les pages du site depuis content/
// -----------------------------------------------------------------------------
// index.html est le cadre commun de toutes les pages (balises <head>, police,
// CSS et JavaScript). Ce plugin y insère, pour chaque page, son titre, ses
// balises de référencement et son contenu (plugins/content/pages.js), à la
// place du repère <!--site:body-->.
//
//   - `npm run dev` : chaque page est fabriquée à la demande, à partir des
//     fichiers du moment ; les brouillons sont visibles, les repères
//     [À COMPLÉTER] surlignés.
//   - `npm run build` : toutes les pages sont écrites dans dist/, avec la
//     politique de sécurité (CSP), le plan du site, robots.txt et les pages
//     de redirection des anciennes adresses. Brouillons et repères retirés.
//
// Le terminal caché reçoit son contenu par le module virtual:site-data,
// téléchargé seulement à sa première ouverture.
//
// Si une fiche est mal remplie, le build s'arrête avec un message en français
// qui indique le fichier et ce qu'il faut corriger.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { loadSite, ContentError } from './content/site.js';
import { sitePages, redirectPages, terminalData } from './content/pages.js';
import { headTags, structuredData, sitemapXml, robotsTxt } from './content/seo.js';
import { contentSecurityPolicy, cspHash, inlineStyleHashes, checkNginxPolicy, NGINX_HEADERS_FILE } from './content/csp.js';
import { loadSiteConfig } from './content/config.js';
import { formatErrors } from './content/utils.js';
import { escapeHtml } from '../src/utils/html.js';
import { publicBase } from '../src/utils/url.js';

const VIRTUAL_ID = 'virtual:site-data';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const BODY_MARK = '<!--site:body-->';

// Préfixe des liens internes d'une page selon sa profondeur :
// accueil « ./ », projets/ « ../ », projets/glpi/ « ../../ »
const prefixOf = (depth) => (depth ? '../'.repeat(depth) : './');

// Liens internes écrits depuis la racine (« ./… ») → relatifs à la page
function relocate(html, depth) {
  if (!depth) return html;
  return html.replace(/(\s(?:href|src)=")\.\//g, `$1${prefixOf(depth)}`);
}

// Insère une page dans le cadre (index.html)
// `config` : adresse publique et GoatCounter, lus par src/main.js (mesure d'audience)
function fill(shell, page, config, extraHead = '') {
  if (!shell.includes(BODY_MARK)) throw new Error(`index.html : le repère ${BODY_MARK} est introuvable.`);
  const attrs = [
    `data-root="${prefixOf(page.depth)}"`,
    `data-page="${escapeHtml(page.path)}"`,
    config.urlPublique ? `data-site="${escapeHtml(config.urlPublique)}"` : '',
    config.audience?.goatcounter ? `data-goatcounter="${escapeHtml(config.audience.goatcounter)}"` : '',
  ].filter(Boolean);
  const html = shell
    .replace('<html lang="fr">', () => `<html lang="fr" ${attrs.join(' ')}>`)
    .replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(page.title)}</title>`)
    .replace('</head>', () => `${extraHead}\n  </head>`)
    .replace(BODY_MARK, () => page.body);
  return relocate(html, page.depth);
}

// Petite page qui renvoie vers la nouvelle adresse d'une ancienne page.
// Pas de script : une balise meta refresh, et un lien pour les autres cas.
function redirectHtml({ target, depth }, base) {
  const href = prefixOf(depth) + target;
  const canonical = base ? `\n    <link rel="canonical" href="${escapeHtml(base + target)}">` : '';
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <title>page déplacée</title>
    <meta name="robots" content="noindex">
    <meta http-equiv="refresh" content="0; url=${escapeHtml(href)}">${canonical}
  </head>
  <body>
    <p>cette page a changé d'adresse : <a href="${escapeHtml(href)}">${escapeHtml(href)}</a></p>
  </body>
</html>
`;
}

// Balise CSP en tête de <head> ; commentaires, espaces en fin de ligne et
// lignes vides en trop (laissées par les blocs facultatifs des gabarits) retirés
function finalize(html, config, scriptHashes = []) {
  const withoutComments = html
    .replace(/\s*<!--[\s\S]*?-->/g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
  const csp = contentSecurityPolicy(config, { scriptHashes, styleHashes: inlineStyleHashes(withoutComments) });
  return withoutComments.replace(
    /<head>/,
    () => `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}">\n    <meta name="referrer" content="strict-origin-when-cross-origin">`,
  );
}

export default function contentPlugin() {
  let root = process.cwd();
  let isDev = false;

  async function load() {
    try {
      return await loadSite(root, { dev: isDev });
    } catch (error) {
      if (error instanceof ContentError) error.message = error.message.trim();
      throw error;
    }
  }

  function headFor(page, site, base) {
    let head = `    ${headTags(page, base)}`;
    let jsonLd = '';
    if (page.path === '' && base) {
      jsonLd = structuredData(site.config, base);
      head += `\n    <script type="application/ld+json">${jsonLd}</script>`;
    }
    if (base && fs.existsSync(path.join(root, 'public', 'og-image.png'))) {
      head += `\n    <meta property="og:image" content="${base}og-image.png">\n    <meta name="twitter:card" content="summary_large_image">`;
    }
    return { head, jsonLd };
  }

  return {
    name: 'site-content',

    configResolved(config) {
      root = config.root;
      isDev = config.command === 'serve';
    },

    // Contenu et configuration vérifiés au démarrage (dev et build), et
    // politique de sécurité identique dans nginx et dans les pages
    async buildStart() {
      try {
        await load();
      } catch (error) {
        this.error(error.message);
      }
      const config = await loadSiteConfig(root);
      const headerErrors = checkNginxPolicy(config, root);
      if (headerErrors.length) this.error(formatErrors(NGINX_HEADERS_FILE, headerErrors));
    },

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    async load(id) {
      if (id !== RESOLVED_ID) return null;
      const site = await load();
      return `export default ${JSON.stringify(terminalData(site))};`;
    },

    // --- Développement : pages fabriquées à la demande -------------------------
    configureServer(server) {
      const contentDir = path.join(root, 'content');
      server.watcher.add(contentDir);
      server.watcher.on('change', (file) => {
        if (!path.resolve(file).startsWith(contentDir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      });

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        const url = new URL(req.url, 'http://localhost');
        let rel = decodeURIComponent(url.pathname).replace(/^\//, '');
        if (rel === 'index.html') rel = '';
        if (rel.endsWith('/index.html')) rel = rel.slice(0, -'index.html'.length);
        if (rel && !rel.endsWith('/') && path.extname(rel)) return next(); // fichier (CSS, image…)

        let site;
        try {
          site = await load();
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.end(`<pre style="white-space:pre-wrap;font:14px monospace;padding:2rem">${escapeHtml(error.message)}</pre>`);
        }
        const base = publicBase(site.config.urlPublique);
        const pages = sitePages(site, base);

        if (rel && !rel.endsWith('/') && pages.some((p) => p.path === `${rel}/`)) {
          res.statusCode = 301;
          res.setHeader('Location', `/${rel}/${url.search}`);
          return res.end();
        }
        const redirect = redirectPages(site).find((r) => r.path === rel);
        if (redirect && !pages.some((p) => p.path === rel)) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.end(redirectHtml(redirect, base));
        }
        const page = pages.find((p) => p.path === rel);
        if (!page) return next();

        try {
          const shell = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
          const { head } = headFor(page, site, base);
          const html = await server.transformIndexHtml(req.originalUrl ?? req.url, fill(shell, page, site.config, head));
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (error) {
          next(error);
        }
      });
    },

    // --- Build : toutes les pages, à partir du cadre construit par Vite -------
    generateBundle: {
      order: 'post',
      async handler(_, bundle) {
        let site;
        try {
          site = await load();
        } catch (error) {
          this.error(error.message);
        }
        const { config } = site;
        const base = publicBase(config.urlPublique);
        const shell = bundle['index.html']?.source;
        if (typeof shell !== 'string') this.error('index.html absent du build.');

        const pages = sitePages(site, base);
        for (const page of pages) {
          const { head, jsonLd } = headFor(page, site, base);
          const html = finalize(fill(shell, page, site.config, head), config, jsonLd ? [cspHash(jsonLd)] : []);
          if (page.path === '') bundle['index.html'].source = html;
          else this.emitFile({ type: 'asset', fileName: `${page.path}index.html`, source: html });
        }

        // Pages d'erreur (404, 403, 503) : même politique de sécurité
        for (const name of ['404.html', '403.html', '503.html']) {
          if (typeof bundle[name]?.source === 'string') bundle[name].source = finalize(bundle[name].source, config);
        }

        const published = new Set(pages.map((p) => p.path));
        for (const redirect of redirectPages(site)) {
          if (published.has(redirect.path)) continue;
          this.emitFile({ type: 'asset', fileName: `${redirect.path}index.html`, source: redirectHtml(redirect, base) });
        }

        if (base) {
          const today = new Date().toISOString().slice(0, 10);
          const indexed = pages.filter((p) => !p.noindex).map((p) => p.path);
          this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(base, today, indexed) });
        }
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(base) });
      },
    },
  };
}
