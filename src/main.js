// Point d'entrée de l'application, chargé par index.html.

// Styles du site : Vite les regroupe en un seul fichier CSS au build.
import './styles/index.css';
import { realisations, pages, site } from './content.js';
import { safe } from './utils/html.js';

// --- Écran provisoire de l'étape 3 -----------------------------------------
// Il liste le contenu lu depuis content/ pour vérifier la chaîne Markdown.
// Il sera remplacé par le vrai menu à l'étape 4.

const app = document.querySelector('#app');
app.innerHTML = `
<div style="padding:var(--gutter);max-width:80ch">
  <p>RémiOS — étape 3 : contenu (${realisations.length} fiches, ${Object.keys(pages).length} pages)</p>
  <ul>${realisations.map((r) => `<li>[${r.type}] ${safe(r.titre)} — ${safe(r.resume ?? '')}</li>`).join('')}</ul>
  <p>Veille : ${site.veille.sujet ? safe(site.veille.sujet) : 'À venir'}</p>
  <hr>
  ${pages.presentation.html}
</div>`;
