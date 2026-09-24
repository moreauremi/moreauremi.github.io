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

// Les trois types de réalisation, avec leur libellé et la rubrique du menu
// qui les liste.
export const TYPES = {
  entreprise: { label: 'Réalisation en entreprise', section: 'entreprise' },
  formation: { label: 'Réalisation en formation', section: 'formation' },
  perso: { label: 'Projet personnel', section: 'perso' },
};

// Toutes les réalisations, les plus récentes d'abord.
// Les dates sont au format AAAA, AAAA-MM ou AAAA-MM-JJ : l'ordre alphabétique
// correspond donc à l'ordre chronologique. Sans date connue : en fin de liste.
export const realisations = Object.values(ficheModules)
  .map(({ meta, html, raw }) => ({ ...meta, html, raw }))
  .sort((a, b) => {
    const dated = Number(hasDate(b)) - Number(hasDate(a));
    if (dated !== 0) return dated;
    if (hasDate(a) && a.date !== b.date) return a.date < b.date ? 1 : -1;
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
