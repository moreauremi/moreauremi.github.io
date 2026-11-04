// =============================================================================
// Version anglaise : fichiers .en.md et traductions de la configuration
// -----------------------------------------------------------------------------
// content/realisations/homelab.en.md traduit content/realisations/homelab.md
// (de même pour content/pages/ et content/veille/<sujet>/). Le français reste
// la référence :
//   - l'en-tête d'une traduction ne contient que les champs à traduire ; tous
//     les autres viennent du fichier français ;
//   - une traduction sans fichier français arrête le build (fichier renommé
//     d'un côté seulement…) ;
//   - dans content/site.config.js, chaque champ d'un objet « en » doit
//     exister dans l'objet français qu'il traduit (une faute de frappe, comme
//     « libele », serait sinon ignorée sans prévenir).
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { isPlainObject } from '../../src/utils/lang.js';
import { toPosix } from './utils.js';

// Champs de l'en-tête qui se traduisent. Les autres (slug, type, date,
// technos, compétences, brouillon…) sont communs aux deux langues.
export const TRANSLATED_FIELDS = ['titre', 'resume', 'statut', 'description', 'lettre'];

export function isTranslation(file) {
  return file.endsWith('.en.md');
}

// « content/realisations/homelab.en.md » → « content/realisations/homelab.md »
export function frenchFileOf(file) {
  return file.replace(/\.en\.md$/, '.md');
}

// En-tête d'une traduction : seulement des champs à traduire
export function checkTranslatedFields(data, frenchFile) {
  return Object.keys(data)
    .filter((key) => !TRANSLATED_FIELDS.includes(key))
    .map((key) => `« ${key} » est commun aux deux langues : il se règle dans ${frenchFile}, à retirer de la traduction (champs traduisibles : ${TRANSLATED_FIELDS.join(', ')}).`);
}

// Traductions sans fichier français
export function checkOrphanTranslations(root) {
  return translationFiles(root)
    .filter((file) => !fs.existsSync(path.join(root, frenchFileOf(file))))
    .map((file) => `${file} : aucun fichier ${path.posix.basename(frenchFileOf(file))} à traduire à côté. Renommer la traduction comme le fichier français, avec .en.md à la fin.`);
}

// Toutes les traductions de content/, chemins relatifs à la racine du projet
export function translationFiles(root) {
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const file = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(file);
      else if (isTranslation(entry.name)) found.push(toPosix(file));
    }
  };
  walk('content');
  return found;
}

// Objets « en » de la configuration : des objets, dont chaque champ traduit
// un champ qui existe en français
export function checkConfigTranslations(site) {
  const errors = [];
  const visit = (value, label) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${label}[${index}]`));
      return;
    }
    if (!isPlainObject(value)) return;
    if (value.en !== undefined) {
      if (!isPlainObject(value.en)) errors.push(`« ${label || 'la configuration'}.en » doit être un objet : { champ: 'texte en anglais' }.`);
      else compare(value, value.en, label);
    }
    for (const [key, item] of Object.entries(value)) if (key !== 'en') visit(item, label ? `${label}.${key}` : key);
  };
  const compare = (french, english, label) => {
    for (const [key, item] of Object.entries(english)) {
      const where = `${label ? `${label}.` : ''}en.${key}`;
      if (!(key in french)) errors.push(`« ${where} » ne correspond à aucun champ français (faute de frappe ?).`);
      else if (isPlainObject(item) && isPlainObject(french[key])) compare(french[key], item, label ? `${label}.${key}` : key);
    }
  };
  visit(site, '');
  return errors;
}
