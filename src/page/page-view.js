// =============================================================================
// Vue page, façon Notion
// -----------------------------------------------------------------------------
// Affiche l'écran demandé par l'URL : l'accueil (une colonne centrée, voir
// home.js), ou une page façon Notion pour une rubrique, une fiche, une techno
// ou un tag de la veille (voir doc.js). Mêmes adresses que RémiOS.
//
// Pour toujours savoir où l'on est et où l'on va, le site est rangé comme un
// sommaire : l'accueil, les rubriques du menu dans l'ordre, et sous certaines
// rubriques leurs pages (fiches sous « Réalisations », tags sous « Veille »).
//   - menu latéral avec toutes les pages, la page affichée surlignée (sur
//     téléphone, il s'ouvre avec le bouton « Menu ») ;
//   - « ← <page parente> » en haut remonte d'un niveau : fiche → Réalisations,
//     rubrique → Accueil. Toujours la même destination, quel que soit le
//     chemin suivi (le bouton Précédent du navigateur, lui, suit l'historique) ;
//   - en bas de page, la page précédente et la suivante au même niveau.
//
// Clavier (rappelé par la touche ? et le bouton « Raccourcis clavier ») :
//   Échap      remonter d'un niveau (ou fermer le menu, une fenêtre)
//   ← →        page précédente / suivante : rubriques dans l'ordre du menu,
//              fiches dans l'ordre de la liste
//   ↑ ↓        élément précédent / suivant d'une liste (réalisations, menu…)
//   1 à 8      ouvrir une rubrique, 0 l'accueil
// =============================================================================

import { link, navigate, parseRoute } from '../router.js';
import { site, realisations, getRealisation, getTechno, getVeille, getVeilleTag, findVeilleOfTag } from '../content.js';
import { technoBlock, veilleBlock, veilleTagBlock } from '../blocks/index.js';
import { escapeHtml, safe } from '../utils/html.js';
import { hasModifier, isTypingTarget } from '../utils/keyboard.js';
import { readSetting, writeSetting } from '../utils/storage.js';
import { setPlainTitle } from '../ui/tab-title.js';
import { SECTIONS, findSection } from '../tui/sections.js';
import { homePage } from './home.js';
import { docPage, fichePage } from './doc.js';
import { SECTION_ICONS, ficheIcon, sidebar, siblingsNav } from './parts.js';
import keysHtml from './keys.html?raw';

// Rubriques affichées dans une colonne plus large (grands tableaux)
const WIDE_SECTIONS = ['competences', 'synthese'];

// Heure affichée sur l'accueil : celle de Nantes
const TIME_ZONE = 'Europe/Paris';

const THEME_KEY = 'remios:theme';
const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

