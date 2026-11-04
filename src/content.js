// =============================================================================
// Accès au contenu du site : configuration + fichiers Markdown
// -----------------------------------------------------------------------------
// Les fichiers .md sont déjà convertis en { meta, html } au build par
// plugins/vite-plugin-content.js. import.meta.glob (fonction de Vite) importe
// d'un coup tous les fichiers d'un dossier : ajouter une fiche dans
// content/realisations/ suffit, aucune ligne de code à modifier.
//
// Deux langues (voir src/utils/lang.js) :
//   - le français, langue d'origine, fait partie du fichier JavaScript
//     principal : le site s'affiche sans rien attendre ;
//   - l'anglais (fichiers <nom>.en.md) forme un fichier JavaScript à part
//     (content-en.js), téléchargé seulement à la première visite en anglais.
//     Un texte pas encore traduit reste en français : son champ `lang` vaut
//     alors 'fr', et les blocs le signalent au visiteur.
//
// Les valeurs exportées (site, realisations, pages…) sont celles de la langue
// affichée : loadLanguage() les recalcule. Ce sont des « liaisons vivantes »
// des modules JavaScript (export let) : les autres fichiers, qui les
// importent, voient toujours la valeur à jour, sans rien changer à leur code.
// =============================================================================

import siteSource from '../content/site.config.js';
import { tagSlug } from './utils/tags.js';
import { hasPlaceholder } from './utils/html.js';
import { currentLang, setCurrentLang, localizeConfig } from './utils/lang.js';

// Fichiers français : tous les .md, sauf les traductions (.en.md)
const FRENCH = import.meta.glob(
  [
    '../content/realisations/*.md',
    '../content/pages/*.md',
    '../content/veille/*/*.md',
    '!../content/**/*.en.md',
    // Veille : un dossier par sujet (content/veille/<id>/)
    '../content/veille/*/actualites.json',
  ],
  { eager: true, import: 'default' },
);

// Traductions anglaises (content-en.js), une fois téléchargées
let english = null;

// --- Contenu de la langue affichée (recalculé par loadLanguage) ---------------

export let site;
export let TYPES;
export let realisations;
export let technos;
export let pages;
export let veilles;

// Affiche le site dans une langue : télécharge les traductions la première
// fois, puis recalcule tout le contenu. Hors ligne, si le téléchargement
// échoue, le site reste dans la langue précédente.
export async function loadLanguage(lang) {
  if (lang === 'en' && !english) english = (await import('./content-en.js')).default;
  setCurrentLang(lang);
  build(currentLang());
}

function build(lang) {
  site = localizeConfig(siteSource, lang);
  TYPES = typesIn(lang);
  realisations = moduleList('../content/realisations/', lang)
    .map(({ meta, html, lang: textLang }) => ({ ...meta, html, lang: textLang }))
    .sort(byDate);
  technos = technoList(realisations);
  pages = Object.fromEntries(
    moduleList('../content/pages/', lang).map(({ file, meta, html, lang: textLang }) => [
      file.split('/').pop().replace('.md', ''),
      { ...meta, html, lang: textLang },
    ]),
  );
  veilles = (site.veille.sujets ?? []).map((sujet) => veilleOf(sujet, lang));
}

// Module d'un fichier Markdown dans une langue : la traduction si elle
// existe, sinon le français. `lang` du résultat : langue réelle du texte.
// Une fiche en brouillon vaut null dans le site publié (sa traduction aussi).
function moduleOf(file, lang) {
  const french = FRENCH[file];
  if (!french) return null;
  const translated = lang === 'en' ? english?.[file.replace(/\.md$/, '.en.md')] : null;
  return translated ? { ...translated, file, lang: 'en' } : { ...french, file, lang: 'fr' };
}

// Modules Markdown d'un dossier (sans les brouillons du site publié)
function moduleList(dir, lang) {
  return Object.keys(FRENCH)
    .filter((file) => file.startsWith(dir) && file.endsWith('.md') && FRENCH[file])
    .map((file) => moduleOf(file, lang));
}

