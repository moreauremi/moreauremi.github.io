// =============================================================================
// Easter egg du terminal : générique d'ouverture façon « Star Wars »
// -----------------------------------------------------------------------------
// Commande cachée `starwars`, ou `telnet towel.blinkenlights.nl` en clin d'œil
// au célèbre film en ASCII accessible par telnet. Déroulement (30 secondes) :
//
//   0 → 4 s      « Il y a bien longtemps, dans un homelab lointain… »
//   4,5 → 10,5 s le titre RÉMIOS s'éloigne dans les étoiles
//   7 → 30 s     texte jaune qui défile en perspective vers l'horizon,
//                puis fondu au noir pendant la dernière seconde
//
// Le texte est une parodie originale. Ni le film, ni son texte, ni sa musique
// (protégés par le droit d'auteur) ne sont reproduits ; la fanfare jouée si
// les sons sont activés est une composition originale (voir sounds.js).
//
// Rendu rétro, pixelisé :
//   - le générique est dessiné dans un <canvas> en BASSE RÉSOLUTION (un
//     « pixel rétro » vaut 3 pixels d'écran, 2 sur mobile), puis agrandi par
//     le navigateur sans lissage (CSS image-rendering: pixelated) : on obtient
//     de vrais gros pixels, pour un coût quasi nul (60 images par seconde) ;
//   - un filtre CSS (contraste, saturation) et une couche d'écran cathodique
//     (lignes de balayage, coins assombris, scintillement) sont posés dessus,
//     voir terminal.css.
// La police reste IBM Plex Mono, celle du site : le canvas utilise la police
// déjà chargée par la page.
// =============================================================================

export const DURATION = 30000; // durée totale, en millisecondes

// Texte du générique : parodie originale, construite sur des faits réels
// (vieux PC récupéré, Open-Prod, Proxmox, Docker, Tailscale, épreuve E5).
export const CRAWL = {
  intro: 'Il y a bien longtemps, dans un homelab lointain, très lointain…',
  logo: 'RÉMIOS',
  episode: 'Épisode E5',
  title: 'UN NOUVEL ALTERNANT',
  paragraphs: [
    "Le homelab est en paix. Depuis un vieux PC récupéré, un jeune alternant a libéré ses vidéos et ses fichiers de l'emprise des services en ligne.",
    "Le jour, il paramètre l'ERP Open-Prod pour les usines de la République industrielle. La nuit, il dompte Proxmox, Docker et Tailscale.",
    "Mais une nouvelle épreuve l'attend : présenter son portfolio devant le Conseil du BTS SIO. Armé de ses réalisations et de son tableau de synthèse, Rémi se prépare à affronter les questions du jury…",
  ],
};

// Version texte du générique, affichée dans le terminal : pour les lecteurs
// d'écran, et à la place de l'animation si les animations sont réduites.
export function crawlTranscript() {
  return [CRAWL.intro, `${CRAWL.logo} — ${CRAWL.episode} : ${CRAWL.title}`, ...CRAWL.paragraphs];
}

// --- Réglages -------------------------------------------------------------------

const FONT = '"IBM Plex Mono", ui-monospace, monospace';
const BLUE = '#4bd5ee';
const YELLOW = '#ffe81f';
const RETRO_WIDTH = 300; // largeur visée du canvas, en « pixels rétro »

// Moments clés, en secondes
const INTRO = { start: 0, end: 4 };
const LOGO = { start: 4.5, end: 10.5 };
const CRAWL_START = 7;
const LINES_PER_SECOND = 1.05; // vitesse de lecture au bas de l'écran
const FADE_OUT = 1.2; // fondu au noir final, en secondes

