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
// Version anglaise : les mêmes pages sous en/ (en/presentation/…), à partir
// des traductions (<nom>.en.md). Une page dont le texte n'est pas encore
// traduit n'a pas de version anglaise : les listes anglaises renvoient alors
// à la page française. Chaque page indique sa version dans l'autre langue
// (balises hreflang), pour que les moteurs proposent la bonne.
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
import { frenchFileOf } from './translation.js';
import { escapeHtml, hasPlaceholder, withoutPlaceholders } from '../../src/utils/html.js';
import { formatDate } from '../../src/utils/dates.js';
import { localizeConfig } from '../../src/utils/lang.js';

// Libellés des types de fiche : les mêmes que TYPES dans src/content.js
const TYPE_LABELS = {
  fr: { entreprise: 'Réalisation en entreprise', formation: 'Réalisation en formation', perso: 'Projet personnel' },
  en: { entreprise: 'Work project', formation: 'School project', perso: 'Personal project' },
};

// Texte dans la langue d'une page
const inLang = (lang) => (fr, en) => (lang === 'en' ? en : fr);

// Début des adresses des pages, et des écrans de RémiOS, dans une langue
const pathStart = (lang) => (lang === 'en' ? 'en/' : '');
const screenStart = (lang) => (lang === 'en' ? '#/en/' : '#/');

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

// Un fichier Markdown → { data, html, lang }, comme dans le site publié.
// En anglais : la traduction (<nom>.en.md) si elle existe, avec l'en-tête du
// fichier français complété par ses champs traduits ; sinon le français.
// `lang` : langue réelle du texte.
function readMarkdown(root, file, lang = 'fr') {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return null;
  const french = matter(fs.readFileSync(full, 'utf8'));
  const translation = path.join(root, file.replace(/\.md$/, '.en.md'));
  const english = lang === 'en' && fs.existsSync(translation) ? matter(fs.readFileSync(translation, 'utf8')) : null;
  const { content } = english ?? french;
  const data = { ...french.data, ...english?.data };
  const textLang = english ? 'en' : 'fr';
  // Sans la barre de titre décorative des captures (nom du fichier,
  // « [agrandir] ») : un robot la lirait comme du texte
  const html = renderMarkdown(content, { hidePlaceholders: true, lang: textLang }).html.replace(SHOT_BAR, '');
  return { data, html, lang: textLang };
}

