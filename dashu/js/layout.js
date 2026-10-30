// Calcul de la grille bento : 12 colonnes × 6 lignes, jamais plus.
// Fonctions « pures » : elles reçoivent une disposition et en renvoient une
// nouvelle, sans toucher à la page. Le mode édition s'en sert pour savoir où
// un widget peut aller avant même qu'on le lâche.
//
// Un widget occupe un rectangle { x, y, w, h } : colonne et ligne de départ
// (à partir de 1, comme les lignes de CSS Grid), largeur et hauteur en cases.

export const COLS = 12;
export const ROWS = 6;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Deux rectangles se chevauchent-ils ?
export function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

// Le rectangle tient-il entièrement dans la grille ?
export function inBounds(r) {
  return r.x >= 1 && r.y >= 1 && r.x + r.w - 1 <= COLS && r.y + r.h - 1 <= ROWS;
}

// Nombre de cases libres dans une disposition
export function freeCells(layout) {
  return COLS * ROWS - layout.reduce((sum, r) => sum + r.w * r.h, 0);
}

// Toutes les positions où un bloc w × h tient sans rien chevaucher
function* freeSpots(placed, w, h) {
  for (let y = 1; y <= ROWS - h + 1; y++) {
    for (let x = 1; x <= COLS - w + 1; x++) {
      const spot = { x, y, w, h };
      if (!placed.some((p) => overlaps(p, spot))) yield spot;
    }
  }
}

// Première place libre en lisant la grille ligne par ligne (ajout d'un widget)
export function firstFree(placed, w, h) {
  for (const spot of freeSpots(placed, w, h)) return { x: spot.x, y: spot.y };
  return null;
}

// Place libre la plus proche d'un point (widget poussé par un autre, copie)
export function nearestFree(placed, w, h, near) {
  let best = null;
  let bestDistance = Infinity;
  for (const spot of freeSpots(placed, w, h)) {
    const distance = Math.abs(spot.x - near.x) + Math.abs(spot.y - near.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { x: spot.x, y: spot.y };
    }
  }
  return best;
}

// Essaie de mettre le widget `id` en (x, y) avec la taille w × h.
// Les widgets qu'il recouvre se décalent vers la place libre la plus proche.
// Renvoie la nouvelle disposition, ou null si c'est impossible : la vue ne
// doit jamais dépasser l'écran, donc on refuse plutôt que d'ajouter une ligne.
export function tryPlace(layout, id, x, y, w, h) {
  const moved = { ...layout.find((r) => r.id === id), x, y, w, h };
  if (!inBounds(moved)) return null;

  const others = layout.filter((r) => r.id !== id);
  const hit = others.filter((r) => overlaps(r, moved));
  const placed = others.filter((r) => !hit.includes(r)).map((r) => ({ ...r }));
  placed.push(moved);

  // Les plus gros d'abord : ce sont les plus durs à recaser
  hit.sort((a, b) => b.w * b.h - a.w * a.h);
  for (const r of hit) {
    const spot = nearestFree(placed, r.w, r.h, r);
    if (!spot) return null;
    placed.push({ ...r, ...spot });
  }

  // Même ordre qu'avant : l'ordre de lecture au clavier ne saute pas
  return layout.map((r) => placed.find((p) => p.id === r.id));
}