// Les trois types de réalisation : libellé d'une fiche, titre et présentation
// du groupe qui les liste dans la rubrique « Réalisations ».
function typesIn(lang) {
  const t = (fr, en) => (lang === 'en' ? en : fr);
  return {
    entreprise: {
      label: t('Réalisation en entreprise', 'Work project'),
      group: t('En entreprise (1Life)', 'At work (1Life)'),
      intro: t(
        "Réalisations en alternance chez 1Life (part of Visiativ) depuis septembre 2026 : formation sur l'ERP Open-Prod (flux achat-vente, gestion à l'affaire, production) et administration des bases de test.",
        'Projects from my work-study placement at 1Life (part of Visiativ) since September 2026: training on the Open-Prod ERP (purchasing and sales, project-based management, production) and administration of the test databases.',
      ),
    },
    formation: {
      label: t('Réalisation en formation', 'School project'),
      group: t('En formation', 'At school'),
      intro: t('Réalisations menées en cours, à MyDigitalSchool Nantes.', 'Projects carried out in class at MyDigitalSchool Nantes.'),
    },
    perso: {
      label: t('Projet personnel', 'Personal project'),
      group: t('Projets personnels', 'Personal projects'),
      intro: t("Projets menés en dehors des cours et de l'entreprise.", 'Projects carried out outside school and work.'),
    },
  };
}

// --- Réalisations ----------------------------------------------------------------

// Les plus récentes d'abord.
// Les dates sont au format AAAA, AAAA-MM ou AAAA-MM-JJ : l'ordre alphabétique
// correspond donc à l'ordre chronologique. Pour une période (début/fin), c'est
// la date de fin qui compte. Sans date connue : en fin de liste.
function byDate(a, b) {
  const dated = Number(hasDate(b)) - Number(hasDate(a));
  if (dated !== 0) return dated;
  const [endA, endB] = [endDate(a), endDate(b)];
  if (hasDate(a) && endA !== endB) return endA < endB ? 1 : -1;
  return a.titre.localeCompare(b.titre, 'fr');
}

// Une fiche se retrouve aussi par ses anciennes adresses (champ
// anciennesAdresses : fiches réunies ou renommées), pour que les liens déjà
// partagés restent valides.
export function getRealisation(slug) {
  return (
    realisations.find((r) => r.slug === slug) ??
    realisations.find((r) => r.anciennesAdresses?.includes(slug)) ??
    null
  );
}

export function realisationsOfType(type) {
  return realisations.filter((r) => r.type === type);
}

// --- Technos des fiches (#/technos/<techno>) ---------------------------------------

// Identifiant d'une techno, utilisé dans les adresses et pour reconnaître deux
// écritures d'une même techno, comme pour les tags de la veille :
//   'GitHub Actions'  → 'github-actions'
//   'Batch (cmd.exe)' → 'batch-cmd-exe'
export const technoSlug = tagSlug;

// Technos des fiches publiées : { nom, slug, count }, de la plus utilisée à la
// moins utilisée (count : nombre de fiches qui la citent). Le nom affiché est
// celui de la fiche la plus récente. Un repère [À COMPLÉTER] n'est pas une techno.
function technoList(list) {
  return [
    ...list
      .flatMap((r) => uniqueTechnos(r))
      .reduce((all, nom) => {
        const slug = technoSlug(nom);
        const techno = all.get(slug) ?? { nom, slug, count: 0 };
        techno.count += 1;
        return all.set(slug, techno);
      }, new Map())
      .values(),
  ].sort((a, b) => b.count - a.count || a.nom.localeCompare(b.nom, 'fr'));
}

export function getTechno(slug) {
  return technos.find((t) => t.slug === slug) ?? null;
}

// Réalisations qui citent une techno, les plus récentes d'abord
export function realisationsByTechno(slug) {
  return realisations.filter((r) => uniqueTechnos(r).some((nom) => technoSlug(nom) === slug));
}

