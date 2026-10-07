// =============================================================================
// Vue rapide jury
// -----------------------------------------------------------------------------
// Une version classique du portfolio : fond clair, police lisible, aucune
// animation, tout le contenu sur une seule page, imprimable.
//
//   #/jury                    page unique : toutes les rubriques du menu
//   #/jury/<slug>             une fiche de réalisation dans le même style sobre
//   #/jury/veille/<tag>       les actualités de la veille qui portent ce tag
//   #/jury/mentions-legales   les mentions légales, dans le même style
//
// Le contenu vient des mêmes blocs que l'interface RémiOS (src/blocks.js).
// =============================================================================

import { site, realisationsOfType, getRealisation, getVeilleTag, TYPES } from '../content.js';
import { link } from '../router.js';
import {
  presentationBlock,
  alternanceBlock,
  ficheBlock,
  competencesBlock,
  syntheseBlock,
  veilleBlock,
  veilleTagBlock,
  certificationsBlock,
  contactBlock,
  mentionsLegalesBlock,
} from '../blocks.js';
import { escapeHtml, safe } from '../utils/html.js';
import { formatDate } from '../utils/dates.js';
import { hasModifier } from '../utils/keyboard.js';
import { setPlainTitle } from '../ui/tab-title.js';

// Date du build, injectée par Vite (voir vite.config.js)
const BUILD_DATE = formatDate(__BUILD_DATE__);

// Parties de la page jury, dans l'ordre du sommaire : identifiant, titre et
// contenu. Les titres des textes descendent d'un niveau (voir demoteHeadings).
const PARTS = [
  ['presentation', 'Présentation', () => demoteHeadings(presentationBlock())],
  ['alternance', 'Alternance et parcours', () => demoteHeadings(alternanceBlock())],
  ['realisations', 'Réalisations', () => Object.entries(TYPES).map(([type, { group: label }]) => group(type, label)).join('')],
  ['competences', 'Compétences', () => demoteHeadings(competencesBlock(link.juryFiche))],
  ['synthese', 'Tableau de synthèse E5', () => syntheseBlock(link.juryFiche)],
  ['veille', 'Veille technologique', () => demoteHeadings(veilleBlock(link.juryVeilleTag))],
  ['certifications', 'Certifications', () => demoteHeadings(certificationsBlock())],
  ['contact', 'CV et contact', () => demoteHeadings(contactBlock({ legalHref: link.juryLegal() }))],
];

export function createJuryView(root) {
  let current = null;

  function show(route, { focus = true } = {}) {
    current = route;
    const fiche = route.name === 'jury-fiche' ? getRealisation(route.slug) : null;

    const tag = route.name === 'jury-tag' ? getVeilleTag(route.tag) : null;

    if (route.name === 'jury-tag' && tag) {
      root.innerHTML = tagPage(route.tag, tag);
      setPlainTitle(`Veille : ${tag.nom} — Vue jury`);
    } else if (route.name === 'jury-tag') {
      root.innerHTML = missingPage('Tag introuvable', "Ce tag n'existe pas dans la veille, ou plus.");
      setPlainTitle('Tag introuvable — Vue jury');
    } else if (route.name === 'jury-fiche' && route.slug === 'mentions-legales') {
      root.innerHTML = legalPage();
      setPlainTitle('Mentions légales — Vue jury');
    } else if (route.name === 'jury-fiche' && fiche) {
      root.innerHTML = fichePage(fiche);
      setPlainTitle(`${fiche.titre} — Vue jury`);
    } else if (route.name === 'jury-fiche') {
      root.innerHTML = missingPage();
      setPlainTitle('Fiche introuvable — Vue jury');
    } else {
      root.innerHTML = mainPage();
      setPlainTitle(`${site.identite.nom} — Portfolio BTS SIO (vue jury)`);
    }

    window.scrollTo(0, 0);
    if (focus) root.querySelector('h1').focus({ preventScroll: true });
  }

  // Bouton « Imprimer » et liens du sommaire
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="print"]')) window.print();

    // Les liens du sommaire font défiler jusqu'à la section. On ne passe pas
    // par une ancre « #section » : le hash de l'URL sert déjà au routage.
    const tocLink = event.target.closest('[data-scroll-to]');
    if (tocLink) {
      event.preventDefault();
      const heading = root.querySelector(`#${tocLink.dataset.scrollTo}`);
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      heading.focus({ preventScroll: true });
    }
  });

  // Échap sur une fiche : retour à la page jury
  function handleKey(event) {
    if (event.key === 'Escape' && !hasModifier(event) && ['jury-fiche', 'jury-tag'].includes(current?.name)) {
      window.location.hash = link.jury();
    }
  }

  return { show, handleKey };
}

// --- Page principale -----------------------------------------------------------

