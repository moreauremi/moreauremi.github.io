// =============================================================================
// Référencement : titre, description, version sans JavaScript, aperçu des
// liens partagés, données structurées, plan du site et consignes aux robots
// -----------------------------------------------------------------------------
// Tout vient de la rubrique « referencement » de content/site.config.js : une
// seule source pour tout le site.
// =============================================================================

import { execFileSync } from 'node:child_process';
import { escapeHtml } from '../../src/utils/html.js';

// Remplace titre, description et version sans JavaScript d'index.html par
// les valeurs de la configuration (une seule source pour tout le site).
export function applySeo(html, site) {
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
        <p>Ce portfolio interactif a besoin de JavaScript pour s'afficher. Version texte : ${noscriptLinks()}.</p>
        <p>Contact : ${links.join(' · ')}</p>
      </div>
    </noscript>`;
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeHtml(seo.titre)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/<noscript data-fallback>[\s\S]*?<\/noscript>/, fallback);
}

// Liens vers les pages statiques, ajoutés à la version sans JavaScript
// d'index.html : c'est par là que les robots les découvrent depuis l'accueil
function noscriptLinks() {
  return [
    ['presentation/', 'Présentation'],
    ['alternance/', 'Alternance et parcours'],
    ['realisations/', 'Réalisations'],
    ['veille/', 'Veille technologique'],
  ]
    .map(([href, label]) => `<a href="${href}">${label}</a>`)
    .join(' · ');
}

// Aperçu d'un lien partagé (LinkedIn, Teams, Discord…) : adresse de la page
// et image d'aperçu, qui doivent être des URL complètes. Même image pour
// l'accueil et les pages statiques. `base` : adresse publique, terminée par
// « / » ; `path` : dossier de la page ('' pour l'accueil). Renvoie les
// attributs de chaque balise <meta>.
export function openGraph(base, path = '') {
  return [
    { property: 'og:url', content: base + path },
    { property: 'og:image', content: `${base}og-image.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'Menu principal de RémiOS, le portfolio de Rémi Moreau' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
}

// Données structurées schema.org (JSON-LD) : le site, la page de profil et la
// personne qu'elle présente. C'est ce qui aide Google à associer le nom
// « Rémi Moreau » à ce site, à ses comptes GitHub et LinkedIn, à sa formation
// et à son entreprise. Écrites sur une seule ligne : les moteurs n'ont pas
// besoin de la mise en forme, la page est plus légère.
export function structuredData(site, base) {
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
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}

// Plan du site : l'accueil (RémiOS, dont les écrans #/… sont dans la même
// page) et les pages lisibles sans JavaScript (pages-statiques.js).
// `base` : adresse publique, terminée par « / » ; `urls` : { path, lastmod }
// de chaque page (path : dossier, '' pour l'accueil ; lastmod : vide si inconnue).
export function sitemapXml(base, urls) {
  const entries = urls
    .map(({ path, lastmod }) => {
      const date = lastmod ? `\n    <lastmod>${escapeHtml(lastmod)}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeHtml(base + path)}</loc>${date}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

// Date de la dernière modification d'une page, pour le plan du site : celle
// du dernier commit qui a touché ses fichiers sources. Google ne tient compte
// de <lastmod> que si elle suit les vraies modifications de la page (la date
// du build changerait à chaque publication). Renvoie une fonction :
// dateOf(['content/pages/veille.md', …]) → '2026-10-19T09:32:41+02:00'.
// Sans l'historique complet (dépôt récupéré en partie, image Docker, qui n'a
// pas .git), la date est vide plutôt que fausse.
export function commitDates(root) {
  const git = (...args) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try {
    if (git('rev-parse', '--is-shallow-repository') !== 'false') return () => '';
  } catch {
    return () => ''; // git absent, ou dossier hors d'un dépôt
  }
  return (files) => git('log', '-1', '--format=%cI', '--', ...files);
}

// Consignes aux robots. Le CV (docs/) n'est pas proposé aux moteurs de
// recherche : il contient un numéro de téléphone qu'il vaut mieux ne pas
// voir dans les résultats.
export function robotsTxt(base) {
  const robots = ['User-agent: *', 'Allow: /', 'Disallow: /docs/'];
  if (base) robots.push('', `Sitemap: ${base}sitemap.xml`);
  return `${robots.join('\n')}\n`;
}
