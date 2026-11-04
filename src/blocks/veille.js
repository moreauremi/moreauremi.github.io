// Rubrique « Veille technologique » : un onglet par sujet (content/veille/<id>/),
// et dans chacun, deux onglets : mes synthèses (ouvert d'abord), et les
// actualités collectées chaque semaine (et leurs tags). Puis les sources
// suivies pour ce sujet.
//
// Version anglaise : la méthode et « pourquoi ce sujet » sont traduits
// (fichiers .en.md). Les actualités, résumées chaque semaine par le robot à
// partir de sources françaises, restent en français, comme les synthèses tant
// qu'elles n'ont pas de traduction : c'est annoncé au visiteur, et le texte
// porte l'attribut lang="fr" pour les lecteurs d'écran.

import { pages, veilles, getVeilleTag, actualitesByTag } from '../content.js';
import { escapeHtml, safe } from '../utils/html.js';
import { formatDate } from '../utils/dates.js';
import { tagSlug } from '../utils/tags.js';
import { pagedList } from '../ui/pager.js';
import { tabs } from '../ui/tabs.js';
import { currentLang, tr } from '../utils/lang.js';
import { NEW_TAB, langAttr, untranslatedNote } from './shared.js';


// Nombre d'actualités par page (barre « < 1 2 3 > » sous la liste)
const NEWS_PER_PAGE = 3;

// `hrefForTag(sujet, slug)` : lien vers la page d'un tag (#/veille/<sujet>/<tag>
// dans RémiOS, #/jury/veille/<sujet>/<tag> dans la vue jury).
// `sujet` : identifiant du sujet dont l'onglet est ouvert au départ (le
// premier par défaut).
export function veilleBlock(hrefForTag, { sujet = null } = {}) {
  const methode = `${untranslatedNote(pages.veille.lang)}<div class="prose"${langAttr(pages.veille.lang)}>${pages.veille.html}</div>`;
  if (veilles.length === 0) return `${methode}<p class="empty">${tr('Sujets à venir.', 'Topics coming soon.')}</p>`;
  const selected = Math.max(0, veilles.findIndex((v) => v.id === sujet));
  const onglets = tabs(
    veilles.map((v) => ({ label: escapeHtml(v.nom), html: sujetPanel(v, (slug) => hrefForTag(v.id, slug)) })),
    { label: tr('Sujets de veille', 'Watch topics'), selected, variant: 'main' },
  );
  return `${methode}${onglets}`;
}

// Actualités en français dans la version anglaise : attribut lang
const newsLang = () => (currentLang() === 'fr' ? '' : ' lang="fr"');

// Contenu de l'onglet d'un sujet
function sujetPanel(veille, hrefForTag) {
  const date = veille.miseAJour ? escapeHtml(formatDate(veille.miseAJour)) : '';
  const update = date ? tr(`Dernière collecte : ${date}. `, `Last collected: ${date}. `) : '';
  const news = veille.actualites.length
    ? newsList(veille.actualites, hrefForTag)
    : `<p class="empty">${tr('Première collecte à venir.', 'First collection coming soon.')}</p>`;
  const tags = veille.tags.length
    ? `<h2 class="block-title" id="veille-${veille.id}-tags">${tr('Explorer par tag', 'Browse by tag')}</h2>
      <p class="intro">${tr(
        'Chaque tag regroupe toutes les actualités collectées sur ce thème depuis le début de la veille.',
        'Each tag gathers all the news collected on that theme since the watch began (tags in French).',
      )}</p>
      ${tagList(veille.tags, hrefForTag, { counts: true })}`
    : '';
  const sources = veille.flux
    .map((f) => `<li><a href="${escapeHtml(new URL(f.url).origin)}" ${NEW_TAB}>${escapeHtml(f.nom)}</a></li>`)
    .join('');

  // Deux onglets au même niveau : mes synthèses (content/veille/<id>/syntheses.md),
  // ouvert d'abord, et les actualités collectées (et leurs tags)
  const syntheses = untranslatedNote(veille.synthesesLang, 'My syntheses are written in French and have not been translated yet.');
  const onglets = tabs(
    [
      {
        label: tr('Mes synthèses', 'My syntheses'),
        html: `${syntheses}<div class="prose"${langAttr(veille.synthesesLang)}>${veille.syntheses}</div>`,
      },
      {
        label: tr('Dernières actualités', 'Latest news'),
        html: `<p class="intro">${update}${tr(
          "Résumés rédigés par une IA : l'article d'origine fait foi.",
          'Summaries written by an AI, in French, from French-language sources: the original article prevails.',
        )}</p>${news}${tags}`,
      },
    ],
    { label: `${tr('Veille', 'Technology watch:')} ${escapeHtml(veille.nom)}` },
  );

  return `<div class="prose">
    <p><strong>${tr('Sujet :', 'Topic:')}</strong> ${safe(veille.sujet)}</p>
    ${untranslatedNote(veille.pourquoiLang)}
    <div${langAttr(veille.pourquoiLang)}>${veille.pourquoi}</div>
  </div>
  ${onglets}
  <h2 class="block-title" id="veille-${veille.id}-sources">${tr('Sources suivies', 'Sources followed')}</h2>
  <ul class="veille-sources">${sources}</ul>`;
}

