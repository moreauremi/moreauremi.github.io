// Rubrique « Veille technologique » : un onglet par sujet (content/veille/<id>/),
// et dans chacun, deux onglets : les actualités collectées chaque semaine (et
// leurs tags), et mes synthèses. Puis les sources suivies pour ce sujet.

import { pages, veilles, getVeilleTag, actualitesByTag } from '../content.js';
import { escapeHtml, safe } from '../utils/html.js';
import { formatDate } from '../utils/dates.js';
import { tagSlug } from '../utils/tags.js';
import { pagedList } from '../ui/pager.js';
import { tabs } from '../ui/tabs.js';
import { NEW_TAB } from './shared.js';


// Nombre d'actualités par page (barre « < 1 2 3 > » sous la liste)
const NEWS_PER_PAGE = 3;

// `hrefForTag(sujet, slug)` : lien vers la page d'un tag (#/veille/<sujet>/<tag>
// dans RémiOS, #/jury/veille/<sujet>/<tag> dans la vue jury).
// `sujet` : identifiant du sujet dont l'onglet est ouvert au départ (le
// premier par défaut).
export function veilleBlock(hrefForTag, { sujet = null } = {}) {
  if (veilles.length === 0) return `<div class="prose">${pages.veille.html}</div><p class="empty">Sujets à venir.</p>`;
  const selected = Math.max(0, veilles.findIndex((v) => v.id === sujet));
  const onglets = tabs(
    veilles.map((v) => ({ label: escapeHtml(v.nom), html: sujetPanel(v, (slug) => hrefForTag(v.id, slug)) })),
    { label: 'Sujets de veille', selected, variant: 'main' },
  );
  return `<div class="prose">${pages.veille.html}</div>${onglets}`;
}

// Contenu de l'onglet d'un sujet
function sujetPanel(veille, hrefForTag) {
  const update = veille.miseAJour ? `Dernière collecte : ${escapeHtml(formatDate(veille.miseAJour))}. ` : '';
  const news = veille.actualites.length
    ? newsList(veille.actualites, hrefForTag)
    : '<p class="empty">Première collecte à venir.</p>';
  const tags = veille.tags.length
    ? `<h2 class="block-title" id="veille-${veille.id}-tags">Explorer par tag</h2>
      <p class="intro">Chaque tag regroupe toutes les actualités collectées sur ce thème depuis le début de la veille.</p>
      ${tagList(veille.tags, hrefForTag, { counts: true })}`
    : '';
  const sources = veille.flux
    .map((f) => `<li><a href="${escapeHtml(new URL(f.url).origin)}" ${NEW_TAB}>${escapeHtml(f.nom)}</a></li>`)
    .join('');

  // Deux onglets au même niveau : les actualités collectées (et leurs tags),
  // et mes synthèses (content/veille/<id>/syntheses.md)
  const onglets = tabs(
    [
      {
        label: 'Dernières actualités',
        html: `<p class="intro">${update}Résumés rédigés par une IA : l'article d'origine fait foi.</p>${news}${tags}`,
      },
      { label: 'Mes synthèses', html: `<div class="prose">${veille.syntheses}</div>` },
    ],
    { label: `Veille ${escapeHtml(veille.nom)}` },
  );

  return `<div class="prose">
    <p><strong>Sujet :</strong> ${safe(veille.sujet)}</p>
    ${veille.pourquoi}
  </div>
  ${onglets}
  <h2 class="block-title" id="veille-${veille.id}-sources">Sources suivies</h2>
  <ul class="veille-sources">${sources}</ul>`;
}

// Page d'un tag : toutes les actualités du sujet qui le portent, puis les
// autres tags du sujet. null si le tag n'existe pas.
export function veilleTagBlock(veille, slug, hrefForTag) {
  const tag = getVeilleTag(veille, slug);
  if (!tag) return null;
  const items = actualitesByTag(veille, slug);
  const tagHref = (s) => hrefForTag(veille.id, s);
  return `<p class="intro">${items.length} actualité${items.length > 1 ? 's' : ''} de la veille « ${safe(veille.sujet)} » avec le tag <strong>${escapeHtml(tag.nom)}</strong>, de la plus récente à la plus ancienne.</p>
  ${newsList(items, tagHref)}
  <h2 class="block-title" id="veille-autres-tags">Tous les tags de ce sujet</h2>
  ${tagList(veille.tags, tagHref, { counts: true, current: slug })}`;
}

// Liste d'actualités, de la plus récente à la plus ancienne, par pages de
// NEWS_PER_PAGE : date et source, titre (lien vers l'article), résumé, tags.
// Tout ce texte vient de flux RSS et d'une IA : il est systématiquement
// échappé, et seules les adresses http(s) deviennent des liens.
function newsList(items, hrefForTag) {
  return pagedList(
    items.map(
      (a) => `<li class="news-item">
      <p class="news-meta"><time datetime="${escapeHtml(a.date)}">${escapeHtml(formatDate(a.date))}</time> · ${escapeHtml(a.source)}</p>
      <p class="news-title">${
        /^https?:\/\//i.test(a.url)
          ? `<a href="${escapeHtml(a.url)}" ${NEW_TAB}>${escapeHtml(a.titre)}<span class="visually-hidden"> (nouvel onglet)</span></a>`
          : escapeHtml(a.titre)
      }</p>
      <p class="news-summary">${escapeHtml(a.resume)}</p>
      ${tagList(a.tags.map((nom) => ({ nom, slug: tagSlug(nom) })), hrefForTag)}
    </li>`,
    ),
    { size: NEWS_PER_PAGE, listAttrs: 'class="news-list" data-nav-list', label: 'Pages des actualités' },
  );
}

// Liste de tags cliquables. `counts` : nombre d'actualités entre parenthèses ;
// `current` : tag de la page affichée (non cliquable).
function tagList(tags, hrefForTag, { counts = false, current = null } = {}) {
  return `<ul class="tag-list" aria-label="Tags">${tags
    .map((t) => {
      const label = `${escapeHtml(t.nom)}${counts ? ` <span class="tag-count">(${t.count})</span>` : ''}`;
      return t.slug === current
        ? `<li><span class="tag is-current" aria-current="page">${label}</span></li>`
        : `<li><a class="tag" href="${hrefForTag(t.slug)}">${label}</a></li>`;
    })
    .join('')}</ul>`;
}
