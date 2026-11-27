// =============================================================================
// Vérification d'une fiche de réalisation (content/realisations/*.md)
// -----------------------------------------------------------------------------
// Toutes les fiches suivent le même gabarit court (voir l'en-tête de
// content/realisations/glpi.md). Chaque problème devient une ligne du message
// d'erreur du build : une fiche mal remplie bloque la publication.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { CONFIG_FILE } from './config.js';
import { isFilled, isTextList } from './utils.js';
import { hasPlaceholder } from '../../src/utils/html.js';

export const TYPES = ['formation', 'entreprise', 'perso'];
export const DOMAINES = ['applicatif', 'infra'];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Une date (AAAA, AAAA-MM, AAAA-MM-JJ) ou une période « début/fin » (2026-01/2026-08)
const DATE_PATTERN = /^\d{4}(?:-\d{2}){0,2}(?:\/\d{4}(?:-\d{2}){0,2})?$/;
const MAX_RESUME_WORDS = 20;
const MAX_ACTIONS = 3;
// Codes du référentiel écrits dans les tags (B1.4…)
const CODE_PATTERN = /^B\d\.\d$/;

// Nombre de mots d'un texte, sans les repères [À COMPLÉTER] ni la ponctuation
export function wordCount(text) {
  return String(text)
    .replace(/\[À COMPLÉTER[^\]]*\]/g, '')
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

export function checkRealisation(data, file, site, root, errors) {
  const meta = { ...data };
  const fileSlug = path.basename(file, '.md');
  const inPublic = (p) => fs.existsSync(path.join(root, 'public', p));

  if (!isFilled(data.titre)) errors.push('« titre » est obligatoire.');

  if (!SLUG_PATTERN.test(fileSlug)) {
    errors.push('le nom du fichier ne doit contenir que des minuscules sans accent, des chiffres et des tirets.');
  } else if (data.slug !== fileSlug) {
    errors.push(`« slug » doit être identique au nom du fichier : slug: ${fileSlug}`);
  }

  if (data.brouillon !== undefined && typeof data.brouillon !== 'boolean') {
    errors.push('« brouillon » doit valoir true ou false.');
  }
  if (!TYPES.includes(data.type)) errors.push(`« type » doit valoir ${TYPES.join(', ')}.`);
  if (!DOMAINES.includes(data.domaine)) errors.push(`« domaine » doit valoir ${DOMAINES.join(' ou ')}.`);

  meta.date = normalizeDate(data.date);
  if (meta.date === null) errors.push('« date » doit être au format AAAA, AAAA-MM, AAAA-MM-JJ ou une période début/fin.');
  if (!isFilled(data.statut)) errors.push('« statut » est obligatoire (ex. : en cours, terminé).');

  if (!isFilled(data.resume)) errors.push('« resume » est obligatoire : une phrase.');
  else if (wordCount(data.resume) > MAX_RESUME_WORDS) {
    errors.push(`« resume » fait ${wordCount(data.resume)} mots : ${MAX_RESUME_WORDS} au plus.`);
  }

  if (!isFilled(data.contexte)) errors.push('« contexte » est obligatoire : une ligne.');
  else if (/\n/.test(data.contexte.trim())) errors.push('« contexte » doit tenir sur une ligne.');

  meta.actions = data.actions ?? [];
  if (!isTextList(meta.actions) || meta.actions.length === 0 || meta.actions.length > MAX_ACTIONS) {
    errors.push(`« actions » (ce que j'ai fait) doit être une liste de 1 à ${MAX_ACTIONS} textes.`);
  }

  meta.tags = data.tags ?? [];
  if (!isTextList(meta.tags) || meta.tags.length === 0) {
    errors.push('« tags » doit être une liste de textes, non vide.');
  } else {
    const codes = site.competences.map((c) => c.code);
    for (const tag of meta.tags.filter((t) => CODE_PATTERN.test(t))) {
      if (!codes.includes(tag)) errors.push(`compétence « ${tag} » inconnue. Codes possibles : ${codes.join(', ')} (voir ${CONFIG_FILE}).`);
    }
  }

  meta.liens = data.liens ?? [];
  if (!isLinkList(meta.liens) || !meta.liens.every((l) => /^https?:\/\//.test(l.url))) {
    errors.push('« liens » doit être une liste de { libelle, url } avec une adresse en http(s).');
  }

  meta.documents = data.documents ?? [];
  if (!isLinkList(meta.documents)) {
    errors.push('« documents » doit être une liste de { libelle, url }.');
  } else {
    for (const doc of meta.documents) {
      if (!inPublic(doc.url)) errors.push(`document introuvable : public/${doc.url}`);
    }
  }

  meta.illustrations = data.illustrations ?? [];
  if (!Array.isArray(meta.illustrations) || !meta.illustrations.every((i) => isFilled(i?.src) && isFilled(i?.legende))) {
    errors.push('« illustrations » doit être une liste de { src, legende }.');
  } else {
    for (const { src } of meta.illustrations) {
      if (/^([a-z]+:)?\/\//i.test(src) || src.startsWith('/')) errors.push(`illustration « ${src} » : chemin dans public/, sans « / » au début.`);
      else if (!inPublic(src)) errors.push(`illustration introuvable : public/${src}`);
    }
  }

  if (data.ia !== undefined && !Object.hasOwn(site.mentionsIa ?? {}, data.ia)) {
    errors.push(`« ia » doit être une clé de « mentionsIa » (${Object.keys(site.mentionsIa ?? {}).join(', ')}) dans ${CONFIG_FILE}.`);
  }

  // Adresses d'anciennes fiches réunies dans celle-ci, ou d'un ancien nom
  meta.anciennesAdresses = data.anciennesAdresses ?? [];
  if (!isTextList(meta.anciennesAdresses) || !meta.anciennesAdresses.every((s) => SLUG_PATTERN.test(s))) {
    errors.push('« anciennesAdresses » doit être une liste de noms de fiches (ex. : [nas, homelab-jellyfin]).');
  }

  // Une fiche publiée ne doit pas garder de placeholder dans son titre
  if (!data.brouillon && hasPlaceholder(data.titre ?? '')) errors.push('« titre » ne doit pas contenir [À COMPLÉTER].');

  return meta;
}

function isLinkList(value) {
  return Array.isArray(value) && value.every((l) => isFilled(l?.libelle) && isFilled(l?.url));
}

// Le lecteur YAML transforme « 2026-09-15 » en objet Date et « 2026 » en nombre :
// on ramène tout à du texte. Renvoie null si le format n'est pas reconnu.
function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value ?? '');
  return DATE_PATTERN.test(text) ? text : null;
}
