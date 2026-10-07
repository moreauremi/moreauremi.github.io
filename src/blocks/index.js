// =============================================================================
// Blocs de contenu partagés
// -----------------------------------------------------------------------------
// L'interface RémiOS et la vue jury affichent le même contenu avec deux
// habillages différents. Ces fonctions produisent le HTML commun ; seul le CSS
// du conteneur change. Une information n'est donc écrite qu'à un seul endroit.
//
// `hrefFor(slug)` indique où mène le lien d'une fiche : #/realisations/<slug>
// dans RémiOS, #/jury/<slug> dans la vue jury.
//
// Un fichier par rubrique ; ce module les rassemble pour le reste du code.
// =============================================================================

export { presentationBlock } from './presentation.js';
export { alternanceBlock } from './alternance.js';
export { realisationsBlock, realisationList, ficheMeta, ficheCompetences, ficheBlock } from './realisations.js';
export { competencesBlock } from './competences.js';
export { syntheseBlock } from './synthese.js';
export { veilleBlock, veilleTagBlock } from './veille.js';
export { certificationsBlock } from './certifications.js';
export { contactBlock, messageSentBlock } from './contact.js';
export { mentionsLegalesBlock } from './mentions-legales.js';
