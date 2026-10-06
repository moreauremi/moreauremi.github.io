// Configuration de Vite : l'outil qui sert le site pendant le développement
// (`npm run dev`) et qui fabrique la version finale statique (`npm run build`).
import { defineConfig } from 'vite';
import contentPlugin from './plugins/vite-plugin-content.js';

export default defineConfig({
  // Chemins relatifs dans le HTML généré (./assets/… plutôt que /assets/…).
  // Le site fonctionne ainsi aussi bien à la racine d'un domaine que dans un
  // sous-dossier derrière le reverse proxy (ex. http://192.168.1.10/portfolio/).
  // C'est possible parce que tout le site tient dans une seule page index.html :
  // la navigation passe par le « hash » de l'URL (#/jury, #/realisations/nas…).
  base: './',

  // Plugin maison : convertit les fichiers Markdown de content/ au build
  plugins: [contentPlugin()],

  // Constantes remplacées dans le code au moment du build.
  // __BUILD_DATE__ : date de génération du site, affichée dans la vue jury.
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },

  build: {
    // Dossier de sortie du build (valeur par défaut, écrite ici pour être explicite).
    // C'est ce dossier, 100 % statique, que nginx servira.
    outDir: 'dist',
    // Le site n'a qu'un seul fichier JavaScript : le petit code de
    // préchargement des modules que Vite ajoute par défaut est inutile.
    modulePreload: { polyfill: false },
    // Pages fabriquées : le site, et les pages d'erreur servies par le serveur
    // (404 et 403 : GitHub Pages et nginx ; 503 : le reverse proxy du homelab).
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
