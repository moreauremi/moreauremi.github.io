// Petites aides communes aux blocs de contenu.

// Attributs d'un lien qui s'ouvre dans un nouvel onglet
export const NEW_TAB = 'target="_blank" rel="noopener noreferrer"';

// « https://www.github.com/moreauremi » → « github.com/moreauremi »
export function shortUrl(url) {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}
