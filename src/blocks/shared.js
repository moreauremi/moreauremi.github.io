// Petites aides communes aux blocs de contenu.

import { currentLang } from '../utils/lang.js';
import { frenchSpacing } from '../utils/html.js';

// Attributs d'un lien qui s'ouvre dans un nouvel onglet
export const NEW_TAB = 'target="_blank" rel="noopener noreferrer"';

// « https://www.github.com/moreauremi » → « github.com/moreauremi »
export function shortUrl(url) {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

// Typographie française (espaces insécables avant « : » et « ; ») : en
// français seulement
export function typography(html) {
  return currentLang() === 'fr' ? frenchSpacing(html) : html;
}

// Texte affiché dans une autre langue que le site (contenu pas encore
// traduit) : attribut lang, pour que les lecteurs d'écran le lisent avec la
// bonne prononciation. `textLang` : langue du texte.
export function langAttr(textLang) {
  return textLang && textLang !== currentLang() ? ` lang="${textLang}"` : '';
}

// Avertissement en tête d'un texte resté en français dans la version anglaise
// (seul cas possible : le français est la langue d'origine). `message` : la
// phrase affichée, en anglais.
export function untranslatedNote(textLang, message = 'This text has not been translated yet: it is shown in French.') {
  if (!textLang || textLang === currentLang()) return '';
  return `<p class="lang-note">${message}</p>`;
}
