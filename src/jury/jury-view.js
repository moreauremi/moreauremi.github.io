// =============================================================================
// Vue rapide jury
// -----------------------------------------------------------------------------
// Une version classique du portfolio : fond clair, police lisible, aucune
// animation, tout le contenu sur une seule page, imprimable.
//
//   #/jury                    page unique : toutes les rubriques du menu
//   #/jury/<slug>             une fiche de réalisation dans le même style sobre
//   #/jury/technos/<techno>   les réalisations qui utilisent une techno
//   #/jury/veille/<sujet>/<tag>  les actualités d'un sujet de veille qui portent ce tag
//   #/jury/mentions-legales   les mentions légales, dans le même style
//
// Le contenu vient des mêmes blocs que l'interface RémiOS (src/blocks/).
// =============================================================================

import { site, realisationsOfType, getRealisation, getTechno, getVeille, getVeilleTag, findVeilleOfTag, neofetchValue, TYPES } from '../content.js';
import { link, hashInLang } from '../router.js';
import {
  presentationBlock,
  alternanceBlock,
  ficheBlock,
  technoBlock,
  competencesBlock,
  syntheseBlock,
  veilleBlock,
  veilleTagBlock,
  certificationsBlock,
  formationsBlock,
  contactBlock,
  mentionsLegalesBlock,
} from '../blocks/index.js';
import { escapeHtml, safe } from '../utils/html.js';
import { formatDate } from '../utils/dates.js';
import { hasModifier } from '../utils/keyboard.js';
import { currentLang, tr } from '../utils/lang.js';
import { currentTheme, onThemeChange, toggleTheme } from '../utils/theme.js';
import { setPlainTitle } from '../ui/tab-title.js';
import { breadcrumb } from '../tui/box.js';
import { langAttr } from '../blocks/shared.js';
import { findSection } from '../tui/sections.js';

// Parties de la page jury, dans l'ordre du sommaire : identifiant et
// contenu ; le titre est celui de la rubrique du même nom dans RémiOS. Les
// titres des textes descendent d'un niveau (voir demoteHeadings).
const PARTS = [
  ['presentation', () => demoteHeadings(presentationBlock())],
  ['alternance', () => demoteHeadings(alternanceBlock())],
  ['realisations', () => Object.entries(TYPES).map(([type, { group: label }]) => group(type, label)).join('')],
  ['competences', () => demoteHeadings(competencesBlock(link.juryFiche))],
  ['synthese', () => syntheseBlock(link.juryFiche)],
  ['veille', () => demoteHeadings(veilleBlock(link.juryVeilleTag))],
  ['formations', () => demoteHeadings(formationsBlock(link.juryFiche))],
  ['certifications', () => demoteHeadings(certificationsBlock())],
  ['contact', () => demoteHeadings(contactBlock({ legalHref: link.juryLegal() }))],
];
const partTitle = (id) => findSection(id).label;

// Fin du titre de l'onglet, sur toutes les pages de la vue jury
const titleEnd = () => tr('Vue jury', 'Jury view');