// Technos d'une fiche, sans repère [À COMPLÉTER] ni doublon (même identifiant)
function uniqueTechnos(realisation) {
  const seen = new Set();
  return realisation.technos.filter((nom) => {
    const slug = technoSlug(nom);
    if (hasPlaceholder(nom) || !slug || seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });
}

// --- Veille technologique (content/veille/<id>/, voir scripts/veille.mjs) -------

// Un sujet de la configuration (veille.sujets) avec son contenu : pourquoi ce
// sujet (sujet.md), mes synthèses (syntheses.md), actualités (actualites.json,
// absent tant que la première collecte n'a pas eu lieu) et tags. Les
// actualités et leurs tags restent en français : elles viennent de sources
// françaises, résumées chaque semaine par le robot de veille.
function veilleOf(sujet, lang) {
  const dir = `../content/veille/${sujet.id}/`;
  const pourquoi = moduleOf(`${dir}sujet.md`, lang);
  const syntheses = moduleOf(`${dir}syntheses.md`, lang);
  const data = FRENCH[`${dir}actualites.json`] ?? { miseAJour: null, actualites: [] };
  // Actualités, les plus récentes d'abord
  const actualites = [...data.actualites].sort(
    (a, b) => b.date.localeCompare(a.date) || a.titre.localeCompare(b.titre, 'fr'),
  );
  return {
    ...sujet,
    pourquoi: pourquoi?.html ?? '',
    pourquoiLang: pourquoi?.lang ?? 'fr',
    syntheses: syntheses?.html ?? (lang === 'en' ? '<p>Coming soon.</p>' : '<p>À venir.</p>'),
    synthesesLang: syntheses?.lang ?? lang,
    actualites,
    miseAJour: data.miseAJour,
    tags: tagsOf(actualites),
  };
}

export function getVeille(id) {
  return veilles.find((v) => v.id === id) ?? null;
}

// Tag d'un sujet : { nom, slug, count }, ou null
export function getVeilleTag(veille, slug) {
  return veille?.tags.find((t) => t.slug === slug) ?? null;
}

// Premier sujet qui a ce tag (anciennes adresses #/veille/<tag>, d'avant les
// trois sujets)
export function findVeilleOfTag(slug) {
  return veilles.find((v) => getVeilleTag(v, slug)) ?? null;
}

export function actualitesByTag(veille, slug) {
  return veille.actualites.filter((a) => a.tags.some((t) => tagSlug(t) === slug));
}

// Tags d'une liste d'actualités, du plus utilisé au moins utilisé
function tagsOf(actualites) {
  return [
    ...actualites
      .flatMap((a) => a.tags)
      .reduce((tags, nom) => {
        const slug = tagSlug(nom);
        const tag = tags.get(slug) ?? { nom, slug, count: 0 };
        tag.count += 1;
        return tags.set(slug, tag);
      }, new Map())
      .values(),
  ].sort((a, b) => b.count - a.count || a.nom.localeCompare(b.nom, 'fr'));
}

// --- Configuration ---------------------------------------------------------------

// Libellé d'une compétence à partir de son code (ex. « B1.1 »)
export function competenceLabel(code) {
  return site.competences.find((c) => c.code === code)?.libelle ?? code;
}

// Valeur d'une ligne neofetch de la configuration, retrouvée par son libellé
// français (« Formation », « Poste »…), quelle que soit la langue affichée.
// La version anglaise (champ « en » de la configuration) garde le même ordre.
export function neofetchValue(frenchKey) {
  const index = siteSource.neofetch.findIndex(([key]) => key === frenchKey);
  return site.neofetch[index]?.[1] ?? '';
}

function hasDate(realisation) {
  return /^\d{4}/.test(realisation.date);
}

// « 2026-01/2026-08 » → « 2026-08 » ; une date simple reste telle quelle
function endDate(realisation) {
  return realisation.date.split('/').pop();
}

// Contenu de départ : le français (en fin de fichier, une fois toutes les
// fonctions et constantes ci-dessus définies)
build(currentLang());
