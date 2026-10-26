// =============================================================================
// Pages statiques pour les robots (moteurs de recherche et IA) et llms.txt
// -----------------------------------------------------------------------------
// RémiOS s'affiche avec JavaScript, et tous ses écrans sont dans une seule
// page (#/…). Les robots des IA (ChatGPT, Claude, Perplexity…) n'exécutent pas
// JavaScript : sans ces pages, ils ne voient qu'un titre et une phrase.
//
// Au build, les MÊMES fichiers Markdown que RémiOS deviennent donc aussi de
// vraies pages HTML, lisibles sans JavaScript :
//
//   presentation/index.html            content/pages/presentation.md
//   alternance/index.html              content/pages/alternance.md
//   realisations/index.html            liste des fiches publiées
//   realisations/<slug>/index.html     content/realisations/<slug>.md
//   veille/index.html                  content/pages/veille.md + les sujets
//   veille/<sujet>/index.html          content/veille/<sujet>/sujet.md et syntheses.md
//   llms.txt                           résumé du site et liens, pour les IA
//
// Rien à écrire à la main : modifier un Markdown, c'est modifier RémiOS ET ces
// pages au build suivant. Elles ne sont pas dans le dépôt, seulement dans
// dist/. Mêmes règles que RémiOS : une fiche « brouillon: true » n'a pas de
// page, et les repères [À COMPLÉTER] sont retirés.
//
// Un visiteur humain arrivé sur une de ces pages (depuis un moteur de
// recherche) lit le texte, et un lien en haut ouvre le même écran dans
// RémiOS. Pas de redirection automatique : Google considérerait la page comme
// une simple redirection et ne l'indexerait pas.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { renderMarkdown } from './markdown.js';
import { checkRealisation } from './realisation.js';
import { contentSecurityPolicy } from './csp.js';
import { escapeHtml, hasPlaceholder, withoutPlaceholders } from '../../src/utils/html.js';
import { formatDate } from '../../src/utils/dates.js';

// Libellés des types de fiche : les mêmes que TYPES dans src/content.js
const TYPE_LABELS = {
  entreprise: 'Réalisation en entreprise',
  formation: 'Réalisation en formation',
  perso: 'Projet personnel',
};

// Feuille de style commune aux pages (fichier à part : la politique de
// sécurité n'autorise pas les styles écrits dans la page)
export const STYLESHEET = 'pages.css';

// Site publié : en-tête sans repères [À COMPLÉTER]. Une techno « [À COMPLÉTER] »
// sort de la liste, un statut ou une date à compléter devient vide.
export function withoutMetaPlaceholders(meta) {
  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => {
      if (typeof value === 'string') return [key, withoutPlaceholders(value)];
      if (Array.isArray(value)) return [key, value.filter((item) => !hasPlaceholder(item))];
      return [key, value];
    }),
  );
}

const SHOT_BAR = /<span class="shot-bar" aria-hidden="true">[\s\S]*?<\/span><\/span>/g;

// Un fichier Markdown → { meta, html }, comme dans le site publié
function readMarkdown(root, file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return null;
  const { data, content } = matter(fs.readFileSync(full, 'utf8'));
  // Sans la barre de titre décorative des captures (nom du fichier,
  // « [agrandir] ») : un robot la lirait comme du texte
  const html = renderMarkdown(content, { hidePlaceholders: true }).html.replace(SHOT_BAR, '');
  return { data, html };
}

// Fiches publiées (sans les brouillons), les plus récentes d'abord, comme dans RémiOS
function readRealisations(root, site) {
  const dir = path.join(root, 'content', 'realisations');
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const file = `content/realisations/${name}`;
      const { data, html } = readMarkdown(root, file);
      const meta = withoutMetaPlaceholders(checkRealisation(data, file, site, []));
      return { ...meta, html };
    })
    .filter((r) => !r.brouillon)
    .sort((a, b) => {
      const dated = Number(/^\d{4}/.test(b.date)) - Number(/^\d{4}/.test(a.date));
      if (dated !== 0) return dated;
      return String(b.date).split('/').pop().localeCompare(String(a.date).split('/').pop());
    });
}

