// Vérification du JavaScript (ESLint) : `npm run lint`.
// Règles « recommandées » : elles signalent les vraies erreurs (variable non
// définie ou inutilisée, code inatteignable…), pas les questions de style.
import js from '@eslint/js';
import globals from 'globals';

export default [
  // Fichiers générés, dépendances, maquette d'origine et documents personnels
  { ignores: ['dist/', 'node_modules/', 'reference/', 'a-integrer/'] },

  js.configs.recommended,

  // Code exécuté dans le navigateur
  {
    files: ['src/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        __BUILD_DATE__: 'readonly', // date du build, remplacée par Vite (vite.config.js)
      },
    },
  },

  // Code exécuté par Node : configuration, plugins, scripts, tests
  {
    files: ['*.js', 'plugins/**/*.js', 'scripts/**/*.mjs', 'content/**/*.js', 'test/**/*.js'],
    languageOptions: { globals: globals.node },
  },
];
