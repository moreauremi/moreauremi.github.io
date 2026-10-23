// =============================================================================
// Vue page, façon Notion
// -----------------------------------------------------------------------------
// Affiche l'écran demandé par l'URL : l'accueil (une colonne centrée, voir
// home.js), ou une page façon Notion pour une rubrique, une fiche, une techno
// ou un tag de la veille (voir doc.js). Mêmes adresses que RémiOS.
//
// Pour toujours savoir où l'on est et où l'on va :
//   - menu latéral avec toutes les pages, la page affichée surlignée (sur
//     téléphone, il s'ouvre avec le bouton « Menu ») ;
//   - « ← Retour » ramène à la page d'où l'on vient, dont le nom est écrit ;
//     Échap fait pareil (ou ferme le menu s'il est ouvert).
//
// Clavier : 1 à 8 ouvrent une rubrique depuis l'accueil ; ↑ ↓ passent d'une
// réalisation à l'autre dans une liste.
// =============================================================================

import { link, navigate, parseRoute } from '../router.js';
import { site, getRealisation, getTechno, getVeille, getVeilleTag, findVeilleOfTag } from '../content.js';
import { technoBlock, veilleBlock, veilleTagBlock } from '../blocks/index.js';
import { escapeHtml, safe } from '../utils/html.js';
import { hasModifier, isTypingTarget } from '../utils/keyboard.js';
import { readSetting, writeSetting } from '../utils/storage.js';
import { setPlainTitle } from '../ui/tab-title.js';
import { SECTIONS, findSection } from '../tui/sections.js';
import { homePage } from './home.js';
import { docPage, fichePage } from './doc.js';
import { SECTION_ICONS, ficheIcon, sidebar } from './parts.js';

// Rubriques affichées dans une colonne plus large (grands tableaux)
const WIDE_SECTIONS = ['competences', 'synthese'];

// Heure affichée sur l'accueil : celle de Nantes
const TIME_ZONE = 'Europe/Paris';

const THEME_KEY = 'remios:theme';
const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