// Texte brut, court, pour les descriptions (balise meta, llms.txt)
function plainText(html, max = 300) {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;|&#39;/g, (m) => (m === '&quot;' ? '"' : "'"))
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text;
}

// Description d'une page (balise meta, llms.txt) : « description » de
// l'en-tête du Markdown si elle existe, sinon le début du texte, pris dans
// les paragraphes seulement. Les titres de section en sont exclus : sinon
// « L'entreprise : 1Life » se collerait au paragraphe qui suit, et c'est ce
// texte que Google afficherait dans ses résultats.
export function describe(html, data = {}, max = 160) {
  if (typeof data.description === 'string' && data.description.trim()) return data.description.trim();
  const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => plainText(m[1], 10000)).filter(Boolean);
  let text = '';
  for (const p of paragraphs) {
    text = text ? `${text} ${p}` : p;
    if (text.length >= max) break;
  }
  if (text.length <= max) return text;
  // Trop long : couper de préférence à la fin d'une phrase
  const end = text.slice(0, max).lastIndexOf('. ');
  return end >= 90 ? text.slice(0, end + 1) : plainText(text, max);
}

// Toutes les pages à fabriquer : { path, titre, description, html, ecran }
// path : dossier de la page (« realisations/rmutils/ ») ; ecran : adresse du
// même écran dans RémiOS (« #/realisations/rmutils »).
export function collectPages(root, site) {
  const pages = [];
  const page = (name) => readMarkdown(root, `content/pages/${name}.md`);

  const presentation = page('presentation');
  if (presentation) {
    pages.push({
      path: 'presentation/',
      titre: presentation.data.titre ?? 'Présentation',
      // Pas la description de l'accueil : Google préfère une description par page
      description: describe(presentation.html, presentation.data),
      html: presentation.html,
      ecran: '#/presentation',
    });
  }

  const alternance = page('alternance');
  if (alternance) {
    pages.push({
      path: 'alternance/',
      titre: alternance.data.titre ?? 'Alternance',
      description: describe(alternance.html, alternance.data),
      html: alternance.html,
      ecran: '#/alternance',
    });
  }

  const realisations = readRealisations(root, site);
  const competence = (code) => site.competences.find((c) => c.code === code)?.libelle ?? code;
  pages.push({
    path: 'realisations/',
    titre: 'Réalisations',
    description: `Les ${realisations.length} réalisations de Rémi Moreau : projets en entreprise (1Life), en formation (BTS SIO SISR) et projets personnels.`,
    html: `<ul class="liste">${realisations
      .map((r) => `<li><a href="realisations/${escapeHtml(r.slug)}/">${escapeHtml(r.titre)}</a> <span class="type">${escapeHtml(TYPE_LABELS[r.type])}</span>${r.resume ? `<br>${escapeHtml(r.resume)}` : ''}</li>`)
      .join('')}</ul>`,
    ecran: '#/realisations',
  });
  for (const r of realisations) {
    const rows = [
      ['Type', TYPE_LABELS[r.type]],
      ['Date', r.date && formatDate(r.date)],
      ['Statut', r.statut],
      ['Technologies', r.technos.join(', ')],
      ['Compétences', r.competences.map((code) => `${code} ${competence(code)}`).join(' ; ')],
    ].filter(([, value]) => value);
    pages.push({
      path: `realisations/${r.slug}/`,
      titre: r.titre,
      description: r.resume || describe(r.html),
      resume: r.resume,
      html: `<dl class="fiche">${rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join('')}</dl>${r.html}`,
      ecran: `#/realisations/${r.slug}`,
      realisation: true,
    });
  }

  const sujets = site.veille?.sujets ?? [];
  const veille = page('veille');
  if (veille) {
    pages.push({
      path: 'veille/',
      titre: veille.data.titre ?? 'Veille technologique',
      description: describe(veille.html, veille.data),
      html: `${veille.html}<h2>Sujets suivis</h2><ul class="liste">${sujets
        .map((s) => `<li><a href="veille/${escapeHtml(s.id)}/">${escapeHtml(s.nom)}</a> : ${escapeHtml(s.sujet ?? '')}</li>`)
        .join('')}</ul>`,
      ecran: '#/veille',
    });
  }
  for (const s of sujets) {
    const pourquoi = readMarkdown(root, `content/veille/${s.id}/sujet.md`);
    const syntheses = readMarkdown(root, `content/veille/${s.id}/syntheses.md`);
    pages.push({
      path: `veille/${s.id}/`,
      titre: `Veille : ${s.sujet ?? s.nom}`,
      description: pourquoi ? describe(pourquoi.html, pourquoi.data) : s.sujet ?? s.nom,
      html: `${pourquoi?.html ?? ''}<h2>Mes synthèses</h2>${syntheses?.html || '<p>À venir.</p>'}`,
      ecran: `#/veille/${s.id}`,
    });
  }
  return pages;
}

