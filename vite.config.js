// Configuration de Vite : l'outil qui sert le site pendant le développement
// (`npm run dev`) et qui fabrique la version finale statique (`npm run build`).
import { defineConfig } from 'vite';
import contentPlugin from './plugins/vite-plugin-content.js';
import inlinePlugin from './plugins/vite-plugin-inline.js';

export default defineConfig({
  // Chemins relatifs dans le HTML généré (./assets/…), corrigés selon la
  // profondeur de chaque page par plugins/vite-plugin-content.js : le site
  // fonctionne à la racine d'un domaine comme dans un sous-dossier (version
  // Docker derrière le reverse proxy du homelab).
  base: './',

  // Un site de plusieurs pages : une adresse inconnue est une vraie 404 (pas
  // de renvoi vers index.html), en développement comme en ligne.
  appType: 'mpa',

  // Plugins maison : pages fabriquées depuis content/, et recopie dans 503.html
  // de son style et de son icône (page qui ne peut rien télécharger).
  plugins: [inlinePlugin(), contentPlugin()],

  build: {
    outDir: 'dist',
    // Tous les navigateurs actuels savent précharger les modules : le petit
    // code de remplacement que Vite ajoute pour les anciens est inutile.
    modulePreload: { polyfill: false },
    // index.html sert de cadre à toutes les pages du site ; 404, 403 et 503
    // sont les pages d'erreur servies par le serveur.
    rolldownOptions: {
      input: {
        index: 'index.html',
        404: '404.html',
        403: '403.html',
        503: '503.html',
      },
    },
  },
});