export function createJuryView(root) {
  let current = null;

  function show(route, { focus = true } = {}) {
    current = route;
    const fiche = route.name === 'jury-fiche' ? getRealisation(route.slug) : null;

    // Ancienne adresse sans sujet (#/jury/veille/<tag>) : premier sujet qui a ce tag
    const veille = route.name === 'jury-tag' ? (route.sujet ? getVeille(route.sujet) : findVeilleOfTag(route.tag)) : null;
    const tag = getVeilleTag(veille, route.tag);
    const techno = route.name === 'jury-techno' ? getTechno(route.techno) : null;

    if (route.name === 'jury-techno' && techno) {
      root.innerHTML = technoPage(techno);
      setPlainTitle(`${technoTitle(techno.nom)} — ${titleEnd()}`);
    } else if (route.name === 'jury-techno') {
      const title = tr('Techno introuvable', 'Technology not found');
      root.innerHTML = missingPage(title, tr("Aucune réalisation publiée n'utilise cette techno.", 'No published project uses this technology.'));
      setPlainTitle(`${title} — ${titleEnd()}`);
    } else if (route.name === 'jury-tag' && tag) {
      root.innerHTML = tagPage(veille, route.tag, tag);
      setPlainTitle(`${tagTitle(veille.nom, tag.nom)} — ${titleEnd()}`);
    } else if (route.name === 'jury-tag') {
      const title = tr('Tag introuvable', 'Tag not found');
      root.innerHTML = missingPage(title, tr("Ce tag n'existe pas dans la veille, ou plus.", 'This tag does not exist in the technology watch, or no longer exists.'));
      setPlainTitle(`${title} — ${titleEnd()}`);
    } else if (route.name === 'jury-fiche' && route.slug === 'mentions-legales') {
      root.innerHTML = legalPage();
      setPlainTitle(`${findSection('mentions-legales').label} — ${titleEnd()}`);
    } else if (route.name === 'jury-fiche' && fiche) {
      root.innerHTML = fichePage(fiche);
      setPlainTitle(`${fiche.titre} — ${titleEnd()}`);
    } else if (route.name === 'jury-fiche') {
      root.innerHTML = missingPage();
      setPlainTitle(`${tr('Fiche introuvable', 'Project not found')} — ${titleEnd()}`);
    } else {
      root.innerHTML = mainPage();
      setPlainTitle(`${site.identite.nom} — ${tr('Portfolio BTS SIO (vue jury)', 'BTS SIO portfolio (jury view)')}`);
    }

    window.scrollTo(0, 0);
    if (focus) root.querySelector('h1').focus({ preventScroll: true });
  }

  // Bouton « Mode sombre » : son état suit le thème, d'où qu'il change
  onThemeChange((theme) => root.querySelector('[data-action="theme"]')?.setAttribute('aria-pressed', String(theme === 'dark')));

  // Boutons « Imprimer » et « Mode sombre », liens du sommaire
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="print"]')) window.print();
    if (event.target.closest('[data-action="theme"]')) toggleTheme();

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
    if (event.key === 'Escape' && !hasModifier(event) && ['jury-fiche', 'jury-techno', 'jury-tag'].includes(current?.name)) {
      window.location.hash = link.jury();
    }
  }

  return { show, handleKey };
}

// --- Page principale -----------------------------------------------------------

function mainPage() {
  const toc = PARTS.map(
    ([id]) => `<li><a href="${link.jury()}" data-scroll-to="jury-${id}">${partTitle(id)}</a></li>`,
  ).join('');
  const parts = PARTS.map(([id, body]) => part(id, partTitle(id), body())).join('');
  // Date du build, injectée par Vite (voir vite.config.js)
  const built = formatDate(__BUILD_DATE__);
  const legal = `<a href="${link.juryLegal()}">${findSection('mentions-legales').label}</a>`;

  return `<div class="jury-page">
    ${breadcrumb([[titleEnd()]])}
    <header class="jury-header">
      <p class="jury-kicker">${tr('Portfolio BTS SIO option SISR · épreuve E5 · vue rapide jury', 'BTS SIO portfolio, SISR option · E5 exam · quick jury view')}</p>
      <h1 tabindex="-1">${escapeHtml(site.identite.nom)}</h1>
      <p class="jury-sub">${['Formation', 'École', 'Alternance', 'Poste', 'Promo']
        .map(neofetchValue)
        .filter(Boolean)
        .map(safe)
        .join(' · ')}</p>
      <div class="jury-actions">
        <button type="button" class="jury-btn jury-btn--primary" data-action="print">${tr('Imprimer', 'Print')}</button>
        <a class="jury-btn" href="${link.home()}">${tr('Ouvrir la version RémiOS', 'Open the RémiOS version')}</a>
        ${langLink('class="jury-btn"')}
        <button type="button" class="jury-btn" data-action="theme" aria-pressed="${currentTheme() === 'dark'}">${tr('Mode sombre', 'Dark mode')}</button>
      </div>
      <nav class="jury-toc" aria-label="${tr('Sommaire', 'Contents')}">
        <ol>${toc}</ol>
      </nav>
    </header>

    ${parts}

    <footer class="jury-footer">
      <p>${tr(
        `Page générée le ${built}. Version interactive : <a href="${link.home()}">RémiOS</a>. ${legal}.`,
        `Page generated on ${built}. Interactive version: <a href="${link.home()}">RémiOS</a>. ${legal}.`,
      )}</p>
    </footer>
  </div>`;
}

// Lien vers la même page dans l'autre langue (bouton dans l'en-tête de la
// page principale, simple lien en pied des autres pages)
function langLink(attrs = '') {
  return currentLang() === 'en'
    ? `<a ${attrs} href="${hashInLang('fr')}" hreflang="fr" lang="fr">Version française</a>`
    : `<a ${attrs} href="${hashInLang('en')}" hreflang="en" lang="en">English version</a>`;
}

const technoTitle = (nom) => tr(`Réalisations : ${nom}`, `Projects: ${nom}`);
const tagTitle = (sujet, tag) => tr(`Veille ${sujet} : ${tag}`, `${sujet} watch: ${tag}`);

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
    : `<p>${tr('À venir.', 'Coming soon.')}</p>`;
  return `<h3>${label}</h3>${list}`;
}

