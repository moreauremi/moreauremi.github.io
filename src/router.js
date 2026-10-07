// =============================================================================
// Routage par « hash »
// -----------------------------------------------------------------------------
// Tout le site tient dans une seule page (index.html). La partie de l'URL après
// le « # » indique quel écran afficher :
//
//   #/                           menu principal
//   #/presentation … #/contact   une rubrique du menu
//   #/mentions-legales           page hors menu (lien en bas d'écran)
//   #/realisations/<slug>        une fiche de réalisation (style RémiOS)
//   #/veille/<tag>               les actualités de la veille qui portent ce tag
//   #/jury                       vue rapide jury (style sobre)
//   #/jury/<slug>                une fiche en style sobre
//   #/jury/veille/<tag>          un tag de la veille en style sobre
//   #/jury/mentions-legales      mentions légales en style sobre
//
// Quand le hash change, le navigateur ne recharge pas la page : il émet un
// événement « hashchange », écouté ici. Chaque écran a donc une URL
// partageable, les boutons Précédent / Suivant fonctionnent, et le serveur
// n'a besoin d'aucune configuration particulière (il ne sert qu'index.html).
// =============================================================================

// Construction des liens, pour ne jamais écrire les URL à la main ailleurs
export const link = {
  home: () => '#/',
  section: (id) => `#/${id}`,
  fiche: (slug) => `#/realisations/${slug}`,
  veilleTag: (tag) => `#/veille/${tag}`,
  jury: () => '#/jury',
  juryFiche: (slug) => `#/jury/${slug}`,
  juryVeilleTag: (tag) => `#/jury/veille/${tag}`,
  legal: () => '#/mentions-legales',
  juryLegal: () => '#/jury/mentions-legales',
};

// Traduit le hash de l'URL en description de l'écran à afficher
export function parseRoute(hash = window.location.hash) {
  const path = decodeURIComponent(hash.replace(/^#\/?/, '')).replace(/\/+$/, '');
  const parts = path ? path.split('/') : [];

  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'jury' && parts.length === 1) return { name: 'jury' };
  if (parts[0] === 'jury' && parts.length === 2) return { name: 'jury-fiche', slug: parts[1] };
  if (parts[0] === 'jury' && parts[1] === 'veille' && parts.length === 3) return { name: 'jury-tag', tag: parts[2] };
  if (parts[0] === 'realisations' && parts.length === 2) return { name: 'fiche', slug: parts[1] };
  if (parts[0] === 'veille' && parts.length === 2) return { name: 'tag', tag: parts[1] };
  if (parts.length === 1) return { name: 'section', id: parts[0] };
  return { name: 'not-found', path };
}

// Appelle `callback` avec le nouvel écran à chaque changement d'URL
export function onRouteChange(callback) {
  window.addEventListener('hashchange', () => callback(parseRoute()));
}

// Change d'écran depuis le code (équivaut à cliquer sur un lien)
export function navigate(hash) {
  window.location.hash = hash;
}
