// Vérification des feuilles de style (Stylelint) : `npm run lint`.
// Règles « recommandées » : elles signalent les vraies erreurs (propriété ou
// valeur inconnue, accolade oubliée, sélecteur en double…), pas le style.
export default {
  extends: ['stylelint-config-recommended'],
  ignoreFiles: ['dist/**', 'reference/**'],
  rules: {
    // Cette règle exige un ordre précis entre sélecteurs de poids différents
    // (.skills th après .skills thead th:nth-child(1)…), même quand ils
    // visent des éléments ou des états différents. Les fichiers sont rangés
    // par composant : réordonner pour la satisfaire pourrait changer
    // l'affichage, sans rien corriger.
    'no-descending-specificity': null,
  },
};
