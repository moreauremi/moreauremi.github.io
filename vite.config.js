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

  build: {
    // Dossier de sortie du build (valeur par défaut, écrite ici pour être explicite).
    // C'est ce dossier, 100 % statique, que nginx servira.
    outDir: 'dist',
  },
});
