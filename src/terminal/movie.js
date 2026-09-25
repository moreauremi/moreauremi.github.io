// =============================================================================
// Easter egg du terminal : générique d'ouverture façon « Star Wars »
// -----------------------------------------------------------------------------
// Commande cachée `starwars`, ou `telnet towel.blinkenlights.nl` en clin d'œil
// au célèbre film en ASCII accessible par telnet. Déroulement (30 secondes) :
//
//   0 → 4 s      « Il y a bien longtemps, dans un homelab lointain… »
//   4,5 → 10,5 s le titre RÉMIOS s'éloigne dans les étoiles
//   7 → 30 s     texte jaune qui défile en perspective
//
// Le texte est une parodie originale. Ni le film, ni son texte, ni sa musique
// (protégés par le droit d'auteur) ne sont reproduits ; la fanfare jouée si
// les sons sont activés est une composition originale (voir sounds.js).
//
// Toutes les animations sont en CSS et ne modifient que `transform` et
// `opacity` : la carte graphique s'en charge, l'affichage reste fluide.
// =============================================================================

import { escapeHtml } from '../utils/html.js';

export const DURATION = 30000; // durée totale, en millisecondes
const FANFARE_AT = 4500; // la fanfare accompagne l'apparition du titre

// Texte du générique : parodie originale, construite sur des faits réels
// (vieux PC récupéré, Open-Prod, Proxmox, Docker, Tailscale, épreuve E5).
export const CRAWL = {
  intro: 'Il y a bien longtemps, dans un homelab lointain, très lointain…',
  logo: 'RÉMIOS',
  episode: 'Épisode E5',
  title: 'UN NOUVEL ALTERNANT',
  paragraphs: [
    "Le homelab est en paix. Depuis un vieux PC récupéré, un jeune alternant a libéré ses films et ses fichiers de l'emprise des abonnements payants.",
    "Le jour, il paramètre l'ERP Open-Prod pour les usines de la République industrielle. La nuit, il dompte Proxmox, Docker et Tailscale.",
    "Mais une nouvelle épreuve l'attend : présenter son portfolio devant le Conseil du BTS SIO. Armé de ses réalisations et de son tableau de synthèse, Rémi se prépare à affronter les questions du jury…",
  ],
};

// Version texte du générique, affichée dans le terminal : pour les lecteurs
// d'écran, et à la place de l'animation si les animations sont réduites.
export function crawlTranscript() {
  return [CRAWL.intro, `${CRAWL.logo} — ${CRAWL.episode} : ${CRAWL.title}`, ...CRAWL.paragraphs];
}

// Lance le générique par-dessus `host` (la fenêtre du terminal).
// `onEnd` est appelé à la fin, ou dès qu'il est arrêté. Renvoie { stop }.
export function playCrawl(host, { sounds, onEnd }) {
  const movie = document.createElement('div');
  movie.className = 'terminal-movie';
  movie.innerHTML = `
    <div class="movie-scene" aria-hidden="true">
      <p class="movie-intro">${escapeHtml(CRAWL.intro)}</p>
      <p class="movie-logo">${escapeHtml(CRAWL.logo)}</p>
      <div class="movie-perspective">
        <div class="movie-crawl">
          <p class="movie-episode">${escapeHtml(CRAWL.episode)}</p>
          <p class="movie-title">${escapeHtml(CRAWL.title)}</p>
          ${CRAWL.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
        </div>
      </div>
    </div>
    <button type="button" class="movie-stop">Arrêter <span aria-hidden="true">[Échap]</span></button>`;
  host.append(movie);

  // Distance que le texte doit parcourir pour disparaître au loin : dépend de
  // la hauteur de l'écran, mesurée une seule fois.
  const perspective = movie.querySelector('.movie-perspective');
  const travel = perspective.clientHeight * 1.25;
  movie.style.setProperty('--crawl-travel', `${-travel}px`);

  let stopped = false;
  const timers = [
    window.setTimeout(() => sounds?.fanfare(), FANFARE_AT),
    window.setTimeout(stop, DURATION),
  ];

  function stop() {
    if (stopped) return;
    stopped = true;
    timers.forEach(window.clearTimeout);
    movie.remove();
    onEnd();
  }

  movie.querySelector('.movie-stop').addEventListener('click', stop);
  return { stop };
}
