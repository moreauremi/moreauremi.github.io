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
//   #/technos/<techno>           les réalisations qui utilisent une techno
//   #/veille/<sujet>             la veille, onglet de ce sujet ouvert
//   #/veille/<sujet>/<tag>       les actualités d'un sujet qui portent ce tag
//   #/jury                       vue rapide jury (style sobre)
//   #/jury/<slug>                une fiche en style sobre
//   #/jury/technos/<techno>      une techno en style sobre
//   #/jury/veille/<sujet>/<tag>  un tag de la veille en style sobre
//   #/jury/mentions-legales      mentions légales en style sobre
//
// Anciennes adresses, d'avant les trois sujets de veille : #/veille/<tag> et
// #/jury/veille/<tag> mènent au premier sujet qui a ce tag.
//
// Version anglaise : les mêmes adresses, précédées de « en/ » (#/en/,
// #/en/realisations/homelab, #/en/jury…). Sans ce préfixe, le site est en
// français. Chaque adresse donne donc toujours la même langue : un lien
// partagé s'ouvre comme il a été copié.
//
// Quand le hash change, le navigateur ne recharge pas la page : il émet un
// événement « hashchange », écouté ici. Chaque écran a donc une URL
// partageable, les boutons Précédent / Suivant fonctionnent, et le serveur
// n'a besoin d'aucune configuration particulière (il ne sert qu'index.html).
// =============================================================================

import { decodePath } from './utils/url.js';
import { currentLang } from './utils/lang.js';

// Début des adresses dans la langue affichée : « #/ » ou « #/en/ »
const start = () => (currentLang() === 'en' ? '#/en/' : '#/');

// Construction des liens, pour ne jamais écrire les URL à la main ailleurs.
// Ils restent dans la langue affichée.
export const link = {
  home: () => start(),
  section: (id) => `${start()}${id}`,
  fiche: (slug) => `${start()}realisations/${slug}`,
  techno: (slug) => `${start()}technos/${slug}`,
  veille: (sujet) => `${start()}veille/${sujet}`,
  veilleTag: (sujet, tag) => `${start()}veille/${sujet}/${tag}`,
  jury: () => `${start()}jury`,
  juryFiche: (slug) => `${start()}jury/${slug}`,
  juryTechno: (slug) => `${start()}jury/technos/${slug}`,
  juryVeilleTag: (sujet, tag) => `${start()}jury/veille/${sujet}/${tag}`,
  legal: () => `${start()}mentions-legales`,
  juryLegal: () => `${start()}jury/mentions-legales`,
};

// Le même écran dans une autre langue : #/realisations/glpi ↔ #/en/realisations/glpi
export function hashInLang(lang, hash = window.location.hash) {
  const path = hash.replace(/^#\/?/, '').replace(/^en(?:\/|$)/, '');
  return lang === 'en' ? `#/en/${path}` : `#/${path}`;
}

// Traduit le hash de l'URL en description de l'écran à afficher, avec sa
// langue (`lang`). Un hash mal encodé (#/%E9) mène à l'écran d'erreur, sans
// bloquer le site.
export function parseRoute(hash = window.location.hash) {
  const path = decodePath(hash.replace(/^#\/?/, '')).replace(/\/+$/, '');
  const all = path ? path.split('/') : [];
  const lang = all[0] === 'en' ? 'en' : 'fr';
  return { lang, ...screenOf(lang === 'en' ? all.slice(1) : all, path) };
}

// Écran désigné par les parties de l'adresse (sans le préfixe de langue)
function screenOf(parts, path) {
  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'jury' && parts.length === 1) return { name: 'jury' };
  if (parts[0] === 'jury' && parts.length === 2) return { name: 'jury-fiche', slug: parts[1] };
  if (parts[0] === 'jury' && parts[1] === 'technos' && parts.length === 3) return { name: 'jury-techno', techno: parts[2] };
  if (parts[0] === 'jury' && parts[1] === 'veille' && parts.length === 3) return { name: 'jury-tag', sujet: null, tag: parts[2] };
  if (parts[0] === 'jury' && parts[1] === 'veille' && parts.length === 4) return { name: 'jury-tag', sujet: parts[2], tag: parts[3] };
  if (parts[0] === 'realisations' && parts.length === 2) return { name: 'fiche', slug: parts[1] };
  if (parts[0] === 'technos' && parts.length === 2) return { name: 'techno', techno: parts[1] };
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
