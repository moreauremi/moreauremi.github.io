// =============================================================================
// Sphère de particules ASCII (accueil)
// -----------------------------------------------------------------------------
// Un noyau dense (points répartis sur deux sphères) et un anneau incliné,
// projetés en perspective sur une grille de caractères. Pour chaque case de
// la grille, seul le point le plus proche est dessiné : son caractère
// (· : + * #) et sa couleur (du violet foncé #3a2f8f au blanc #eef1ff)
// dépendent de sa profondeur.
//
// Léger : environ 1 900 points, 30 images par seconde au plus, animation en
// pause quand l'onglet est caché ou que la sphère sort de l'écran. Avec
// « réduire les animations » (prefers-reduced-motion), la sphère est figée.
// =============================================================================

const CHARS = ['·', ':', '+', '*', '#'];
const FAR = [0x3a, 0x2f, 0x8f];
const NEAR = [0xee, 0xf1, 0xff];
const FRAME_MS = 1000 / 30;
const SPEED = 0.22; // radians par seconde

// Générateur pseudo-aléatoire à graine fixe : la même sphère à chaque visite
function random(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function buildPoints() {
  const rand = random(42);
  const points = [];
  // Noyau : points de Fibonacci, répartis régulièrement sur la sphère
  const shell = (count, radius) => {
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (2 * (i + 0.5)) / count;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      points.push([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius]);
    }
  };
  shell(760, 1);
  shell(320, 0.62);
  // Anneau incliné : presque horizontal, penché de 16° autour de X et de 24° autour de Z
  const tiltX = (16 * Math.PI) / 180;
  const tiltZ = (24 * Math.PI) / 180;
  for (let i = 0; i < 800; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 1.45 + rand() * 0.32;
    let x = Math.cos(angle) * radius;
    let y = (rand() - 0.5) * 0.06;
    let z = Math.sin(angle) * radius;
    [y, z] = [y * Math.cos(tiltX) - z * Math.sin(tiltX), y * Math.sin(tiltX) + z * Math.cos(tiltX)];
    [x, y] = [x * Math.cos(tiltZ) - y * Math.sin(tiltZ), x * Math.sin(tiltZ) + y * Math.cos(tiltZ)];
    points.push([x, y, z]);
  }
  return points;
}

const mix = (t) => `rgb(${FAR.map((c, i) => Math.round(c + (NEAR[i] - c) * t)).join(',')})`;
// Couleurs précalculées : une par niveau de profondeur
const PALETTE = Array.from({ length: 32 }, (_, i) => mix(i / 31));

export function startSphere(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const points = buildPoints();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const font = getComputedStyle(document.body).fontFamily;

  let width = 0;
  let height = 0;
  let cell = { w: 7, h: 12 };
  let angle = 0.6;
  let last = 0;
  let frame = 0;
  let visible = true;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = canvas.clientWidth || 360;
    const cssHeight = (cssWidth * 5) / 6;
    width = Math.round(cssWidth * ratio);
    height = Math.round(cssHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    const size = Math.max(9, Math.round(cssWidth / 32)) * ratio;
    cell = { w: size * 0.62, h: size, size };
    draw();
  }

  function draw() {
    const cols = Math.floor(width / cell.w);
    const rows = Math.floor(height / cell.h);
    const depth = new Float32Array(cols * rows).fill(-Infinity);
    const radius = Math.min(width / 3.9, height / 2.6);
    const cx = width / 2;
    const cy = height / 2;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const view = 0.32; // légère vue de dessus
    const cosV = Math.cos(view);
    const sinV = Math.sin(view);
    const camera = 4.2;

    for (const [px, py, pz] of points) {
      // Rotation autour de l'axe vertical, puis inclinaison de la vue
      const x = px * cosA + pz * sinA;
      const z0 = -px * sinA + pz * cosA;
      const y = py * cosV - z0 * sinV;
      const z = py * sinV + z0 * cosV;
      const scale = camera / (camera - z);
      const col = Math.floor((cx + x * radius * scale) / cell.w);
      const row = Math.floor((cy - y * radius * scale) / cell.h);
      if (col < 0 || row < 0 || col >= cols || row >= rows) continue;
      const index = row * cols + col;
      if (z > depth[index]) depth[index] = z;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.font = `${cell.size}px ${font}`;
    ctx.textBaseline = 'top';
    for (let index = 0; index < depth.length; index++) {
      const z = depth[index];
      if (z === -Infinity) continue;
      const t = Math.min(1, Math.max(0, (z + 1.6) / 3.2));
      ctx.fillStyle = PALETTE[Math.round(t * 31)];
      ctx.fillText(CHARS[Math.min(CHARS.length - 1, Math.floor(t * CHARS.length))], (index % cols) * cell.w, Math.floor(index / cols) * cell.h);
    }
  }

  function tick(now) {
    frame = 0;
    if (!running()) return;
    if (now - last >= FRAME_MS) {
      if (last) angle += (SPEED * Math.min(now - last, 100)) / 1000;
      last = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }

  const running = () => visible && !document.hidden && !reduced.matches;

  function update() {
    if (running() && !frame) {
      last = 0;
      frame = requestAnimationFrame(tick);
    } else if (!running() && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }).observe(canvas);
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', () => {
    draw();
    update();
  });
  resize();
  update();
}