export function createPageView(root) {
  root.innerHTML = '<div class="pg-screen"></div><p class="visually-hidden" aria-live="polite" data-announcer></p>';
  const screen = root.querySelector('.pg-screen');
  const announcer = root.querySelector('[data-announcer]');

  // Thème choisi lors d'une visite précédente ; sinon, celui du système
  const savedTheme = readSetting(THEME_KEY, '');
  if (['light', 'dark'].includes(savedTheme)) document.documentElement.dataset.theme = savedTheme;
  darkScheme.addEventListener('change', updateThemeButtons);

  // Adresse quittée au dernier changement de page. Ce module est créé avant
  // le routeur (main.js) : cet écouteur passe avant l'affichage de la page.
  let leftHash = null;
  window.addEventListener('hashchange', (event) => {
    leftHash = new URL(event.oldURL).hash || link.home();
  });

  let view = { kind: 'home' };
  let back = null;

  // --- Affichage ---------------------------------------------------------------

  function show(route, { focus = true } = {}) {
    view = resolve(route);
    // Ancienne adresse d'une fiche (anciennesAdresses) : l'adresse affichée
    // devient la nouvelle, sans créer d'entrée dans l'historique
    if (view.canonical && window.location.hash !== view.canonical) {
      window.history.replaceState(window.history.state, '', view.canonical);
    }
    back = view.kind === 'home' ? null : backTarget(view);
    screen.innerHTML = `${sidebar(view.nav)}<div class="pg-content">${view.render(back)}</div>`;
    root.classList.remove('pg--menu-open');
    screen.classList.remove('pg-has-toc');
    // Onglet : « Rémi MOREAU - Portfolio », précédé du nom de la page
    setPlainTitle(view.title ? `${view.title} — ${site.referencement.titre}` : site.referencement.titre);
    if (view.kind === 'fiche') buildToc();
    updateClock();
    updateThemeButtons();
    window.scrollTo(0, 0);

    if (focus) {
      // Le titre reçoit le focus : les lecteurs d'écran l'annoncent
      screen.querySelector('h1')?.focus({ preventScroll: true });
      announce(view.title ? `${view.title} : ouvert.` : 'Accueil.');
    }
  }

  // Associe une route à un écran : son type, son titre, sa place dans le menu
  // (`nav`), sa page parente (retour quand on arrive directement sur la page)
  // et une fonction qui produit son HTML.
  function resolve(route) {
    if (route.name === 'home') {
      return { kind: 'home', title: '', nav: { current: 'home' }, parent: link.home(), render: homePage };
    }

    if (route.name === 'section') {
      const section = findSection(route.id);
      if (section) return sectionView(section, () => section.render());
    }

    // #/veille/<sujet> : la veille, onglet du sujet ouvert. Sinon, ancienne
    // adresse d'un tag (#/veille/<tag>).
    if (route.name === 'veille') {
      const veille = getVeille(route.key);
      if (veille) return sectionView(findSection('veille'), () => veilleBlock(link.veilleTag, { sujet: veille.id }));
      const legacy = findVeilleOfTag(route.key);
      if (legacy) return resolve({ name: 'tag', sujet: legacy.id, tag: route.key });
    }

    if (route.name === 'fiche') {
      const fiche = getRealisation(route.slug);
      if (fiche) {
        return {
          kind: 'fiche',
          canonical: link.fiche(fiche.slug),
          title: fiche.titre,
          nav: { current: 'realisations', child: { icon: ficheIcon(fiche), label: safe(fiche.titre) } },
          parent: link.section('realisations'),
          render: (backLink) => fichePage(fiche, backLink),
        };
      }
    }

    if (route.name === 'techno') {
      const techno = getTechno(route.techno);
      if (techno) {
        const title = `Réalisations : ${techno.nom}`;
        return {
          kind: 'techno',
          title,
          nav: { current: 'realisations', child: { icon: '🏷️', label: escapeHtml(techno.nom) } },
          parent: link.section('realisations'),
          render: (backLink) =>
            docPage({
              crumbs: [
                { label: 'Réalisations', href: link.section('realisations'), icon: SECTION_ICONS.realisations },
                { label: escapeHtml(techno.nom), icon: '🏷️' },
              ],
              back: backLink,
              icon: '🏷️',
              title: escapeHtml(title),
              body: technoBlock(techno, link.fiche, link.techno),
            }),
        };
      }
    }

    if (route.name === 'tag') {
      const veille = getVeille(route.sujet);
      const tag = getVeilleTag(veille, route.tag);
      if (tag) {
        const title = `Veille ${veille.nom} : ${tag.nom}`;
        return {
          kind: 'tag',
          title,
          nav: { current: 'veille', child: { icon: '🔖', label: escapeHtml(tag.nom) } },
          parent: link.veille(veille.id),
          render: (backLink) =>
            docPage({
              crumbs: [
                { label: 'Veille technologique', href: link.veille(veille.id), icon: SECTION_ICONS.veille },
                { label: escapeHtml(tag.nom), icon: '🔖' },
              ],
              back: backLink,
              icon: '🔖',
              title: escapeHtml(title),
              body: veilleTagBlock(veille, route.tag, link.veilleTag),
            }),
        };
      }
    }

    return {
      kind: 'not-found',
      title: 'Page introuvable',
      nav: { current: null },
      parent: link.home(),
      render: (backLink) =>
        docPage({
          crumbs: [{ label: 'Page introuvable' }],
          back: backLink,
          icon: '🚧',
          title: 'Page introuvable',
          body: `<div class="prose pg-prose">
            <p>Cette page n'existe pas, ou plus : <code>${safe(window.location.hash)}</code></p>
            <p><a href="${link.home()}">Retour à l'accueil</a></p>
          </div>`,
        }),
    };
  }

  function sectionView(section, body) {
    return {
      kind: 'section',
      title: section.label,
      nav: { current: section.id },
      parent: link.home(),
      render: (backLink) =>
        docPage({
          crumbs: [{ label: section.label, icon: SECTION_ICONS[section.id] }],
          back: backLink,
          icon: SECTION_ICONS[section.id] ?? '📄',
          title: section.label,
          body: body(),
          wide: WIDE_SECTIONS.includes(section.id),
        }),
    };
  }

  // --- Retour à la page précédente ---------------------------------------------
  // Chaque entrée de l'historique du navigateur retient d'où l'on venait
  // (history.state.back) : « ← Retour » et Échap y ramènent, y compris après
  // Précédent / Suivant. Arrivé directement sur une page (lien partagé), on
  // revient à sa page parente : l'accueil, ou la rubrique de la fiche.

  function backTarget(target) {
    let state = window.history.state;
    if (!state || !('back' in state)) {
      state = { ...state, back: leftHash };
      window.history.replaceState(state, '');
    }
    leftHash = null;
    const href = state.back ?? target.parent;
    return { href, label: titleOf(href), viaHistory: state.back !== null };
  }

  function titleOf(hash) {
    const route = parseRoute(hash);
    if (route.name === 'home') return 'Accueil';
    if (route.name.startsWith('jury')) return 'Vue jury';
    return resolve(route).title;
  }

  function goBack() {
    if (!back) return;
    if (back.viaHistory) window.history.back();
    else navigate(back.href);
  }

  // --- Menu (téléphone) ---------------------------------------------------------

  function setMenu(open) {
    root.classList.toggle('pg--menu-open', open);
    screen.querySelector('.pg-backdrop').hidden = !open;
    screen.querySelector('.pg-content').inert = open;
    for (const button of screen.querySelectorAll('[data-action="menu"]')) button.setAttribute('aria-expanded', String(open));
    if (open) screen.querySelector('.pg-side-link[aria-current], .pg-side-link.is-active, .pg-side-link')?.focus();
    else screen.querySelector('.pg-content [data-action="menu"]')?.focus();
  }

  function isMenuOpen() {
    return root.classList.contains('pg--menu-open');
  }

  // --- Sommaire d'une fiche (grand écran) ------------------------------------------

  // Un lien par titre de la fiche. On ne passe pas par une ancre « #titre » :
  // le hash de l'URL sert déjà au routage (voir le clic plus bas).
  function buildToc() {
    const nav = screen.querySelector('[data-toc]');
    const headings = [...screen.querySelectorAll('.pg-prose h2')];
    if (!nav || headings.length < 3) return;
    headings.forEach((heading, i) => {
      heading.id = `pg-partie-${i}`;
      heading.tabIndex = -1;
    });
    const items = headings
      .map((h) => `<li><a href="${escapeHtml(window.location.hash)}" data-scroll-to="${h.id}">${escapeHtml(h.textContent)}</a></li>`)
      .join('');
    nav.innerHTML = `<p class="pg-toc-title">Sur cette page</p><ol>${items}</ol>`;
    nav.hidden = false;
    screen.classList.add('pg-has-toc');
  }

  // --- Heure de Nantes (accueil) ----------------------------------------------------

  const timeFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' });
  const offsetFormat = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, timeZoneName: 'shortOffset' });

  function updateClock() {
    const now = new Date();
    const time = screen.querySelector('[data-clock="time"]');
    const offset = screen.querySelector('[data-clock="offset"]');
    if (time) {
      time.textContent = timeFormat.format(now);
      time.dateTime = now.toISOString();
    }
    // « GMT+2 » → « UTC+2 »
    if (offset) offset.textContent = offsetFormat.formatToParts(now).find((p) => p.type === 'timeZoneName').value.replace('GMT', 'UTC');
  }
  window.setInterval(updateClock, 20_000);

  // --- Thème clair / sombre -----------------------------------------------------

  function currentTheme() {
    return document.documentElement.dataset.theme ?? (darkScheme.matches ? 'dark' : 'light');
  }

  function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    writeSetting(THEME_KEY, next);
    updateThemeButtons();
  }

  function updateThemeButtons() {
    const dark = currentTheme() === 'dark';
    for (const button of screen.querySelectorAll('[data-action="theme"]')) {
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Passer au thème clair' : 'Passer au thème sombre';
    }
  }

  // --- Clics : retour, menu, thème, filtres, réalisations à la une, veille, sommaire

  screen.addEventListener('click', (event) => {
    const backLink = event.target.closest('[data-back]');
    if (backLink && back?.viaHistory && event.button === 0 && !hasModifier(event) && !event.shiftKey) {
      event.preventDefault();
      goBack();
      return;
    }

    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'theme') toggleTheme();
    if (action === 'menu') setMenu(!isMenuOpen());
    if (action === 'close-menu') setMenu(false);
    if (action === 'next-synthese') nextCard(screen.querySelector('[data-stack]'));

    const filter = event.target.closest('[data-filter]');
    if (filter) filterRows(filter);

    const dot = event.target.closest('[data-slide]');
    if (dot) showSlide(dot.closest('[data-carousel]'), Number(dot.dataset.slide));

    const tocLink = event.target.closest('[data-scroll-to]');
    if (tocLink) {
      event.preventDefault();
      const heading = screen.querySelector(`#${tocLink.dataset.scrollTo}`);
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      heading.focus({ preventScroll: true });
    }
  });

  // Onglets « Toutes / Entreprise / Formation / Perso » de l'accueil
  function filterRows(button) {
    const db = button.closest('[data-db]');
    for (const tab of db.querySelectorAll('[data-filter]')) tab.setAttribute('aria-pressed', String(tab === button));
    const type = button.dataset.filter;
    for (const row of db.querySelectorAll('[data-type]')) row.hidden = Boolean(type) && row.dataset.type !== type;
  }

  function showSlide(carousel, index) {
    carousel.querySelectorAll('.pg-feature-slide').forEach((slide, i) => slide.toggleAttribute('data-off', i !== index));
    carousel.querySelectorAll('[data-slide]').forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
  }

  // Cartes empilées de la veille : la carte du dessus passe dessous
  function nextCard(stack) {
    const cards = [...stack.querySelectorAll('.pg-stack-card')];
    const current = cards.findIndex((card) => !card.hasAttribute('data-off'));
    const next = (current + 1) % cards.length;
    cards.forEach((card, i) => card.toggleAttribute('data-off', i !== next));
    announce(`Synthèse ${next + 1} sur ${cards.length}.`);
  }

  // --- Clavier -----------------------------------------------------------------

  function handleKey(event) {
    if (event.defaultPrevented || hasModifier(event) || isTypingTarget(event.target)) return;
    const { key } = event;

    if (key === 'Escape') {
      event.preventDefault();
      if (isMenuOpen()) setMenu(false);
      else goBack();
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      moveInList(event, key === 'ArrowDown' ? 1 : -1);
    } else if (view.kind === 'home' && /^[1-9]$/.test(key) && SECTIONS[Number(key) - 1]) {
      event.preventDefault();
      navigate(link.section(SECTIONS[Number(key) - 1].id));
    }
  }

  // Dans une liste de réalisations ou d'actualités, les flèches passent d'un
  // élément à l'autre une fois le focus dans la liste (ailleurs, elles font
  // défiler la page normalement). Les éléments masqués (filtre, autre page,
  // autre onglet) sont ignorés.
  function moveInList(event, step) {
    const list = document.activeElement?.closest('[data-nav-list]');
    if (!list) return;
    const links = [...list.querySelectorAll(':scope > li')]
      .filter((li) => !li.hidden && !li.closest('[data-off]'))
      .map((li) => li.querySelector('a'))
      .filter(Boolean);
    const current = links.indexOf(document.activeElement);
    if (current === -1) return;
    event.preventDefault();
    links[(current + step + links.length) % links.length].focus();
  }

  // --- Annonces pour lecteurs d'écran ---------------------------------------

  function announce(message) {
    announcer.textContent = '';
    window.setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }

  return { show, handleKey };
}
