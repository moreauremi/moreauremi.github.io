// Mémorisation de petits réglages dans le navigateur (localStorage).
// localStorage peut être indisponible : navigation privée, cookies bloqués,
// stockage plein… Chaque accès est donc protégé par try/catch et le site
// fonctionne normalement sans lui (le réglage n'est simplement pas retenu).

export function readSetting(key, fallback) {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeSetting(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Stockage indisponible : le réglage vaudra pour cette visite seulement
  }
}