// Une page complète. `base` : adresse publique du site (pour l'adresse
// canonique), ou '' si elle n'est pas renseignée.
export function renderPage(page, site, base) {
  const depth = page.path.split('/').filter(Boolean).length;
  const toRoot = '../'.repeat(depth) || './';
  const { nom } = site.identite;
  const { email, github, linkedin } = site.contact;
  const nav = [
    ['presentation/', 'Présentation'],
    ['alternance/', 'Alternance'],
    ['realisations/', 'Réalisations'],
    ['veille/', 'Veille'],
  ]
    .map(([href, label]) => `<a href="${href}"${page.path === href ? ' aria-current="page"' : ''}>${label}</a>`)
    .join(' · ');
  // Fil d'Ariane : RémiOS, puis la rubrique (« realisations/ ») pour une page
  // de second niveau, puis la page elle-même
  const parent = page.path.split('/').filter(Boolean).length > 1 ? `${page.path.split('/')[0]}/` : null;
  const parentLabel = { realisations: 'Réalisations', veille: 'Veille' }[parent?.slice(0, -1)];
  const crumbs = [
    '<li><a href="./">RémiOS</a></li>',
    parent ? `<li><a href="${parent}">${parentLabel}</a></li>` : '',
    `<li><span aria-current="page">${escapeHtml(page.titre)}</span></li>`,
  ].join('');
  const canonical = base ? `\n<link rel="canonical" href="${escapeHtml(base + page.path)}">` : '';
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<base href="${toRoot}">
<meta http-equiv="Content-Security-Policy" content="${escapeHtml(contentSecurityPolicy(site))}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(`${page.titre} · ${nom}`)}</title>
<meta name="description" content="${escapeHtml(page.description)}">${canonical}
<meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${STYLESHEET}">
</head>
<body>
<header>
<p class="bandeau">Version texte du portfolio de <a href="presentation/">${escapeHtml(nom)}</a>, étudiant en BTS SIO SISR. <a href="${escapeHtml(page.ecran)}">Ouvrir dans RémiOS, la version interactive →</a></p>
<nav>${nav}</nav>
</header>
<main>
<nav class="ariane" aria-label="Fil d'Ariane"><ol>${crumbs}</ol></nav>
<article>
<h1>${escapeHtml(page.titre)}</h1>
${page.html}
</article>
</main>
<footer>
<p>${escapeHtml(nom)} · <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a> · <a href="${escapeHtml(github)}">GitHub</a> · <a href="${escapeHtml(linkedin)}">LinkedIn</a> · <a href="./">RémiOS</a></p>
</footer>
</body>
</html>
`;
}

// llms.txt (format proposé sur llmstxt.org) : qui je suis, puis les pages du
// site avec une ligne de description. Adresses complètes si urlPublique est
// renseignée, sinon relatives.
export function llmsTxt(pages, site, base) {
  const seo = site.referencement ?? {};
  const line = (p) => `- [${p.titre}](${base}${p.path}): ${p.description}`;
  const section = (titre, list) => (list.length ? [`## ${titre}`, '', ...list.map(line), ''] : []);
  return [
    `# ${site.identite.nom}`,
    '',
    `> ${seo.description ?? ''}`,
    '',
    ...(seo.poste ? [`Poste : ${seo.poste}${seo.entreprise ? ` chez ${seo.entreprise}${seo.groupe ? ` (groupe ${seo.groupe})` : ''}` : ''}.`] : []),
    ...(seo.ecole ? [`Formation : BTS SIO option SISR, ${seo.ecole}.`] : []),
    ...(seo.domaines?.length ? [`Domaines : ${seo.domaines.join(', ')}.`] : []),
    `Contact : ${site.contact.email} · GitHub : ${site.contact.github} · LinkedIn : ${site.contact.linkedin}`,
    '',
    ...section('Profil', pages.filter((p) => ['presentation/', 'alternance/'].includes(p.path))),
    ...section('Réalisations', pages.filter((p) => p.realisation)),
    ...section('Veille technologique', pages.filter((p) => p.path.startsWith('veille/'))),
  ].join('\n');
}

