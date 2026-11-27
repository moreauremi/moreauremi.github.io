// =============================================================================
// Référencement : balises de chaque page, données structurées, plan du site
// =============================================================================

import { escapeHtml } from '../../src/utils/html.js';

// Balises <head> propres à une page : description, adresse canonique, aperçus
// de lien (Open Graph). `base` vide : seulement la description.
export function headTags(page, base) {
  const tags = [`<meta name="description" content="${escapeHtml(page.description)}">`];
  if (page.noindex) tags.push('<meta name="robots" content="noindex">');
  if (base) {
    const url = base + page.path;
    tags.push(
      `<link rel="canonical" href="${escapeHtml(url)}">`,
      '<meta property="og:type" content="website">',
      '<meta property="og:locale" content="fr_FR">',
      `<meta property="og:url" content="${escapeHtml(url)}">`,
      `<meta property="og:title" content="${escapeHtml(page.title)}">`,
      `<meta property="og:description" content="${escapeHtml(page.description)}">`,
    );
  }
  return tags.join('\n    ');
}

// Fiche « personne » lue par les moteurs de recherche (accueil seulement)
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
      { '@type': 'WebSite', '@id': `${base}#site`, url: base, name: `portfolio de ${site.identite.nom}`, inLanguage: 'fr-FR' },
      { '@type': 'ProfilePage', '@id': `${base}#page`, url: base, name: seo.titre, inLanguage: 'fr-FR', isPartOf: { '@id': `${base}#site` }, mainEntity: { '@id': `${base}#personne` } },
      person,
    ],
  };
  // « < » échappé : le texte ne peut pas fermer la balise <script> qui le contient
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}

export function sitemapXml(base, lastmod, paths = []) {
  const urls = paths
    .map((p) => `  <url>\n    <loc>${escapeHtml(base + p)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

// Le dossier docs/ (CV avec numéro de téléphone, documents de TP) est écarté
// des moteurs de recherche.
export function robotsTxt(base) {
  const robots = ['User-agent: *', 'Allow: /', 'Disallow: /docs/'];
  if (base) robots.push('', `Sitemap: ${base}sitemap.xml`);
  return `${robots.join('\n')}\n`;
}