export function createPageView(root) {
  root.innerHTML = `<div class="pg-screen"></div><p class="visually-hidden" aria-live="polite" data-announcer></p>${keysHtml}`;
  const screen = root.querySelector('.pg-screen');
  const announcer = root.querySelector('[data-announcer]');
  const keysDialog = root.querySelector('[data-keys]');

  // Thème choisi lors d'une visite précédente ; sinon, celui du système
  const savedTheme = readSetting(THEME_KEY, '');
  if (['light', 'dark'].includes(savedTheme)) document.documentElement.dataset.theme = savedTheme;
  darkScheme.addEventListener('change', updateThemeButtons);

  let view = { kind: 'home' };
  let back = null;
  let siblings = {};

  // --- Affichage ---------------------------------------------------------------

  function show(route, { focus = true } = {}) {
    view = resolve(route);
    // Ancienne adresse d'une fiche (anciennesAdresses) : l'adresse affichée
    // devient la nouvelle, sans créer d'entrée dans l'historique
    if (view.canonical && window.location.hash !== view.canonical) {
      window.history.replaceState(window.history.state, '', view.canonical);
    }
    back = view.kind === 'home' ? null : { href: view.parent, label: titleOf(view.parent) };
    siblings = siblingsOf(view);
    screen.innerHTML = `${sidebar(view.nav)}<div class="pg-content">${view.render(back, siblings)}</div>`;
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
          render: (backLink, around) => fichePage(fiche, backLink, around),
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
      sectionId: section.id,
      title: section.label,
      nav: { current: section.id },
      parent: link.home(),
      render: (backLink, around) =>
        docPage({
          crumbs: [{ label: section.label, icon: SECTION_ICONS[section.id] }],
          back: backLink,
          icon: SECTION_ICONS[section.id] ?? '📄',
          title: section.label,
          body: body() + siblingsNav(around, 'Autres rubriques'),
          wide: WIDE_SECTIONS.includes(section.id),
        }),
    };
  }

  // --- Se déplacer dans le site ------------------------------------------------
  // Remonter (« ← », Échap) : toujours vers la page parente. Page précédente /
  // suivante (← →, liens du bas) : l'accueil puis les rubriques dans l'ordre
  // du menu ; les fiches dans l'ordre de la liste des réalisations.

  function titleOf(hash) {
    const route = parseRoute(hash);
    if (route.name === 'home') return 'Accueil';
    if (route.name.startsWith('jury')) return 'Vue jury';
    return resolve(route).title;
  }

  function goUp() {
    if (back) navigate(back.href);
  }

  function siblingsOf(target) {
    const page = (href, label, icon) => ({ href, label, icon });
    if (target.kind === 'home' || (target.kind === 'section' && SECTIONS.some((s) => s.id === target.sectionId))) {
      const order = [page(link.home(), 'Accueil', SECTION_ICONS.home), ...SECTIONS.map((s) => page(link.section(s.id), s.label, SECTION_ICONS[s.id]))];
      const index = target.kind === 'home' ? 0 : SECTIONS.findIndex((s) => s.id === target.sectionId) + 1;
      return { prev: order[index - 1], next: order[index + 1] };
    }
    if (target.kind === 'fiche') {
      const index = realisations.findIndex((r) => link.fiche(r.slug) === target.canonical);
      const fiche = (r) => r && page(link.fiche(r.slug), r.titre, ficheIcon(r));
      return { prev: fiche(realisations[index - 1]), next: fiche(realisations[index + 1]) };
    }
    return {};
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
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'keys') showKeys();
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

  // ← → sur la réalisation à la une : la précédente ou la suivante
  function moveSlide(carousel, step) {
    const dots = [...carousel.querySelectorAll('[data-slide]')];
    if (dots.length === 0) return;
    const current = dots.findIndex((dot) => dot.getAttribute('aria-pressed') === 'true');
    const next = (current + step + dots.length) % dots.length;
    showSlide(carousel, next);
    if (document.activeElement?.matches('[data-slide]')) dots[next].focus();
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

  // Les onglets et la pagination gèrent eux-mêmes ← → quand ils ont le focus
  // (ui/tabs.js, ui/pager.js) : la touche arrive ici déjà traitée.
  function handleKey(event) {
    if (event.defaultPrevented || hasModifier(event) || isTypingTarget(event.target)) return;
    const { key } = event;

    if (key === 'Escape') {
      event.preventDefault();
      if (isMenuOpen()) setMenu(false);
      else goUp();
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const step = key === 'ArrowRight' ? 1 : -1;
      const carousel = document.activeElement?.closest('[data-carousel]');
      if (carousel) {
        event.preventDefault();
        moveSlide(carousel, step);
        return;
      }
      const target = step > 0 ? siblings.next : siblings.prev;
      if (target) {
        event.preventDefault();
        navigate(target.href);
      }
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      moveInList(event, key === 'ArrowDown' ? 1 : -1);
    } else if (key === '?') {
      event.preventDefault();
      showKeys();
    } else if (key === '0') {
      event.preventDefault();
      navigate(link.home());
    } else if (/^[1-9]$/.test(key) && SECTIONS[Number(key) - 1]) {
      event.preventDefault();
      navigate(link.section(SECTIONS[Number(key) - 1].id));
    }
  }

  // ↑ ↓ passent d'un élément à l'autre d'une liste : le menu latéral, ou les
  // listes de la page (réalisations, actualités…) prises à la suite. Hors
  // d'une liste, ↓ y entre si elle est à l'écran ; sinon les flèches font
  // défiler la page normalement. Les éléments masqués (filtre, autre page,
  // autre onglet) sont ignorés.
  function moveInList(event, step) {
    const active = document.activeElement;
    const inSide = active?.closest('.pg-side');
    const links = inSide
      ? [...inSide.querySelectorAll('a.pg-side-link')]
      : [...screen.querySelectorAll('.pg-content [data-nav-list] > li')]
          .filter((li) => !li.hidden && !li.closest('[data-off]'))
          .map((li) => li.querySelector('a'))
          .filter(Boolean);
    if (links.length === 0) return;

    const current = links.indexOf(active);
    if (current === -1) {
      const first = links[0];
      const top = first.getBoundingClientRect().top;
      if (inSide || step < 0 || top < 0 || top > window.innerHeight - 40) return;
      event.preventDefault();
      first.focus();
      return;
    }
    event.preventDefault();
    links[Math.min(Math.max(current + step, 0), links.length - 1)].focus();
  }

  // --- Aide : raccourcis clavier ----------------------------------------------

  function showKeys() {
    if (!keysDialog.open) keysDialog.showModal();
  }

  keysDialog.addEventListener('click', (event) => {
    // Clic sur « Fermer », ou à côté de la fenêtre (sur le fond)
    if (event.target === keysDialog || event.target.closest('[data-close]')) keysDialog.close();
  });

  // --- Annonces pour lecteurs d'écran ---------------------------------------

  function announce(message) {
    announcer.textContent = '';
    window.setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }

  return { show, handleKey };
}
