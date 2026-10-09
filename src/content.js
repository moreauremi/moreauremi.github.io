// =============================================================================
// Accès au contenu du site : configuration + fichiers Markdown
// -----------------------------------------------------------------------------
// Les fichiers .md sont déjà convertis en { meta, html } au build par
// plugins/vite-plugin-content.js. import.meta.glob (fonction de Vite) importe
// d'un coup tous les fichiers d'un dossier : ajouter une fiche dans
// content/realisations/ suffit, aucune ligne de code à modifier.
// =============================================================================

import site from '../content/site.config.js';
import { tagSlug } from './utils/tags.js';

const ficheModules = import.meta.glob('../content/realisations/*.md', {
  eager: true,
  import: 'default',
});
const pageModules = import.meta.glob('../content/pages/*.md', {
  eager: true,
  import: 'default',
});
// Veille : un dossier par sujet (content/veille/<id>/)
const veilleModules = import.meta.glob(['../content/veille/*/*.md', '../content/veille/*/actualites.json'], {
  eager: true,
  import: 'default',
});

export { site };

// Les trois types de réalisation : libellé d'une fiche, titre et présentation
// du groupe qui les liste dans la rubrique « Réalisations ».
export const TYPES = {
  entreprise: {
    label: 'Réalisation en entreprise',
    group: 'En entreprise (1Life)',
    intro: "Missions réalisées en alternance chez 1Life (part of Visiativ) depuis septembre 2026 : paramétrage de l'ERP Open-Prod (flux de vente et de production), requêtes SQL, notions comptables.",
  },
  formation: {
    label: 'Réalisation en formation',
    group: 'En formation',
    intro: 'Réalisations menées en cours, à MyDigitalSchool Nantes.',
  },
  perso: {
    label: 'Projet personnel',
    group: 'Projets personnels',
    intro: "Projets menés en dehors des cours et de l'entreprise.",
  },
};

// Toutes les réalisations, les plus récentes d'abord.
// Les dates sont au format AAAA, AAAA-MM ou AAAA-MM-JJ : l'ordre alphabétique
// correspond donc à l'ordre chronologique. Pour une période (début/fin), c'est
// la date de fin qui compte. Sans date connue : en fin de liste.
// Les fiches en brouillon valent null dans le site publié : elles sont écartées.
export const realisations = Object.values(ficheModules)
  .filter(Boolean)
  .map(({ meta, html }) => ({ ...meta, html }))
  .sort((a, b) => {
    const dated = Number(hasDate(b)) - Number(hasDate(a));
    if (dated !== 0) return dated;
    const [endA, endB] = [endDate(a), endDate(b)];
    if (hasDate(a) && endA !== endB) return endA < endB ? 1 : -1;
    return a.titre.localeCompare(b.titre, 'fr');
  });

export function getRealisation(slug) {
  return realisations.find((r) => r.slug === slug) ?? null;
}

export function realisationsOfType(type) {
  return realisations.filter((r) => r.type === type);
}

// Pages simples (présentation, veille), indexées par nom de fichier
export const pages = Object.fromEntries(
  Object.entries(pageModules).map(([file, { meta, html }]) => [
    file.split('/').pop().replace('.md', ''),
    { ...meta, html },
  ]),
);

// --- Veille technologique (content/veille/<id>/, voir scripts/veille.mjs) -------

// Les sujets de la configuration (veille.sujets), dans le même ordre, avec
// leur contenu : pourquoi ce sujet (sujet.md), mes synthèses (syntheses.md),
// actualités (actualites.json, absent tant que la première collecte n'a pas
// eu lieu) et tags.
export const veilles = (site.veille.sujets ?? []).map((sujet) => {
  const file = (name) => veilleModules[`../content/veille/${sujet.id}/${name}`];
  const data = file('actualites.json') ?? { miseAJour: null, actualites: [] };
  // Actualités, les plus récentes d'abord
  const actualites = [...data.actualites].sort(
    (a, b) => b.date.localeCompare(a.date) || a.titre.localeCompare(b.titre, 'fr'),
  );
  return {
    ...sujet,
    pourquoi: file('sujet.md')?.html ?? '',
    syntheses: file('syntheses.md')?.html ?? '<p>À venir.</p>',
    actualites,
    miseAJour: data.miseAJour,
    tags: tagsOf(actualites),
  };
});

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

// Libellé d'une compétence à partir de son code (ex. « B1.1 »)
export function competenceLabel(code) {
  return site.competences.find((c) => c.code === code)?.libelle ?? code;
}

function hasDate(realisation) {
  return /^\d{4}/.test(realisation.date);
}

// « 2026-01/2026-08 » → « 2026-08 » ; une date simple reste telle quelle
function endDate(realisation) {
  return realisation.date.split('/').pop();
}