// Fiches publiées (sans les brouillons), les plus récentes d'abord, comme dans RémiOS
function readRealisations(root, site, lang) {
  const dir = path.join(root, 'content', 'realisations');
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md') && !name.endsWith('.en.md'))
    .map((name) => {
      const file = `content/realisations/${name}`;
      const { data, html, lang: textLang } = readMarkdown(root, file, lang);
      const meta = withoutMetaPlaceholders(checkRealisation(data, frenchFileOf(file), site, []));
      return { ...meta, html, lang: textLang };
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

// Toutes les pages à fabriquer dans une langue : { path, key, lang, titre,
// description, html, ecran }.
//   path  : dossier de la page (« realisations/rmutils/ », « en/realisations/rmutils/ ») ;
//   key   : le même pour les deux langues (« realisations/rmutils/ ») : relie
//           une page à sa version dans l'autre langue ;
//   ecran : adresse du même écran dans RémiOS (« #/realisations/rmutils »).
// En anglais, seules les pages dont le texte est traduit sont fabriquées.
export function collectPages(root, rawSite, lang = 'fr') {
  const t = inLang(lang);
  const site = localizeConfig(rawSite, lang);
  const start = pathStart(lang);
  const screen = screenStart(lang);
  const pages = [];
  const translated = (doc) => doc && (lang === 'fr' || doc.lang === 'en');
  const add = (key, page) => pages.push({ ...page, key, path: start + key, lang });
  const page = (name) => readMarkdown(root, `content/pages/${name}.md`, lang);

  const presentation = page('presentation');
  if (translated(presentation)) {
    add('presentation/', {
      titre: presentation.data.titre ?? t('Présentation', 'About me'),
      // Pas la description de l'accueil : Google préfère une description par page
      description: describe(presentation.html, presentation.data),
      html: presentation.html,
      ecran: `${screen}presentation`,
    });
  }

  const alternance = page('alternance');
  if (translated(alternance)) {
    add('alternance/', {
      titre: alternance.data.titre ?? t('Alternance', 'Work-study'),
      description: describe(alternance.html, alternance.data),
      html: alternance.html,
      ecran: `${screen}alternance`,
    });
  }

  // Fiches : en anglais, celles qui ne sont pas traduites renvoient à leur page française
  const realisations = readRealisations(root, rawSite, lang);
  const ficheHref = (r) => `${translated(r) ? start : ''}realisations/${escapeHtml(r.slug)}/`;
  const competence = (code) => site.competences.find((c) => c.code === code)?.libelle ?? code;
  add('realisations/', {
    titre: t('Réalisations', 'Projects'),
    description: t(
      `Les ${realisations.length} réalisations de ${site.identite.nom} : projets en entreprise (1Life), en formation (BTS SIO SISR) et projets personnels.`,
      `The ${realisations.length} projects of ${site.identite.nom}: work projects (1Life), school projects (BTS SIO SISR) and personal projects.`,
    ),
    html: `<ul class="liste">${realisations
      .map((r) => `<li${r.lang !== lang ? ` lang="${r.lang}"` : ''}><a href="${ficheHref(r)}">${escapeHtml(r.titre)}</a> <span class="type">${escapeHtml(TYPE_LABELS[lang][r.type])}</span>${r.resume ? `<br>${escapeHtml(r.resume)}` : ''}</li>`)
      .join('')}</ul>`,
    ecran: `${screen}realisations`,
  });
  for (const r of realisations.filter(translated)) {
    const rows = [
      ['Type', TYPE_LABELS[lang][r.type]],
      ['Date', r.date && formatDate(r.date, lang)],
      [t('Statut', 'Status'), r.statut],
      [t('Technologies', 'Technologies'), r.technos.join(', ')],
      [t('Compétences', 'Skills'), r.competences.map((code) => `${code} ${competence(code)}`).join(t(' ; ', '; '))],
    ].filter(([, value]) => value);
    add(`realisations/${r.slug}/`, {
      titre: r.titre,
      description: r.resume || describe(r.html),
      resume: r.resume,
      html: `<dl class="fiche">${rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join('')}</dl>${r.html}`,
      ecran: `${screen}realisations/${r.slug}`,
      realisation: true,
    });
  }

  const sujets = site.veille?.sujets ?? [];
  const sujetPages = sujets.map((s) => ({
    sujet: s,
    pourquoi: readMarkdown(root, `content/veille/${s.id}/sujet.md`, lang),
    syntheses: readMarkdown(root, `content/veille/${s.id}/syntheses.md`, lang),
  }));
  const sujetHref = ({ sujet, pourquoi }) => `${translated(pourquoi) ? start : ''}veille/${escapeHtml(sujet.id)}/`;
  const veille = page('veille');
  if (translated(veille)) {
    add('veille/', {
      titre: veille.data.titre ?? t('Veille technologique', 'Technology watch'),
      description: describe(veille.html, veille.data),
      html: `${veille.html}<h2>${t('Sujets suivis', 'Topics followed')}</h2><ul class="liste">${sujetPages
        .map((p) => `<li><a href="${sujetHref(p)}">${escapeHtml(p.sujet.nom)}</a>${t(' : ', ': ')}${escapeHtml(p.sujet.sujet ?? '')}</li>`)
        .join('')}</ul>`,
      ecran: `${screen}veille`,
    });
  }
  for (const { sujet: s, pourquoi, syntheses } of sujetPages.filter((p) => translated(p.pourquoi))) {
    // Synthèses pas encore traduites : en français, signalées comme telles
    const note = syntheses && syntheses.lang !== lang ? `<p class="note">${t('', 'My syntheses are written in French and have not been translated yet.')}</p>` : '';
    const synthesesHtml = syntheses?.html ? `<div${syntheses.lang !== lang ? ` lang="${syntheses.lang}"` : ''}>${syntheses.html}</div>` : `<p>${t('À venir.', 'Coming soon.')}</p>`;
    add(`veille/${s.id}/`, {
      titre: t(`Veille : ${s.sujet ?? s.nom}`, `Technology watch: ${s.sujet ?? s.nom}`),
      description: pourquoi ? describe(pourquoi.html, pourquoi.data) : s.sujet ?? s.nom,
      html: `${pourquoi?.html ?? ''}<h2>${t('Mes synthèses', 'My syntheses')}</h2>${note}${synthesesHtml}`,
      ecran: `${screen}veille/${s.id}`,
    });
  }
  return pages;
}

// Une page complète. `base` : adresse publique du site (pour l'adresse
// canonique et les versions dans l'autre langue), ou '' si elle n'est pas
// renseignée. `all` : toutes les pages fabriquées, dans les deux langues.
export function renderPage(page, rawSite, base, all = []) {
  const { lang } = page;
  const t = inLang(lang);
  const site = localizeConfig(rawSite, lang);
  const start = pathStart(lang);
  const depth = page.path.split('/').filter(Boolean).length;
  const toRoot = '../'.repeat(depth) || './';
  const { nom } = site.identite;
  const { email, github, linkedin } = site.contact;
  const exists = (key) => all.some((p) => p.key === key && p.lang === lang);
  // Rubriques de la barre de navigation : dans la langue de la page si elles
  // y existent, sinon en français
  const nav = [
    ['presentation/', t('Présentation', 'About me')],
    ['alternance/', t('Alternance', 'Work-study')],
    ['realisations/', t('Réalisations', 'Projects')],
    ['veille/', t('Veille', 'Technology watch')],
  ]
    .map(([key, label]) => `<a href="${exists(key) ? start : ''}${key}"${page.key === key ? ' aria-current="page"' : ''}>${label}</a>`)
    .join(' · ');
  // Fil d'Ariane : RémiOS, puis la rubrique (« realisations/ ») pour une page
  // de second niveau, puis la page elle-même
  const parts = page.key.split('/').filter(Boolean);
  const parent = parts.length > 1 ? `${parts[0]}/` : null;
  const parentLabel = { realisations: t('Réalisations', 'Projects'), veille: t('Veille', 'Technology watch') }[parts[0]];
  const home = lang === 'en' ? screenStart(lang) : './';
  const crumbs = [
    `<li><a href="${home}">RémiOS</a></li>`,
    parent ? `<li><a href="${start}${parent}">${parentLabel}</a></li>` : '',
    `<li><span aria-current="page">${escapeHtml(page.titre)}</span></li>`,
  ].join('');
  // Même page dans l'autre langue
  const other = all.find((p) => p.key === page.key && p.lang !== lang);
  const switchLink = other
    ? ` · <a href="${other.path}" hreflang="${other.lang}" lang="${other.lang}">${other.lang === 'en' ? 'English version' : 'Version française'}</a>`
    : '';
  const canonical = base ? `\n<link rel="canonical" href="${escapeHtml(base + page.path)}">` : '';
  const alternates = base && other
    ? [page, other]
        .map((p) => `\n<link rel="alternate" hreflang="${p.lang}" href="${escapeHtml(base + p.path)}">`)
        .concat(`\n<link rel="alternate" hreflang="x-default" href="${escapeHtml(base + (page.lang === 'fr' ? page : other).path)}">`)
        .join('')
    : '';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<base href="${toRoot}">
<meta http-equiv="Content-Security-Policy" content="${escapeHtml(contentSecurityPolicy(site))}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(`${page.titre} · ${nom}`)}</title>
<meta name="description" content="${escapeHtml(page.description)}">${canonical}${alternates}
<meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${STYLESHEET}">
</head>
<body>
<header>
<p class="bandeau">${t(
    `Version texte du portfolio de <a href="${start}presentation/">${escapeHtml(nom)}</a>, étudiant en BTS SIO SISR.`,
    `Text version of the portfolio of <a href="${exists('presentation/') ? start : ''}presentation/">${escapeHtml(nom)}</a>, a BTS SIO SISR student (French two-year degree in IT infrastructure and networks).`,
  )} <a href="${escapeHtml(page.ecran)}">${t('Ouvrir dans RémiOS, la version interactive →', 'Open in RémiOS, the interactive version →')}</a>${switchLink}</p>
<nav aria-label="${t('Rubriques', 'Sections')}">${nav}</nav>
</header>
<main>
<nav class="ariane" aria-label="${t("Fil d'Ariane", 'Breadcrumb')}"><ol>${crumbs}</ol></nav>
<article>
<h1>${escapeHtml(page.titre)}</h1>
${page.html}
</article>
</main>
<footer>
<p>${escapeHtml(nom)} · <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a> · <a href="${escapeHtml(github)}">GitHub</a> · <a href="${escapeHtml(linkedin)}">LinkedIn</a> · <a href="${home}">RémiOS</a></p>
</footer>
</body>
</html>
`;
}

// Adresse courte qui ouvre un écran de RémiOS (en/index.html → #/en/) :
// redirection sans JavaScript, et lien pour les navigateurs qui ne la
// suivent pas. Pas proposée aux moteurs : ce n'est qu'un raccourci.
export function redirectPage(site, screen) {
  const target = `../${screen}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${escapeHtml(contentSecurityPolicy(site))}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${escapeHtml(target)}">
<title>RémiOS — English version</title>
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
</head>
<body>
<p><a href="${escapeHtml(target)}">Open the English version of RémiOS</a>.</p>
</body>
</html>
`;
}

// llms.txt (format proposé sur llmstxt.org) : qui je suis, puis les pages du
// site avec une ligne de description. Adresses complètes si urlPublique est
// renseignée, sinon relatives.
export function llmsTxt(all, site, base) {
  const seo = site.referencement ?? {};
  const line = (p) => `- [${p.titre}](${base}${p.path}): ${p.description}`;
  const section = (titre, list) => (list.length ? [`## ${titre}`, '', ...list.map(line), ''] : []);
  const pages = all.filter((p) => p.lang === 'fr');
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
    // Version anglaise des mêmes pages, quand elles sont traduites
    ...section('English version', all.filter((p) => p.lang === 'en')),
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
.ariane{position:sticky;top:0;z-index:1;background:var(--fond);border-bottom:1px solid var(--trait)}
.ariane ol{display:flex;margin:0;padding:0;list-style:none;font-size:1rem;color:var(--doux);white-space:nowrap}
.ariane li:last-child{min-width:0;overflow:hidden;text-overflow:ellipsis}
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
.note{color:var(--doux);font-size:.9rem;border-left:3px solid var(--trait);padding-left:.6rem}
footer{margin-top:3rem;padding:1rem;border-top:1px solid var(--trait);font-size:.9rem;color:var(--doux)}
`;

// Liens vers les pages statiques, ajoutés à la version sans JavaScript
// d'index.html : c'est par là que les robots les découvrent depuis l'accueil.
// `lang` : langue des liens ; `exists(path)` : la page est-elle fabriquée ?
export function noscriptLinks(lang = 'fr', exists = () => true) {
  const t = inLang(lang);
  return [
    ['presentation/', t('Présentation', 'About me')],
    ['alternance/', t('Alternance et parcours', 'Work-study and background')],
    ['realisations/', t('Réalisations', 'Projects')],
    ['veille/', t('Veille technologique', 'Technology watch')],
  ]
    .map(([key, label]) => [pathStart(lang) + key, label])
    .filter(([href]) => exists(href))
    .map(([href, label]) => `<a href="${href}">${label}</a>`)
    .join(' · ');
}
