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
//   #/veille/<sujet>             la veille, onglet de ce sujet ouvert
//   #/veille/<sujet>/<tag>       les actualités d'un sujet qui portent ce tag
//   #/jury                       vue rapide jury (style sobre)
//   #/jury/<slug>                une fiche en style sobre
//   #/jury/veille/<sujet>/<tag>  un tag de la veille en style sobre
//
// Anciennes adresses, d'avant les trois sujets de veille : #/veille/<tag> et
// #/jury/veille/<tag> mènent au premier sujet qui a ce tag.
//   #/jury/mentions-legales      mentions légales en style sobre
//
// Quand le hash change, le navigateur ne recharge pas la page : il émet un
// événement « hashchange », écouté ici. Chaque écran a donc une URL
// partageable, les boutons Précédent / Suivant fonctionnent, et le serveur
// n'a besoin d'aucune configuration particulière (il ne sert qu'index.html).
// =============================================================================

import { decodePath } from './utils/url.js';

// Construction des liens, pour ne jamais écrire les URL à la main ailleurs
export const link = {
  home: () => '#/',
  section: (id) => `#/${id}`,
  fiche: (slug) => `#/realisations/${slug}`,
  veille: (sujet) => `#/veille/${sujet}`,
  veilleTag: (sujet, tag) => `#/veille/${sujet}/${tag}`,
  jury: () => '#/jury',
  juryFiche: (slug) => `#/jury/${slug}`,
  juryVeilleTag: (sujet, tag) => `#/jury/veille/${sujet}/${tag}`,
  legal: () => '#/mentions-legales',
  juryLegal: () => '#/jury/mentions-legales',
};

// Traduit le hash de l'URL en description de l'écran à afficher.
// Un hash mal encodé (#/%E9) mène à l'écran d'erreur, sans bloquer le site.
export function parseRoute(hash = window.location.hash) {
  const path = decodePath(hash.replace(/^#\/?/, '')).replace(/\/+$/, '');
  const parts = path ? path.split('/') : [];

  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'jury' && parts.length === 1) return { name: 'jury' };
  if (parts[0] === 'jury' && parts.length === 2) return { name: 'jury-fiche', slug: parts[1] };
  if (parts[0] === 'jury' && parts[1] === 'veille' && parts.length === 3) return { name: 'jury-tag', sujet: null, tag: parts[2] };
  if (parts[0] === 'jury' && parts[1] === 'veille' && parts.length === 4) return { name: 'jury-tag', sujet: parts[2], tag: parts[3] };
  if (parts[0] === 'realisations' && parts.length === 2) return { name: 'fiche', slug: parts[1] };
  // Un sujet, ou une ancienne adresse de tag : tranché par l'écran, qui connaît les sujets
  if (parts[0] === 'veille' && parts.length === 2) return { name: 'veille', key: parts[1] };
  if (parts[0] === 'veille' && parts.length === 3) return { name: 'tag', sujet: parts[1], tag: parts[2] };
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
