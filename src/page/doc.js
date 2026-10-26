// =============================================================================
// Pages façon Notion : rubriques, fiches, technos, tags de la veille
// -----------------------------------------------------------------------------
// Barre du haut (bouton « Menu » sur téléphone, « ← Retour » vers la page
// précédente, fil d'Ariane), couverture facultative, grande icône, titre,
// puis le contenu. Le contenu des rubriques vient des blocs partagés
// (src/blocks/), comme dans la vue jury.
// =============================================================================

import { competenceLabel } from '../content.js';
import { link } from '../router.js';
import { ficheCompetences, technoBadge } from '../blocks/index.js';
import { NEW_TAB } from '../blocks/shared.js';
import { escapeHtml, safe } from '../utils/html.js';
import { formatDate } from '../utils/dates.js';
import { ICONS } from './icons.js';
import { SECTION_ICONS, ficheIcon, typeTag, statusTag, tag, menuButton, themeButton, siblingsNav } from './parts.js';

// `crumbs` : [{ label, href, icon }] après l'accueil (le dernier est la page
// affichée, sans lien) ; `back` : { href, label } de la page précédente ;
// `cover` : type de réalisation dont la couverture est affichée ; `wide` :
// colonne plus large (tableaux) ; `aside` : contenu posé à côté du texte sur
// grand écran (sommaire d'une fiche).
export function docPage({ crumbs, back, icon, title, body, cover = '', wide = false, aside = '' }) {
  const classes = ['pg-doc', wide ? 'pg-doc--wide' : '', cover ? 'pg-doc--cover' : ''].filter(Boolean).join(' ');
  return `${topbar(crumbs, back)}
  ${cover ? `<div class="pg-cover pg-cover--${cover}" aria-hidden="true"></div>` : ''}
  <div class="pg-doc-wrap">
    <main class="${classes}" id="pg-main">
      <div class="pg-doc-icon" aria-hidden="true">${icon}</div>
      <h1 class="pg-doc-title" tabindex="-1">${title}</h1>
      ${body}
    </main>
  </div>
  ${aside}`;
}

function topbar(crumbs, back) {
  const home = `<a class="pg-crumb" href="${link.home()}"><span aria-hidden="true">${SECTION_ICONS.home}</span><span>Accueil</span></a>`;
  const rest = crumbs.map(({ label, href, icon }) => {
    const content = `${icon ? `<span aria-hidden="true">${icon}</span>` : ''}<span>${label}</span>`;
    return href
      ? `<a class="pg-crumb" href="${href}">${content}</a>`
      : `<span class="pg-crumb pg-crumb--current" aria-current="page">${content}</span>`;
  });
  const separator = '<span class="pg-crumb-sep" aria-hidden="true">/</span>';
  // « ← <page parente> » remonte d'un niveau (même effet que Échap) : on lit
  // directement où l'on va.
  const backLink = back
    ? `<a class="pg-back" href="${back.href}" data-back title="Remonter à « ${escapeHtml(back.label)} » (Échap)">
        <span aria-hidden="true">←</span><span class="visually-hidden">Remonter à </span><span class="pg-back-dest">${escapeHtml(back.label)}</span><kbd class="pg-kbd" aria-hidden="true">Échap</kbd>
      </a>`
    : '';
  return `<header class="pg-topbar">
    ${menuButton()}
    ${backLink}
    <nav class="pg-crumbs" aria-label="Vous êtes ici">${[home, ...rest].join(separator)}</nav>
    <div class="pg-topbar-tools">${themeButton()}</div>
  </header>`;
}

// --- Fiche de réalisation -------------------------------------------------------

// Propriétés (type, date, statut, technos, compétences, documents), résumé
// dans un encadré, texte de la fiche, compétences du référentiel, puis les
// réalisations voisines (`around`, voir siblingsNav). Le sommaire est rempli
// par page-view.js.
export function fichePage(r, back, around) {
  const technos = r.technos.length
    ? `<ul class="tags" aria-label="Technos">${r.technos.map((nom) => `<li>${technoBadge(nom, link.techno)}</li>`).join('')}</ul>`
    : '';
  const competences = r.competences
    .map((code) => tag(escapeHtml(code), 'gray', ` title="${escapeHtml(competenceLabel(code))}"`))
    .join('');
  const draft = r.brouillon ? tag('brouillon, non publié', 'red') : '';

  const rows = [
    [ICONS.type, 'Type', `${typeTag(r)}${draft}`],
    [ICONS.date, 'Date', safe(formatDate(r.date))],
    [ICONS.status, 'Statut', statusTag(r.statut)],
    [ICONS.list, 'Technos', technos],
    [ICONS.check, 'Compétences', competences],
    [ICONS.clip, 'Documents', pdfLinks(r.html)],
  ]
    .filter(([, , value]) => value)
    .map(([icon, name, value]) => `<div class="pg-prop"><dt>${icon}${name}</dt><dd>${value}</dd></div>`)
    .join('');

  const competencesHtml = ficheCompetences(r);
  const body = `<dl class="pg-props">${rows}</dl>
    ${r.resume ? `<aside class="pg-callout" aria-label="Résumé"><span class="pg-callout-icon" aria-hidden="true">💡</span><p>${safe(r.resume)}</p></aside>` : ''}
    <div class="prose pg-prose">${r.html}</div>
    ${competencesHtml ? `<div class="prose pg-prose">${competencesHtml}</div>` : ''}
    ${siblingsNav(around, 'Autres réalisations')}`;

  return docPage({
    crumbs: [
      { label: 'Réalisations', href: link.section('realisations'), icon: SECTION_ICONS.realisations },
      { label: safe(r.titre), icon: ficheIcon(r) },
    ],
    back,
    icon: ficheIcon(r),
    title: safe(r.titre),
    body,
    cover: r.type,
    aside: '<nav class="pg-toc" aria-label="Sur cette page" data-toc hidden></nav>',
  });
}

// Documents PDF cités dans la fiche (documentations, rapports…), repris dans
// les propriétés pour être trouvés tout de suite
function pdfLinks(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const links = [...template.content.querySelectorAll('a[href$=".pdf"]')].map(
    (a) => `<li><a href="${escapeHtml(a.getAttribute('href'))}" ${NEW_TAB}>${escapeHtml(a.textContent)}</a></li>`,
  );
  return links.length ? `<ul class="pg-prop-links">${links.join('')}</ul>` : '';
}
