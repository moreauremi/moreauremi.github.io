// Point d'entrée de l'application, chargé par index.html.

// Styles du site : Vite les regroupe en un seul fichier CSS au build.
import './styles/index.css';

// --- Écran provisoire de l'étape 2 -----------------------------------------
// Il vérifie que la police auto-hébergée est bien chargée et montre les
// couleurs principales. Il sera remplacé par le vrai menu à l'étape 4.

const app = document.querySelector('#app');
app.innerHTML = `
<pre style="margin:0;padding:var(--gutter)">RémiOS — étape 2 : police et thème

<span id="font-status">[ .... ] Chargement de la police IBM Plex Mono…</span>
[  <strong style="color:var(--ok)">OK</strong>  ] Couleur « ok »
[ <strong style="color:var(--warn)">WARN</strong> ] Couleur « warn »
<span style="color:var(--dim)">[    0.123456] Couleur « dim » (horodatages)</span>
<span style="background:var(--tui-bg);color:var(--tui-bar-ink)"> Fond bleu du menu </span> <span style="background:var(--tui-box);color:var(--tui-title)"><strong> Boîte grise </strong></span>
</pre>`;

// document.fonts.load() renvoie la liste des polices effectivement chargées :
// une liste vide signifie que le fichier woff2 n'a pas été trouvé.
const status = document.querySelector('#font-status');
document.fonts.load('400 1em "IBM Plex Mono"').then((faces) => {
  status.innerHTML =
    faces.length > 0
      ? '[  <strong style="color:var(--ok)">OK</strong>  ] Police IBM Plex Mono chargée depuis le site lui-même'
      : '[ <strong style="color:var(--warn)">WARN</strong> ] Police introuvable, police de secours utilisée';
});
