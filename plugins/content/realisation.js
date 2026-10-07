// =============================================================================
// Vérification d'une fiche de réalisation (content/realisations/*.md)
// -----------------------------------------------------------------------------
// Chaque champ de l'en-tête (frontmatter) est contrôlé ; chaque problème
// devient une ligne du message d'erreur du build.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { CONFIG_FILE } from './config.js';
import { isFilled, isTextList } from './utils.js';

const TYPES = ['entreprise', 'formation', 'perso'];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Une date (AAAA, AAAA-MM, AAAA-MM-JJ) ou une période « début/fin » (2026-01/2026-08)
const DATE_PATTERN = /^\d{4}(?:-\d{2}){0,2}(?:\/\d{4}(?:-\d{2}){0,2})?$/;
// Adresses réservées à des pages de la vue jury (#/jury/mentions-legales) :
// une fiche ne peut pas porter ces noms.
const RESERVED_SLUGS = ['mentions-legales'];

export function checkRealisation(data, file, site, errors) {
  const meta = { ...data };
  const fileSlug = path.basename(file, '.md');

  if (!isFilled(data.titre)) errors.push('« titre » est obligatoire.');

  if (!SLUG_PATTERN.test(fileSlug)) {
    errors.push('le nom du fichier ne doit contenir que des minuscules sans accent, des chiffres et des tirets.');
  } else if (RESERVED_SLUGS.includes(fileSlug)) {
    errors.push(`le nom « ${fileSlug} » est réservé à une page du site : choisis-en un autre.`);
  } else if (data.slug !== fileSlug) {
    errors.push(`« slug » doit être identique au nom du fichier : slug: ${fileSlug}`);
  }

  if (data.brouillon !== undefined && typeof data.brouillon !== 'boolean') {
    errors.push('« brouillon » doit valoir true ou false.');
  }

  if (!TYPES.includes(data.type)) {
    errors.push(`« type » doit valoir ${TYPES.join(', ')} (valeur actuelle : « ${data.type ?? 'absente'} »).`);
  }

  meta.date = normalizeDate(data.date);
  if (meta.date === null) {
    errors.push('« date » doit être au format AAAA, AAAA-MM ou AAAA-MM-JJ, une période début/fin (ex. 2026-01/2026-08), ou valoir "[À COMPLÉTER]".');
  }

  if (!isFilled(data.statut)) errors.push('« statut » est obligatoire (ex. : en cours, terminé).');

  meta.technos = data.technos ?? [];
  if (!isTextList(meta.technos)) errors.push('« technos » doit être une liste de textes.');

  meta.competences = data.competences ?? [];
  const codes = site.competences.map((c) => c.code);
  if (!isTextList(meta.competences)) {
    errors.push('« competences » doit être une liste de codes (ex. : [B1.1, B1.4]).');
  } else {
    for (const code of meta.competences) {
      if (!codes.includes(code)) {
        errors.push(`compétence « ${code} » inconnue. Codes possibles : ${codes.join(', ')} (voir ${CONFIG_FILE}).`);
      }
    }
  }

  if (data.resume !== undefined && typeof data.resume !== 'string') {
    errors.push('« resume » doit être un texte.');
  }

  return meta;
}

// Le lecteur YAML transforme « 2026-09-15 » en objet Date et « 2026 » en nombre :
// on ramène tout à du texte. Renvoie null si le format n'est pas reconnu.
function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value ?? '');
  if (DATE_PATTERN.test(text) || text.includes('[À COMPLÉTER')) return text;
  return null;
}

export function checkImage(src, root, errors) {
  if (/^([a-z]+:)?\/\//i.test(src) || src.startsWith('data:')) {
    errors.push(`image « ${src} » : les images doivent être hébergées dans public/ (pas de lien externe).`);
  } else if (src.startsWith('/')) {
    errors.push(`image « ${src} » : utilise un chemin sans « / » au début (ex. captures/nas/schema.webp).`);
  } else if (!fs.existsSync(path.join(root, 'public', src))) {
    errors.push(`image introuvable : public/${src}`);
  }
}
