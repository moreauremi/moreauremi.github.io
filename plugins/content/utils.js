// Petites fonctions communes aux modules du plugin de contenu.

import path from 'node:path';

// Message d'erreur du build : le fichier à corriger, puis une ligne par problème
export function formatErrors(file, errors) {
  return `\n\n${file} : à corriger\n${errors.map((e) => `  - ${e}`).join('\n')}\n`;
}

export function isFilled(value) {
  return typeof value === 'string' && value.trim() !== '';
}

export function isTextList(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

// Chemin avec des « / », même sous Windows (« content\pages » → « content/pages »)
export function toPosix(file) {
  return file.split(path.sep).join('/');
}