// Page d'un tag : toutes les actualités du sujet qui le portent, puis les
// autres tags du sujet. null si le tag n'existe pas.
export function veilleTagBlock(veille, slug, hrefForTag) {
  const tag = getVeilleTag(veille, slug);
  if (!tag) return null;
  const items = actualitesByTag(veille, slug);
  const tagHref = (s) => hrefForTag(veille.id, s);
  const count = items.length;
  const tagName = `<strong lang="fr">${escapeHtml(tag.nom)}</strong>`;
  return `<p class="intro">${tr(
    `${count} actualité${count > 1 ? 's' : ''} de la veille « ${safe(veille.sujet)} » avec le tag ${tagName}, de la plus récente à la plus ancienne.`,
    `${count} news item${count > 1 ? 's' : ''} on “${safe(veille.sujet)}” tagged ${tagName}, most recent first.`,
  )}</p>
  ${newsList(items, tagHref)}
  <h2 class="block-title" id="veille-autres-tags">${tr('Tous les tags de ce sujet', 'All tags for this topic')}</h2>
  ${tagList(veille.tags, tagHref, { counts: true, current: slug })}`;
}

// Liste d'actualités, de la plus récente à la plus ancienne, par pages de
// NEWS_PER_PAGE : date et source, titre (lien vers l'article), résumé, tags.
// Tout ce texte vient de flux RSS et d'une IA : il est systématiquement
// échappé, et seules les adresses http(s) deviennent des liens.
function newsList(items, hrefForTag) {
  return pagedList(
    items.map(
      (a) => `<li class="news-item"${newsLang()}>
      <p class="news-meta"><time datetime="${escapeHtml(a.date)}">${escapeHtml(formatDate(a.date))}</time> · ${escapeHtml(a.source)}</p>
      <p class="news-title">${
        /^https?:\/\//i.test(a.url)
          ? `<a href="${escapeHtml(a.url)}" ${NEW_TAB}>${escapeHtml(a.titre)}<span class="visually-hidden"${currentLang() === 'fr' ? '' : ' lang="en"'}> ${tr('(nouvel onglet)', '(new tab)')}</span></a>`
          : escapeHtml(a.titre)
      }</p>
      <p class="news-summary">${escapeHtml(a.resume)}</p>
      ${tagList(a.tags.map((nom) => ({ nom, slug: tagSlug(nom) })), hrefForTag)}
    </li>`,
    ),
    { size: NEWS_PER_PAGE, listAttrs: 'class="news-list" data-nav-list', label: tr('Pages des actualités', 'News pages') },
  );
}

// Liste de tags cliquables. `counts` : nombre d'actualités entre parenthèses ;
// `current` : tag de la page affichée (non cliquable).
function tagList(tags, hrefForTag, { counts = false, current = null } = {}) {
  return `<ul class="tag-list" aria-label="Tags"${newsLang()}>${tags
    .map((t) => {
      const label = `${escapeHtml(t.nom)}${counts ? ` <span class="tag-count">(${t.count})</span>` : ''}`;
      return t.slug === current
        ? `<li><span class="tag is-current" aria-current="page">${label}</span></li>`
        : `<li><a class="tag" href="${hrefForTag(t.slug)}">${label}</a></li>`;
    })
    .join('')}</ul>`;
}