// Feuille de style des pages : sobre et lisible, aux couleurs de RémiOS
export const STYLES = `:root{color-scheme:light dark;--fond:#fbfbf8;--texte:#1d1f21;--doux:#5c6166;--lien:#0b6e4f;--trait:#d9d9d4}
@media (prefers-color-scheme:dark){:root{--fond:#14161a;--texte:#e6e6e3;--doux:#9aa0a6;--lien:#5fd3a2;--trait:#2c3036}}
*{box-sizing:border-box}
body{margin:0;background:var(--fond);color:var(--texte);font:17px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header,main,footer{max-width:46rem;margin:0 auto;padding:0 1rem}
a{color:var(--lien)}
.bandeau{margin:0;padding:.75rem 0;border-bottom:1px solid var(--trait);font-size:.9rem;color:var(--doux)}
nav{padding:.6rem 0;font-size:.95rem}
nav a[aria-current]{font-weight:600;text-decoration:none}
.ariane ol{display:flex;flex-wrap:wrap;margin:1rem 0 0;padding:0;list-style:none;font-size:.9rem;color:var(--doux)}
.ariane li+li::before{content:"/";content:"/"/"";margin:0 .5ch}
h1{font-size:1.8rem;line-height:1.25;margin:1.5rem 0 1rem}
h2{font-size:1.3rem;margin-top:2rem;border-bottom:1px solid var(--trait);padding-bottom:.25rem}
img{max-width:100%;height:auto}
pre{overflow-x:auto;padding:.75rem;border:1px solid var(--trait);font-size:.85rem}
code{font-family:ui-monospace,Consolas,monospace}
table{border-collapse:collapse;display:block;overflow-x:auto}
th,td{border:1px solid var(--trait);padding:.3rem .5rem;text-align:left}
dl.fiche{display:grid;grid-template-columns:max-content 1fr;gap:.25rem 1rem;margin:0 0 1.5rem;font-size:.95rem}
dl.fiche dt{color:var(--doux)}dl.fiche dd{margin:0}
.liste li{margin-bottom:.75rem}.type{color:var(--doux);font-size:.85rem}
footer{margin-top:3rem;padding:1rem;border-top:1px solid var(--trait);font-size:.9rem;color:var(--doux)}
`;

// Liens vers les pages statiques, ajoutés à la version sans JavaScript
// d'index.html : c'est par là que les robots les découvrent depuis l'accueil
export function noscriptLinks() {
  return [
    ['presentation/', 'Présentation'],
    ['alternance/', 'Alternance et parcours'],
    ['realisations/', 'Réalisations'],
    ['veille/', 'Veille technologique'],
  ]
    .map(([href, label]) => `<a href="${href}">${label}</a>`)
    .join(' · ');
}