function item(r) {
  const details = [
    `${tr('Date :', 'Date:')} ${safe(formatDate(r.date))}`,
    `${tr('Statut :', 'Status:')} ${safe(r.statut)}`,
    r.technos.length ? `${tr('Technos :', 'Technologies:')} ${r.technos.map(safe).join(', ')}` : '',
    r.competences.length ? `${tr('Compétences :', 'Skills:')} ${r.competences.map(escapeHtml).join(', ')}` : '',
  ].filter(Boolean);

  // data-print-url : adresse complète de la fiche, affichée à l'impression
  const href = link.juryFiche(r.slug);
  const printUrl = window.location.href.split('#')[0] + href;
  return `<li class="jury-item">
    <p class="jury-item-title"${langAttr(r.lang)}><a href="${href}" data-print-url="${escapeHtml(printUrl)}">${safe(r.titre)}</a></p>
    ${r.resume ? `<p class="jury-item-summary"${langAttr(r.lang)}>${safe(r.resume)}</p>` : ''}
    <p class="jury-item-meta">${details.join(' · ')}</p>
  </li>`;
}

// --- Pages secondaires en style sobre (fiche, tag, mentions légales) ----------

// Squelette commun : fil d'Ariane, titre, contenu, pied de page.
// `crumbs` : rubriques entre la vue jury et la page ([libellé, adresse]).
// `remios` : lien facultatif vers le même écran dans RémiOS.
function subPage({ title, body, crumbs = [], remios = '', titleLang = currentLang() }) {
  const back = `<a href="${link.jury()}">${tr('← Retour à la vue jury', '← Back to the jury view')}</a>`;
  return `<div class="jury-page">
    ${breadcrumb([[titleEnd(), link.jury()], ...crumbs, [title]])}
    <h1 tabindex="-1"${langAttr(titleLang)}>${title}</h1>
    ${body}
    <footer class="jury-footer">
      <p>${back}${remios ? ` · ${remios}` : ''} · ${langLink()}</p>
    </footer>
  </div>`;
}

function fichePage(r) {
  return subPage({
    title: safe(r.titre),
    titleLang: r.lang,
    body: ficheBlock(r, link.juryTechno),
    crumbs: [[findSection('realisations').label, link.jury()]],
    remios: `<a href="${link.fiche(r.slug)}">${tr('Voir cette fiche dans RémiOS', 'See this project in RémiOS')}</a>`,
  });
}

// Page d'une techno : les réalisations qui l'utilisent
function technoPage(techno) {
  return subPage({
    title: technoTitle(escapeHtml(techno.nom)),
    body: technoBlock(techno, link.juryFiche, link.juryTechno),
    crumbs: [[findSection('realisations').label, link.jury()]],
    remios: `<a href="${link.techno(techno.slug)}">${tr('Voir cette techno dans RémiOS', 'See this technology in RémiOS')}</a>`,
  });
}

// Page d'un tag de la veille
function tagPage(veille, slug, tag) {
  return subPage({
    title: tagTitle(escapeHtml(veille.nom), escapeHtml(tag.nom)),
    body: veilleTagBlock(veille, slug, link.juryVeilleTag),
    crumbs: [[findSection('veille').label, link.jury()], [escapeHtml(veille.nom), link.jury()]],
    remios: `<a href="${link.veilleTag(veille.id, slug)}">${tr('Voir ce tag dans RémiOS', 'See this tag in RémiOS')}</a>`,
  });
}

function legalPage() {
  return subPage({ title: findSection('mentions-legales').label, body: mentionsLegalesBlock() });
}

function missingPage(title = tr('Fiche introuvable', 'Project not found'), text = tr("Cette réalisation n'existe pas, ou plus.", 'This project does not exist, or no longer exists.')) {
  return `<div class="jury-page">
    ${breadcrumb([[titleEnd(), link.jury()], [title]])}
    <h1 tabindex="-1">${title}</h1>
    <p>${text}</p>
    <p><a href="${link.jury()}">${tr('← Retour à la vue jury', '← Back to the jury view')}</a></p>
  </div>`;
}

// Dans la page jury, les textes Markdown sont sous un titre de niveau 2 :
// leurs propres titres (## en Markdown → <h2>) descendent d'un niveau (<h3>)
// pour garder une hiérarchie correcte, utile aux lecteurs d'écran.
function demoteHeadings(html) {
  return html.replaceAll('<h2', '<h3').replaceAll('</h2>', '</h3>');
}
