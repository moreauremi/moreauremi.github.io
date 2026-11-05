// =============================================================================
// Thème clair ou sombre
// -----------------------------------------------------------------------------
// Par défaut, le site suit le réglage du système (« apparence sombre » de
// macOS, Windows, Android, iOS), y compris s'il change pendant la visite.
// Un clic sur le bouton lune / soleil (en haut à droite, à droite de « EN »)
// ou sur « Mode sombre » (en-tête de la vue jury)
// impose l'autre thème : ce choix est mémorisé dans le navigateur, et prend
// le pas sur le réglage du système aux visites suivantes.
//
// Le thème est l'attribut data-theme de <html> (« light » ou « dark ») :
// src/styles/tokens.css redéfinit les couleurs du thème sombre. Les pages
// d'erreur 404 et 403 font de même, sans ce module (voir src/errors.js).
// =============================================================================

import { readSetting, writeSetting } from './storage.js';

export const THEME_KEY = 'remios:theme';
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set();

function saved() {
  const value = readSetting(THEME_KEY, '');
  return value === 'dark' || value === 'light' ? value : null;
}

export function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

// Applique le thème mémorisé, ou à défaut celui du système
export function applyTheme() {
  document.documentElement.dataset.theme = saved() ?? (systemDark.matches ? 'dark' : 'light');
  for (const listener of listeners) listener(currentTheme());
}

// Passe à l'autre thème et mémorise ce choix
export function toggleTheme() {
  writeSetting(THEME_KEY, currentTheme() === 'dark' ? 'light' : 'dark');
  applyTheme();
}

export function onThemeChange(listener) {
  listeners.add(listener);
}

// Réglage du système modifié pendant la visite : suivi, sauf choix mémorisé
systemDark.addEventListener?.('change', applyTheme);
