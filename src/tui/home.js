// Écran d'accueil : logo ASCII « RM », informations façon neofetch à gauche,
// menu des rubriques numérotées à droite.

import { site } from '../content.js';
import { link } from '../router.js';
import { escapeHtml, safe } from '../utils/html.js';
import { box } from './box.js';
import { SECTIONS } from './sections.js';

// Logo en caractères ASCII (réutilisé par la commande neofetch du terminal)
export const LOGO = String.raw` ____  __  __
|  _ \|  \/  |
| |_) | |\/| |
|  _ <| |  | |
|_| \_\_|  |_|`;

export function homeBox() {
  const facts = site.neofetch.map(([key, value]) => `<dt>${safe(key)}</dt><dd>${safe(value)}</dd>`).join('');

  // aria-keyshortcuts : indique aux lecteurs d'écran le raccourci (1 à 8)
  const items = SECTIONS.map(
    (s, index) => `<li>
      <a class="menu-item" href="${link.section(s.id)}" data-index="${index}" aria-keyshortcuts="${s.key}">
        <span class="menu-key" aria-hidden="true">${s.key}</span><span>${s.label}</span>
      </a>
    </li>`,
  ).join('');

  return box({
    title: 'Bienvenue sur RémiOS',
    body: `<div class="home">
      <div class="home-id">
        <pre class="home-logo" aria-hidden="true">${escapeHtml(LOGO)}</pre>
        <dl class="home-facts">${facts}</dl>
      </div>
      <nav class="home-nav" aria-labelledby="menu-label">
        <p class="home-nav-label" id="menu-label">Choisis une rubrique :</p>
        <ul class="menu">${items}</ul>
      </nav>
    </div>`,
    actions: `<button type="button" class="tui-btn tui-btn--primary" data-action="open">&lt; Ouvrir &gt;</button>
      <button type="button" class="tui-btn" data-action="reboot">&lt;Redémarrer&gt;</button>`,
  });
}
