// =============================================================================
// Configuration du site et actualités de la veille : lecture et vérification
// -----------------------------------------------------------------------------
// Vérifié au démarrage (en dev comme au build) : les fichiers déclarés dans la
// configuration (PDF, justificatifs) doivent exister dans public/, les
// formations ne peuvent renvoyer qu'à des fiches existantes, les sujets de
// veille doivent être bien déclarés, et chaque actualité doit être complète.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isFilled, isTextList } from './utils.js';

export const CONFIG_FILE = 'content/site.config.js';
// Fichier des actualités d'un sujet de veille (écrit par scripts/veille.mjs)
export const veilleFile = (id) => `content/veille/${id}/actualites.json`;

const SINGLE_DATE_PATTERN = /^\d{4}(?:-\d{2}){0,2}$/;
const FORMATION_CATEGORIES = ['formation', 'badge'];
const FORMATION_STATUSES = ['obtenue', 'en cours'];

// Charge content/site.config.js. Le paramètre ?v= (date de modification) force
// Node à relire le fichier quand il a changé, au lieu de garder l'ancienne version.
export async function loadSiteConfig(root) {
  const file = path.join(root, CONFIG_FILE);
  const version = fs.statSync(file).mtimeMs;
  const module = await import(`${pathToFileURL(file).href}?v=${version}`);
  return module.default;
}

export function checkDocuments(site, root) {
  const errors = [];
  for (const [name, file] of Object.entries(site.documents ?? {})) {
    if (!file) continue; // vide = pas encore disponible, c'est permis
    if (!fs.existsSync(path.join(root, 'public', file))) {
      errors.push(`le document « ${name} » pointe vers public/${file}, qui n'existe pas.`);
    }
  }
  return errors;
}

// Sujets de veille (veille.sujets de la configuration) : identifiants valides
// et uniques, champs remplis, flux RSS en http(s).
export function checkVeilleConfig(site) {
  const errors = [];
  const sujets = site.veille?.sujets;
  if (!Array.isArray(sujets)) return ['« veille.sujets » doit être une liste.'];
  const ids = new Set();
  sujets.forEach((s, index) => {
    const label = `veille.sujets, sujet n° ${index + 1}${isFilled(s?.id) ? ` (« ${s.id} »)` : ''}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s?.id ?? '')) errors.push(`${label} : « id » doit être en minuscules, chiffres et tirets.`);
    else if (ids.has(s.id)) errors.push(`${label} : « id » déjà utilisé par un autre sujet.`);
    ids.add(s?.id);
    for (const key of ['nom', 'sujet', 'utile', 'pourQui']) {
      if (!isFilled(s?.[key])) errors.push(`${label} : « ${key} » doit être un texte.`);
    }
    for (const key of ['motsCles', 'contexte', 'tags']) {
      if (!isTextList(s?.[key] ?? null)) errors.push(`${label} : « ${key} » doit être une liste de textes.`);
    }
    if (!Number.isInteger(s?.parSemaine) || s.parSemaine < 1) errors.push(`${label} : « parSemaine » doit être un nombre entier positif.`);
    if (!Array.isArray(s?.flux) || s.flux.length === 0) errors.push(`${label} : « flux » doit être une liste non vide.`);
    for (const f of Array.isArray(s?.flux) ? s.flux : []) {
      if (!isFilled(f?.nom) || !/^https?:\/\//.test(f?.url ?? '')) errors.push(`${label} : chaque flux a un « nom » et une « url » en http(s).`);
    }
  });
  return errors;
}

// Actualités d'un sujet de veille : chaque entrée doit être complète. Le
// fichier est écrit par un robot à partir de flux RSS et d'une IA : en cas de
// problème, le build s'arrête et le site en ligne reste intact. Un sujet sans
// fichier (première collecte pas encore faite) est permis.
export function checkVeille(root, id) {
  const file = path.join(root, veilleFile(id));
  if (!fs.existsSync(file)) return [];
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return [`JSON illisible : ${error.message}`];
  }
  if (!Array.isArray(data.actualites)) return ['« actualites » doit être une liste.'];

  const errors = [];
  // Actualités écartées depuis le tableau de bord (« Hors sujet ») : absentes
  // du site, gardées pour pouvoir les remettre. Facultatif.
  if (data.horsSujet !== undefined && !(Array.isArray(data.horsSujet) && data.horsSujet.every((a) => typeof a?.titre === 'string' && /^https?:\/\//.test(a?.url ?? '')))) {
    errors.push('« horsSujet » doit être une liste d\'actualités (titre et adresse).');
  }
  data.actualites.forEach((a, index) => {
    const label = `actualité n° ${index + 1}${typeof a?.titre === 'string' ? ` (« ${a.titre} »)` : ''}`;
    for (const key of ['titre', 'source', 'resume']) {
      if (typeof a?.[key] !== 'string' || !a[key].trim()) errors.push(`${label} : « ${key} » doit être un texte.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a?.date)) errors.push(`${label} : « date » doit être au format AAAA-MM-JJ.`);
    if (typeof a?.url !== 'string' || !/^https?:\/\//.test(a.url)) errors.push(`${label} : « url » doit commencer par http:// ou https://.`);
    if (!isTextList(a?.tags ?? null) || a.tags.length === 0) errors.push(`${label} : « tags » doit être une liste de textes, non vide.`);
  });
  return errors;
}

// Formations et badges (page formations/)
export function checkConfig(site, root) {
  const errors = [];
  const inPublic = (file) => fs.existsSync(path.join(root, 'public', file));

  // Slugs des fiches existantes : nom des fichiers de content/realisations/
  const slugs = fs
    .readdirSync(path.join(root, 'content/realisations'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.slice(0, -3));

  for (const key of ['formation', 'alternance', 'activite', 'ville']) {
    if (!isFilled(site.accueil?.[key])) errors.push(`« accueil.${key} » doit être un texte.`);
  }

  for (const [index, item] of (site.formations ?? []).entries()) {
    const label = `formation n° ${index + 1}${isFilled(item.titre) ? ` (« ${item.titre} »)` : ''}`;
    if (!isFilled(item.titre)) errors.push(`${label} : « titre » est obligatoire.`);
    if (!isFilled(item.organisme)) errors.push(`${label} : « organisme » est obligatoire.`);
    if (!FORMATION_CATEGORIES.includes(item.categorie)) {
      errors.push(`${label} : « categorie » doit valoir ${FORMATION_CATEGORIES.join(' ou ')}.`);
    }
    if (item.statut !== undefined && !FORMATION_STATUSES.includes(item.statut)) {
      errors.push(`${label} : « statut », s'il est indiqué, doit valoir ${FORMATION_STATUSES.join(' ou ')}.`);
    }
    if (!SINGLE_DATE_PATTERN.test(String(item.date ?? ''))) {
      errors.push(`${label} : « date » doit être au format AAAA, AAAA-MM ou AAAA-MM-JJ, entre guillemets.`);
    }
    if (item.justificatif && !inPublic(item.justificatif)) {
      errors.push(`${label} : le justificatif public/${item.justificatif} n'existe pas.`);
    }
    if (item.fiche !== undefined && !slugs.includes(item.fiche)) {
      errors.push(`${label} : la fiche « ${item.fiche} » n'existe pas dans content/realisations/.`);
    }
    if (item.lien && !/^https?:\/\//.test(item.lien)) {
      errors.push(`${label} : « lien » doit commencer par http:// ou https://.`);
    }
  }

  return errors;
}