// Lance le générique par-dessus `host` (la fenêtre du terminal).
// `onEnd` est appelé à la fin, ou dès qu'il est arrêté. Renvoie { stop }.
export function playCrawl(host, { sounds, onEnd }) {
  const movie = document.createElement('div');
  movie.className = 'terminal-movie';
  movie.innerHTML = `
    <canvas class="movie-canvas" aria-hidden="true"></canvas>
    <div class="movie-crt" aria-hidden="true"></div>
    <button type="button" class="movie-stop">Arrêter <span aria-hidden="true">[Échap]</span></button>`;
  host.append(movie);

  const canvas = movie.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let W = 0; // largeur du canvas, en pixels rétro
  let H = 0; // hauteur du canvas, en pixels rétro
  let px = 1; // taille d'un pixel rétro, en pixels d'écran
  let stars = [];
  let lines = []; // lignes du texte déroulant, déjà coupées à la bonne largeur
  let lineStep = 0; // hauteur d'une ligne de texte, en pixels rétro

  let stopped = false;
  let frameId = 0;
  let fanfarePlayed = false;
  let startTime = 0;

  // --- Dimensions et mise en page (au lancement et si la fenêtre change) -----

  function resize() {
    const { width, height } = movie.getBoundingClientRect();
    px = Math.max(2, Math.round(width / RETRO_WIDTH));
    W = Math.ceil(width / px);
    H = Math.ceil(height / px);
    canvas.width = W;
    canvas.height = H;
    // Taille affichée = multiple exact de la taille d'un pixel rétro : tous
    // les pixels ont la même taille à l'écran
    canvas.style.width = `${W * px}px`;
    canvas.style.height = `${H * px}px`;
    stars = makeStars(W, H);
    layoutCrawl();
  }

  // Tailles de texte : mêmes valeurs qu'en CSS clamp(min, vw, max), en px
  // d'écran, converties en pixels rétro
  const cssSize = (min, vw, max) => Math.min(max, Math.max(min, (W * px * vw) / 100)) / px;

  // Coupe le texte déroulant en lignes qui tiennent dans la colonne
  function layoutCrawl() {
    const size = cssSize(17.6, 3.4, 30.4);
    const maxWidth = Math.min(W * 0.9, 640 / px);
    lineStep = size * 1.4;
    lines = [];
    let y = 0;
    const add = (text, scale = 1, gapAfter = 0) => {
      lines.push({ text, size: size * scale, y });
      y += size * scale * 1.4 + size * gapAfter;
    };
    add(CRAWL.episode, 1, 0.3);
    add(CRAWL.title, 1.35, 1);
    for (const paragraph of CRAWL.paragraphs) {
      const wrapped = wrap(paragraph, size, maxWidth);
      wrapped.forEach((text, i) => add(text, 1, i === wrapped.length - 1 ? 1 : 0));
    }
  }

  // Découpe un paragraphe en lignes d'au plus `maxWidth` pixels rétro
  function wrap(text, size, maxWidth) {
    ctx.font = `600 ${size}px ${FONT}`;
    const result = [];
    let current = '';
    for (const word of text.split(' ')) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(candidate).width > maxWidth) {
        result.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) result.push(current);
    return result;
  }

  // --- Dessin d'une image --------------------------------------------------------

  function draw(t) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    for (const star of stars) {
      ctx.fillStyle = `rgb(255 255 255 / ${star.alpha})`;
      ctx.fillRect(star.x, star.y, 1, 1);
    }

    // 1. « Il y a bien longtemps… »
    if (t < INTRO.end) {
      const alpha = fade(t, INTRO.start, INTRO.end, 0.15, 0.2);
      const size = cssSize(16, 2.6, 24);
      const introLines = wrap(CRAWL.intro, size, W * 0.8);
      const top = H / 2 - ((introLines.length - 1) * size * 1.5) / 2;
      introLines.forEach((text, i) => glowText(text, W / 2, top + i * size * 1.5, size, BLUE, alpha));
    }

    // 2. Titre RÉMIOS qui s'éloigne (lent au début puis de plus en plus vite)
    if (t >= LOGO.start && t < LOGO.end) {
      const p = (t - LOGO.start) / (LOGO.end - LOGO.start);
      const scale = 1.6 - 1.5 * p ** 1.8;
      const alpha = p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15;
      glowText(CRAWL.logo, W / 2, H / 2, cssSize(48, 14, 128) * scale, YELLOW, alpha, true);
    }

    // 3. Texte déroulant, en perspective : chaque ligne est posée sur un plan
    // qui s'enfonce vers une ligne d'horizon. Plus une ligne est loin, plus
    // elle est petite, aplatie (vue en biais) et proche de l'horizon, et plus
    // elle s'estompe. Il défile à environ une ligne par seconde.
    if (t >= CRAWL_START) {
      const horizon = H * 0.22;
      const depth = H - horizon; // en bas de l'écran, une ligne garde sa taille réelle
      const offset = (t - CRAWL_START) * LINES_PER_SECOND * lineStep;
      for (const line of lines) {
        const distance = offset - line.y; // distance de la ligne au bas de l'écran
        if (distance < 0) continue; // pas encore apparue
        const scale = depth / (depth + distance);
        const alpha = Math.min(1, Math.max(0, (scale - 0.12) / 0.25));
        if (alpha <= 0) continue; // trop loin : invisible
        const y = horizon + (H - horizon) * scale;
        glowText(line.text, W / 2, y, line.size * scale, YELLOW, alpha, false, scale);
      }
    }

    // 4. Fondu au noir final
    const end = DURATION / 1000;
    if (t > end - FADE_OUT) {
      ctx.fillStyle = `rgb(0 0 0 / ${Math.min(1, (t - end + FADE_OUT) / FADE_OUT)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // Texte avec lueur de phosphore et léger décalage rouge / bleu, comme sur
  // un tube cathodique. `outline` : lettres en contour (titre).
  // `squash` : aplatissement vertical (1 = normal), pour la perspective.
  function glowText(text, x, y, size, color, alpha, outline = false, squash = 1) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, squash);
    ctx.font = `600 ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(1, size / 22);
    const paint = (dx, style, a, blur) => {
      ctx.globalAlpha = a;
      ctx.shadowColor = style;
      ctx.shadowBlur = blur;
      if (outline) {
        ctx.strokeStyle = style;
        ctx.strokeText(text, dx, 0);
      } else {
        ctx.fillStyle = style;
        ctx.fillText(text, dx, 0);
      }
    };
    paint(-1, '#ff285a', alpha * 0.45, 0); // frange rouge à gauche
    paint(1, '#2878ff', alpha * 0.45, 0); // frange bleue à droite
    paint(0, color, alpha, 3); // texte principal, avec lueur
    ctx.restore(); // annule translation, aplatissement, opacité et lueur
  }

  // --- Boucle d'animation -------------------------------------------------------

  function frame(now) {
    const t = (now - startTime) / 1000;
    if (!fanfarePlayed && t >= LOGO.start) {
      fanfarePlayed = true;
      sounds?.fanfare();
    }
    if (t * 1000 >= DURATION) {
      stop();
      return;
    }
    draw(t);
    frameId = requestAnimationFrame(frame);
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frameId);
    observer.disconnect();
    movie.remove();
    onEnd();
  }

  const observer = new ResizeObserver(() => resize());
  observer.observe(movie);
  movie.querySelector('.movie-stop').addEventListener('click', stop);

  // On attend que la police (graisse 600) soit prête avant de dessiner, sinon
  // le canvas utiliserait une police de secours pendant les premières images.
  resize();
  document.fonts
    .load(`600 16px ${FONT}`)
    .catch(() => {})
    .then(() => {
      if (stopped) return;
      layoutCrawl();
      startTime = performance.now();
      frameId = requestAnimationFrame(frame);
    });

  return { stop };
}

// --- Aides -------------------------------------------------------------------------

// Opacité d'un élément visible entre `start` et `end` : apparition pendant la
// part `fadeIn` de la durée, disparition pendant la part `fadeOut`.
function fade(t, start, end, fadeIn, fadeOut) {
  const p = (t - start) / (end - start);
  if (p < 0 || p > 1) return 0;
  if (p < fadeIn) return p / fadeIn;
  if (p > 1 - fadeOut) return (1 - p) / fadeOut;
  return 1;
}

// Ciel étoilé : positions pseudo-aléatoires mais toujours identiques (graine
// fixe), pour que les étoiles ne « sautent » pas si la fenêtre change de taille.
function makeStars(width, height) {
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const count = Math.round((width * height) / 180);
  return Array.from({ length: count }, () => ({
    x: Math.floor(random() * width),
    y: Math.floor(random() * height),
    alpha: (0.3 + random() * 0.7).toFixed(2),
  }));
}
