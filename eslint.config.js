// Vérification du JavaScript (ESLint) : `npm run lint`.
// Règles « recommandées » : elles signalent les vraies erreurs (variable non
// définie ou inutilisée, code inatteignable…), pas les questions de style.
import js from '@eslint/js';
import globals from 'globals';

export default [
  // Fichiers générés, dépendances, documents personnels
  { ignores: ['dist/', 'node_modules/', 'a-integrer/', 'maquettes/'] },

  js.configs.recommended,

  // Code exécuté dans le navigateur
  {
    files: ['src/**/*.js'],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // Code exécuté par Node : configuration, plugins, scripts, tests
  {
    files: ['*.js', 'plugins/**/*.js', 'scripts/**/*.mjs', 'content/**/*.js', 'test/**/*.js'],
    languageOptions: { globals: globals.node },
  },

  // Relais Gmail, exécuté par Google Apps Script : un script classique (pas un
  // module), avec les services de Google
  {
    files: ['apps-script/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        GmailApp: 'readonly',
        LockService: 'readonly',
        PropertiesService: 'readonly',
        ScriptApp: 'readonly',
        Session: 'readonly',
        UrlFetchApp: 'readonly',
        console: 'readonly',
      },
    },
  },
];
