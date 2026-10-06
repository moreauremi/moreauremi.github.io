// =============================================================================
// Accès au contenu du site : configuration + fichiers Markdown
// -----------------------------------------------------------------------------
// Les fichiers .md sont déjà convertis en { meta, html, raw } au build par
// plugins/vite-plugin-content.js. import.meta.glob (fonction de Vite) importe
// d'un coup tous les fichiers d'un dossier : ajouter une fiche dans
// content/realisations/ suffit, aucune ligne de code à modifier.
// =============================================================================

import site from '../content/site.config.js';

const ficheModules = import.meta.glob('../content/realisations/*.md', {
  eager: true,
  import: 'default',
});
const pageModules = import.meta.glob('../content/pages/*.md', {
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
  .map(({ meta, html, raw }) => ({ ...meta, html, raw }))
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
  Object.entries(pageModules).map(([file, { meta, html, raw }]) => [
    file.split('/').pop().replace('.md', ''),
    { ...meta, html, raw },
  ]),
);

// Libellé d'une compétence à partir de son code (ex. « C1 »)
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
