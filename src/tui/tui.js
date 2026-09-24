// =============================================================================
// Interface RémiOS façon ncurses / whiptail
// -----------------------------------------------------------------------------
// Affiche l'écran demandé par l'URL (menu, rubrique, fiche…) dans une boîte
// grise sur fond bleu, et gère la navigation au clavier :
//
//   ↑ ↓        se déplacer dans le menu ou dans une liste
//   Entrée     ouvrir l'élément sélectionné
//   1 à 7      ouvrir directement une rubrique (depuis le menu)
//   Échap      revenir à l'écran précédent
//
// La souris et le tactile fonctionnent aussi : tous les éléments cliquables
// sont de vrais liens <a> ou boutons <button>.
// =============================================================================

import { link, navigate } from '../router.js';
import { getRealisation, TYPES } from '../content.js';
import { ficheBlock } from '../blocks.js';
import { safe } from '../utils/html.js';
import { hasModifier, isTypingTarget } from '../utils/keyboard.js';
import { box, backButton } from './box.js';
import { homeBox } from './home.js';
import { SECTIONS, findSection } from './sections.js';

const DEFAULT_TITLE = 'RémiOS — Portfolio BTS SIO de Rémi Moreau';

export function createTui(root, { onReboot, onOpenTerminal }) {
  root.innerHTML = `
    <header class="tui-bar">
      <span class="tui-bar-tty">RémiOS 1.0 <span class="tui-bar-extra">(tty1)</span></span>
      <button type="button" class="tui-bar-tty2" data-action="terminal" aria-label="Ouvrir le terminal">[tty2]</button>
      <span class="tui-bar-title">Portfolio BTS SIO SISR</span>
    </header>
    <div class="tui-stage"></div>
    <p class="tui-hints">↑ ↓ naviguer · Entrée ouvrir · Échap revenir · 1 à ${SECTIONS.length} accès direct</p>
    <p class="visually-hidden" aria-live="polite" data-announcer></p>`;

  const stage = root.querySelector('.tui-stage');
  const announcer = root.querySelector('[data-announcer]');

  let view = { kind: 'home' }; // écran affiché
  let selected = 0; // rubrique sélectionnée dans le menu

  // --- Affichage ---------------------------------------------------------------

  // Affiche l'écran correspondant à la route. `focus` : faut-il déplacer le
  // focus clavier ? (non au premier affichage, caché sous le boot)
  function show(route, { focus = true } = {}) {
    view = resolve(route);
    stage.innerHTML = view.html;
    document.title = view.title ? `${view.title} — RémiOS` : DEFAULT_TITLE;
    window.scrollTo(0, 0);

    if (view.kind === 'home') {
      select(selected, focus);
    } else if (focus) {
      // Le titre de la boîte reçoit le focus : les lecteurs d'écran l'annoncent,
      // et Tab mène ensuite au contenu de la boîte.
      stage.querySelector('.tui-box-title').focus({ preventScroll: true });
      announce(`${view.title} : ouvert.`);
    }
  }

  // Associe une route à un écran : son type, son titre, son HTML et l'écran
  // parent (destination de « < Retour > » et de la touche Échap).
  function resolve(route) {
    if (route.name === 'home') {
      return { kind: 'home', title: '', html: homeBox(), parent: link.home() };
    }

    if (route.name === 'section') {
      const section = findSection(route.id);
      if (section) {
        selected = SECTIONS.indexOf(section); // retour au menu : rubrique resélectionnée
        return {
          kind: 'section',
          title: section.label,
          html: box({ title: section.label, body: section.render(), actions: backButton(link.home()) }),
          parent: link.home(),
        };
      }
    }

    if (route.name === 'fiche') {
      const fiche = getRealisation(route.slug);
      if (fiche) {
        // Parent de la fiche : la rubrique qui liste son type (entreprise, perso…)
        const section = findSection(TYPES[fiche.type].section);
        selected = SECTIONS.indexOf(section);
        return {
          kind: 'fiche',
          title: fiche.titre,
          html: box({ title: safe(fiche.titre), body: ficheBlock(fiche), actions: backButton(link.section(section.id)) }),
          parent: link.section(section.id),
        };
      }
    }

    return notFound();
  }

  function notFound() {
    return {
      kind: 'not-found',
      title: 'Erreur',
      html: box({
        title: 'Erreur',
        body: `<p>bash: ${safe(window.location.hash)} : aucun fichier ou dossier de ce nom</p>
          <p>Cette page n'existe pas, ou plus.</p>`,
        actions: backButton(link.home()),
      }),
      parent: link.home(),
    };
  }

  // --- Menu --------------------------------------------------------------------

  // Sélectionne la rubrique n° index (en boucle : après la dernière, la première)
  function select(index, focus) {
    const items = [...stage.querySelectorAll('.menu-item')];
    if (items.length === 0) return;
    selected = (index + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle('is-selected', i === selected));
    if (focus) items[selected].focus({ preventScroll: true });
  }

  // Le focus clavier (Tab) ou un clic sur une rubrique la sélectionne aussi
  stage.addEventListener('focusin', (event) => {
    const item = event.target.closest('.menu-item');
    if (item) select(Number(item.dataset.index), false);
  });

  // Entrée discrète vers le terminal caché, dans la barre du haut
  root.querySelector('[data-action="terminal"]').addEventListener('click', onOpenTerminal);

  // Boutons « < Ouvrir > » et « <Redémarrer> »
  stage.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'open') navigate(link.section(SECTIONS[selected].id));
    if (action === 'reboot') onReboot();
  });

  // --- Clavier -----------------------------------------------------------------

  function handleKey(event) {
    if (event.defaultPrevented || hasModifier(event) || isTypingTarget(event.target)) return;
    const { key } = event;

    if (view.kind === 'home') {
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault(); // sinon la page défile
        select(selected + (key === 'ArrowDown' ? 1 : -1), true);
      } else if (key === 'Home' || key === 'End') {
        event.preventDefault();
        select(key === 'Home' ? 0 : SECTIONS.length - 1, true);
      } else if (/^[1-9]$/.test(key) && SECTIONS[Number(key) - 1]) {
        event.preventDefault();
        navigate(link.section(SECTIONS[Number(key) - 1].id));
      } else if (key === 'Enter' && !event.target.closest('a, button')) {
        // Entrée alors qu'aucun lien n'a le focus : ouvre la rubrique sélectionnée
        navigate(link.section(SECTIONS[selected].id));
      }
      return;
    }

    if (key === 'Escape' || key === 'Backspace') {
      event.preventDefault();
      navigate(view.parent);
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      moveInList(event, key === 'ArrowDown' ? 1 : -1);
    }
  }

  // Dans une rubrique qui contient une liste de fiches, les flèches passent
  // d'une fiche à l'autre (ailleurs, elles font défiler la page normalement).
  function moveInList(event, step) {
    const links = [...stage.querySelectorAll('[data-nav-list] a')];
    if (links.length === 0) return;
    event.preventDefault();
    const current = links.indexOf(document.activeElement);
    const next = current === -1 ? (step > 0 ? 0 : links.length - 1) : (current + step + links.length) % links.length;
    links[next].focus();
  }

  // --- Annonces pour lecteurs d'écran ---------------------------------------

  // La zone aria-live lit à voix haute tout texte qu'on y place. On la vide
  // d'abord pour qu'un message identique au précédent soit bien relu.
  function announce(message) {
    announcer.textContent = '';
    window.setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }

  // Place le focus sur la rubrique sélectionnée (utilisé à la fin du boot)
  function focusMenu() {
    if (view.kind === 'home') select(selected, true);
    else stage.querySelector('.tui-box-title')?.focus({ preventScroll: true });
  }

  return { show, handleKey, focusMenu, announce };
}
