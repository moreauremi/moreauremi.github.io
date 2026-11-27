// =============================================================================
// Mesure d'audience avec GoatCounter, sans script extérieur ni cookie
// -----------------------------------------------------------------------------
// Une requête par page vue, envoyée par le site lui-même (la CSP n'autorise
// aucun script extérieur). Rien n'est compté :
//   - hors du site publié (npm run dev, tests, copie locale) ;
//   - pour les robots de test (navigator.webdriver) ;
//   - pour les navigateurs qui demandent à ne pas être suivis ;
//   - sur un appareil exclu : ouvrir une fois https://remim.me/#toggle-goatcounter
//     (même clé que le script officiel de GoatCounter).
// =============================================================================

const SKIP_KEY = 'skipgc';
const TOGGLE_HASH = '#toggle-goatcounter';

export function handleCountingToggle() {
  if (window.location.hash !== TOGGLE_HASH) return false;
  let message;
  try {
    const skipped = localStorage.getItem(SKIP_KEY) === 't';
    if (skipped) localStorage.removeItem(SKIP_KEY);
    else localStorage.setItem(SKIP_KEY, 't');
    message = skipped
      ? 'les visites de cet appareil sont de nouveau comptées.'
      : 'les visites de cet appareil ne sont plus comptées (pour revenir en arrière : rouvrir #toggle-goatcounter).';
  } catch {
    message = "impossible : ce navigateur bloque l'enregistrement du réglage.";
  }
  history.replaceState(null, '', window.location.pathname);
  window.alert(message);
  return true;
}

// `endpoint` : adresse GoatCounter ; `site` : adresse publique du site
export function countView({ endpoint, site }) {
  if (!endpoint || !site) return;
  if (window.location.hostname !== new URL(site).hostname) return;
  if (navigator.webdriver) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  try {
    if (localStorage.getItem(SKIP_KEY) === 't') return;
  } catch {
    // stockage indisponible : la visite est comptée
  }

  // Chemin de la page depuis la racine du site : « /projets/glpi/ »
  const root = new URL(document.documentElement.dataset.root || './', window.location.href).pathname;
  const path = `/${window.location.pathname.slice(root.length)}`;
  const params = new URLSearchParams({ p: path, s: String(window.screen.width) });
  if (document.referrer && !document.referrer.startsWith(window.location.origin)) params.set('r', document.referrer);
  params.set('rnd', Math.random().toString(36).slice(2, 7)); // contre les caches
  const url = `${new URL(endpoint).origin}/count?${params}`;
  if (!navigator.sendBeacon?.(url)) new Image().src = url;
}