function mainPage() {
  const toc = PARTS.map(
    ([id, label]) => `<li><a href="${link.jury()}" data-scroll-to="jury-${id}">${label}</a></li>`,
  ).join('');
  const parts = PARTS.map(([id, label, body]) => part(id, label, body())).join('');

  return `<div class="jury-page">
    <header class="jury-header">
      <p class="jury-kicker">Portfolio BTS SIO option SISR · épreuve E5 · vue rapide jury</p>
      <h1 tabindex="-1">${escapeHtml(site.identite.nom)}</h1>
      <p class="jury-sub">${site.neofetch
        .filter(([key]) => ['Formation', 'École', 'Promo', 'Alternance', 'Poste'].includes(key))
        .map(([, value]) => safe(value))
        .join(' · ')}</p>
      <div class="jury-actions">
        <button type="button" class="jury-btn jury-btn--primary" data-action="print">Imprimer</button>
        <a class="jury-btn" href="${link.home()}">Ouvrir la version RémiOS</a>
      </div>
      <nav class="jury-toc" aria-label="Sommaire">
        <ol>${toc}</ol>
      </nav>
    </header>

    ${parts}

    <footer class="jury-footer">
      <p>Page générée le ${BUILD_DATE}. Version interactive : <a href="${link.home()}">RémiOS</a>. <a href="${link.juryLegal()}">Mentions légales</a>.</p>
    </footer>
  </div>`;
}

// Une section de la page, avec son titre de niveau 2
function part(id, title, body) {
  return `<section class="jury-part" aria-labelledby="jury-${id}">
    <h2 id="jury-${id}" tabindex="-1">${title}</h2>
    ${body}
  </section>`;
}

// Réalisations d'un type : titre (lien vers la fiche), résumé, caractéristiques
function group(type, label) {
  const items = realisationsOfType(type);
  const list = items.length
    ? `<ul class="jury-list">${items.map(item).join('')}</ul>`
    : '<p>À venir.</p>';
  return `<h3>${label}</h3>${list}`;
}

function item(r) {
  const details = [
    `Date : ${safe(formatDate(r.date))}`,
    `Statut : ${safe(r.statut)}`,
    r.technos.length ? `Technos : ${r.technos.map(safe).join(', ')}` : '',
    r.competences.length ? `Compétences : ${r.competences.map(escapeHtml).join(', ')}` : '',
  ].filter(Boolean);

  // data-print-url : adresse complète de la fiche, affichée à l'impression
  const href = link.juryFiche(r.slug);
  const printUrl = window.location.href.split('#')[0] + href;
  return `<li class="jury-item">
    <p class="jury-item-title"><a href="${href}" data-print-url="${escapeHtml(printUrl)}">${safe(r.titre)}</a></p>
    ${r.resume ? `<p class="jury-item-summary">${safe(r.resume)}</p>` : ''}
    <p class="jury-item-meta">${details.join(' · ')}</p>
  </li>`;
}

// --- Fiche en style sobre ---------------------------------------------------

function fichePage(r) {
  return `<div class="jury-page">
    <nav class="jury-back" aria-label="Navigation">
      <a href="${link.jury()}">← Retour à la vue jury</a>
    </nav>
    <h1 tabindex="-1">${safe(r.titre)}</h1>
    ${ficheBlock(r)}
    <footer class="jury-footer">
      <p><a href="${link.jury()}">← Retour à la vue jury</a> · <a href="${link.fiche(r.slug)}">Voir cette fiche dans RémiOS</a></p>
    </footer>
  </div>`;
}

// Page d'un tag de la veille, dans le même style sobre
function tagPage(slug, tag) {
  return `<div class="jury-page">
    <nav class="jury-back" aria-label="Navigation">
      <a href="${link.jury()}">← Retour à la vue jury</a>
    </nav>
    <h1 tabindex="-1">Veille : ${escapeHtml(tag.nom)}</h1>
    ${veilleTagBlock(slug, link.juryVeilleTag)}
    <footer class="jury-footer">
      <p><a href="${link.jury()}">← Retour à la vue jury</a> · <a href="${link.veilleTag(slug)}">Voir ce tag dans RémiOS</a></p>
    </footer>
  </div>`;
}

function legalPage() {
  return `<div class="jury-page">
    <nav class="jury-back" aria-label="Navigation">
      <a href="${link.jury()}">← Retour à la vue jury</a>
    </nav>
    <h1 tabindex="-1">Mentions légales</h1>
    ${mentionsLegalesBlock()}
    <footer class="jury-footer">
      <p><a href="${link.jury()}">← Retour à la vue jury</a></p>
    </footer>
  </div>`;
}

function missingPage(title = 'Fiche introuvable', text = "Cette réalisation n'existe pas, ou plus.") {
  return `<div class="jury-page">
    <h1 tabindex="-1">${title}</h1>
    <p>${text}</p>
    <p><a href="${link.jury()}">← Retour à la vue jury</a></p>
  </div>`;
}

// Dans la page jury, les textes Markdown sont sous un titre de niveau 2 :
// leurs propres titres (## en Markdown → <h2>) descendent d'un niveau (<h3>)
// pour garder une hiérarchie correcte, utile aux lecteurs d'écran.
function demoteHeadings(html) {
  return html.replaceAll('<h2', '<h3').replaceAll('</h2>', '</h3>');
}
