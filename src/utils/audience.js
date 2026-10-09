// =============================================================================
// Mesure d'audience (GoatCounter), sans script extérieur
// -----------------------------------------------------------------------------
// Chaque écran affiché (#/, #/veille, #/realisations/nas…) est compté une
// fois, par une requête vers le point de comptage de GoatCounter (adresse :
// audience.goatcounter dans content/site.config.js). C'est ce que fait le
// script officiel de GoatCounter, qui n'est pas chargé : le site ne charge
// aucun script extérieur. Seuls la page, le site d'origine et la largeur de
// l'écran sont envoyés ; aucun cookie, aucun identifiant.
//
// Rien n'est envoyé :
//   - ailleurs que sur le site publié (développement, tests, homelab) ;
//   - par un navigateur piloté par un programme (tests automatiques, robots) ;
//   - si le navigateur demande à ne pas être suivi (Do Not Track, Global
//     Privacy Control) ;
//   - sur un appareil où le propriétaire a ouvert #toggle-goatcounter (même
//     convention que le script officiel : ses propres visites ne comptent pas).
// =============================================================================

import { site } from '../content.js';

const ENDPOINT = site.audience?.goatcounter ? `${new URL(site.audience.goatcounter).origin}/count` : '';
const SKIP_KEY = 'skipgc'; // clé du script officiel de GoatCounter
const TOGGLE_HASH = '#toggle-goatcounter';

let lastPath = null;
let firstView = true;

// Adresse #toggle-goatcounter : arrête (ou reprend) le comptage des visites de
// cet appareil, et remplace l'adresse par celle de l'accueil. À appeler avant
// chaque affichage (au chargement, et quand l'adresse change alors que le site
// est déjà ouvert). Renvoie true si l'adresse était celle-là.
export function handleCountingToggle() {
  if (window.location.hash !== TOGGLE_HASH) return false;
  let message;
  try {
    const skipped = localStorage.getItem(SKIP_KEY) === 't';
    if (skipped) localStorage.removeItem(SKIP_KEY);
    else localStorage.setItem(SKIP_KEY, 't');
    message = skipped
      ? 'Les visites de cet appareil sont de nouveau comptées.'
      : "Les visites de cet appareil ne sont plus comptées (pour revenir en arrière : rouvrir #toggle-goatcounter).";
  } catch {
    message = "Impossible : ce navigateur bloque l'enregistrement du réglage.";
  }
  history.replaceState(null, '', '#/');
  window.alert(message);
  return true;
}

// Compte l'écran correspondant au hash, s'il est différent du précédent
export function countView(hash = window.location.hash) {
  if (!shouldCount()) return;
  const path = `/${hash.replace(/^#\/?/, '').replace(/\/+$/, '')}`;
  if (path === lastPath) return;
  lastPath = path;

  const params = new URLSearchParams({ p: path, s: String(window.screen.width) });
  // Site d'origine (moteur de recherche, LinkedIn…), seulement à l'arrivée
  if (firstView && document.referrer && !document.referrer.startsWith(window.location.origin)) {
    params.set('r', document.referrer);
  }
  firstView = false;
  params.set('rnd', Math.random().toString(36).slice(2, 7)); // contre les caches
  const url = `${ENDPOINT}?${params}`;
  if (!navigator.sendBeacon?.(url)) new Image().src = url;
}

function shouldCount() {
  if (!ENDPOINT || !site.urlPublique) return false;
  if (window.location.hostname !== new URL(site.urlPublique).hostname) return false;
  if (navigator.webdriver) return false;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true) return false;
  try {
    return localStorage.getItem(SKIP_KEY) !== 't';
  } catch {
    return true;
  }
}
