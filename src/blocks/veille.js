// Rubrique « Veille technologique » : actualités collectées chaque semaine
// (content/veille/actualites.json), tags, synthèses personnelles, sources.

import { site, pages, actualites, veilleMiseAJour, veilleTags, getVeilleTag, actualitesByTag } from '../content.js';
import { escapeHtml, safe } from '../utils/html.js';
import { formatDate } from '../utils/dates.js';
import { tagSlug } from '../utils/tags.js';
import { pagedList } from '../ui/pager.js';
import { tabs } from '../ui/tabs.js';
import { NEW_TAB } from './shared.js';


// Nombre d'actualités par page (barre « < 1 2 3 > » sous la liste)
const NEWS_PER_PAGE = 3;

// `hrefForTag(slug)` : lien vers la page d'un tag (#/veille/<tag> dans RémiOS,
// #/jury/veille/<tag> dans la vue jury)
export function veilleBlock(hrefForTag) {
  const sujet = site.veille.sujet ? safe(site.veille.sujet) : 'À venir';
  const update = veilleMiseAJour ? `Dernière collecte : ${escapeHtml(formatDate(veilleMiseAJour))}. ` : '';
  const news = actualites.length
    ? newsList(actualites, hrefForTag)
    : '<p class="empty">Première collecte à venir.</p>';
  const tags = veilleTags.length
    ? `<h2 class="block-title" id="veille-tags">Explorer par tag</h2>
      <p class="intro">Chaque tag regroupe toutes les actualités collectées sur ce thème depuis le début de la veille.</p>
      ${tagList(veilleTags, hrefForTag, { counts: true })}`
    : '';
  const sources = site.veille.flux
    .map((f) => `<li><a href="${escapeHtml(new URL(f.url).origin)}" ${NEW_TAB}>${escapeHtml(f.nom)}</a></li>`)
    .join('');

  // Deux onglets au même niveau : les actualités collectées (et leurs tags),
  // et les synthèses personnelles (content/pages/syntheses.md)
  const onglets = tabs(
    [
      {
        label: 'Dernières actualités',
        html: `<p class="intro">${update}Résumés rédigés par une IA : l'article d'origine fait foi.</p>${news}${tags}`,
      },
      { label: 'Mes synthèses', html: `<div class="prose">${pages.syntheses.html}</div>` },
    ],
    { label: 'Veille' },
  );

  return `<div class="prose">
    <p><strong>Sujet :</strong> ${sujet}</p>
    ${pages.veille.html}
  </div>
  ${onglets}
  <h2 class="block-title" id="veille-sources">Sources suivies</h2>
  <ul class="veille-sources">${sources}</ul>`;
}

// Page d'un tag : toutes les actualités qui le portent, puis les autres tags.
// null si le tag n'existe pas.
export function veilleTagBlock(slug, hrefForTag) {
  const tag = getVeilleTag(slug);
  if (!tag) return null;
  const items = actualitesByTag(slug);
  return `<p class="intro">${items.length} actualité${items.length > 1 ? 's' : ''} de la veille « ${safe(site.veille.sujet)} » avec le tag <strong>${escapeHtml(tag.nom)}</strong>, de la plus récente à la plus ancienne.</p>
  ${newsList(items, hrefForTag)}
  <h2 class="block-title" id="veille-autres-tags">Tous les tags</h2>
  ${tagList(veilleTags, hrefForTag, { counts: true, current: slug })}`;
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
