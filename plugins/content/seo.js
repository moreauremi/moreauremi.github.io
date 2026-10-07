// =============================================================================
// Référencement : titre, description, version sans JavaScript, données
// structurées, plan du site et consignes aux robots
// -----------------------------------------------------------------------------
// Tout vient de la rubrique « referencement » de content/site.config.js : une
// seule source pour tout le site.
// =============================================================================

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

// Plan du site : le site n'a qu'une page réelle (les écrans #/… sont dans la
// même page). `base` : adresse publique, terminée par « / ».
export function sitemapXml(base, lastmod) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
</urlset>
`;
}

// Consignes aux robots. Le CV (docs/) n'est pas proposé aux moteurs de
// recherche : il contient un numéro de téléphone qu'il vaut mieux ne pas
// voir dans les résultats.
export function robotsTxt(base) {
  const robots = ['User-agent: *', 'Allow: /', 'Disallow: /docs/'];
  if (base) robots.push('', `Sitemap: ${base}sitemap.xml`);
  return `${robots.join('\n')}\n`;
}
