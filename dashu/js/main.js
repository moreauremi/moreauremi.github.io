// dashu v0.0.1 : point d'entrée.
// Construit la page à partir des fausses données, gère les onglets de vues,
// les interactions des widgets en lecture, les messages et le menu du compte.
// Le mode édition est dans editor.js, la bibliothèque de widgets dans library.js.
import { createDemoState } from './demo-data.js';
import { CATALOG } from './widgets.js';
import { COLS, ROWS } from './layout.js';
import { createEditor } from './editor.js';
import { createLibrary } from './library.js';
import { icon } from './icons.js';
import { esc, isPhone, reducedMotion } from './util.js';

const grid = document.getElementById('grid');
const toastEl = document.getElementById('toast');
const srStatus = document.getElementById('sr-status');

const app = {
  state: createDemoState(),
  viewId: 'generale',
  editing: false,
  view() {
    return this.state.views.find((v) => v.id === this.viewId);
  },
  find(id) {
    return this.view().widgets.find((w) => w.id === id);
  },
};

// Ce que reçoivent les widgets pour s'afficher et agir
const context = () => ({ state: app.state, now: new Date(), toast, announce, update: repaint });

// ---------------------------------------------------------------------------
// Affichage
// ---------------------------------------------------------------------------

// Position sur la grille, en variables CSS (le CSS les ignore sur téléphone)
function setPos(el, w) {
  el.style.setProperty('--x', w.x);
  el.style.setProperty('--y', w.y);
  el.style.setProperty('--w', w.w);
  el.style.setProperty('--h', w.h);
}

function editTools(w) {
  const name = esc(w.title);
  return `
    <div class="edit-tools">
      <button type="button" class="tool-btn handle-move" aria-label="Déplacer « ${name} ». Flèches : déplacer. Maj + flèches : redimensionner.">${icon('grip', 16)}</button>
      <button type="button" class="tool-btn handle-menu" aria-label="Options de « ${name} »" aria-haspopup="menu" aria-expanded="false">${icon('more', 16)}</button>
    </div>
    <span class="handle-resize" aria-hidden="true">${icon('resize', 14)}</span>`;
}

// HTML complet d'un widget. En aperçu (bibliothèque), ni outils ni identifiants en double.
function widgetHTML(w, { preview = false, order = 0 } = {}) {
  const spec = CATALOG[w.type];
  const ctx = context();
  const tools = app.editing && !preview;
  const titleId = `${preview ? 'preview' : w.id}-title`;
  return `
    <section class="widget widget-${w.type}" data-id="${w.id}" style="--x:${w.x};--y:${w.y};--w:${w.w};--h:${w.h};--order:${order}" aria-labelledby="${titleId}">
      <header class="widget-head">
        <h2 class="widget-title" id="${titleId}">${esc(w.title)}</h2>
        <span class="widget-meta">${spec.meta?.(w, ctx) ?? ''}</span>
      </header>
      <div class="widget-body"${tools ? ' inert' : ''}>${spec.render(w, ctx)}</div>
      ${tools ? editTools(w) : ''}
    </section>`;
}

// Redessine le contenu d'un widget. `w` peut être une version provisoire
// (pendant un redimensionnement, le contenu suit la nouvelle taille).
function paintWidget(el, w = app.find(el.dataset.id)) {
  if (!w) return;
  const spec = CATALOG[w.type];
  const ctx = context();
  el.querySelector('.widget-body').innerHTML = spec.render(w, ctx);
  el.querySelector('.widget-meta').innerHTML = spec.meta?.(w, ctx) ?? '';
}

function render() {
  const view = app.view();
  document.body.classList.toggle('is-editing', app.editing);
  document.getElementById('view-title').textContent = view.heading;

  document.getElementById('tabs').innerHTML = app.state.views
    .map((v) => `<a class="tab" href="#${v.id}"${v.id === app.viewId ? ' aria-current="page"' : ''}>${esc(v.name)}</a>`)
    .join('');

  for (const id of ['btn-search', 'btn-edit']) document.getElementById(id).hidden = app.editing;
  for (const id of ['btn-undo', 'btn-redo', 'btn-cancel', 'btn-done']) document.getElementById(id).hidden = !app.editing;
  document.getElementById('btn-add').classList.toggle('btn-primary', !app.editing);
  document.getElementById('btn-undo').disabled = !editor.canUndo();
  document.getElementById('btn-redo').disabled = !editor.canRedo();

  // Ordre de lecture (et d'affichage sur téléphone) : ligne par ligne
  const order = [...view.widgets].sort((a, b) => a.y - b.y || a.x - b.x).map((w) => w.id);
  let cells = '';
  if (app.editing) {
    for (let y = 1; y <= ROWS; y++) {
      for (let x = 1; x <= COLS; x++) cells += `<span class="cell" style="--x:${x};--y:${y}" aria-hidden="true"></span>`;
    }
  }
  grid.innerHTML = cells
    + view.widgets.map((w) => widgetHTML(w, { order: order.indexOf(w.id) })).join('')
    + (app.editing ? '<div class="drop-target" aria-hidden="true" hidden></div>' : '');
  fitAll();
}

// Rafraîchit tous les widgets de la vue (après une action : une tâche cochée
// dans « Perso » l'est aussi dans « Générale »), sans perdre le focus clavier.
function repaint() {
  const focused = document.activeElement;
  const host = focused?.closest?.('#grid .widget');
  const restore = host && focused.dataset.action
    ? { id: host.dataset.id, action: focused.dataset.action, key: focused.dataset.id ?? focused.dataset.key }
    : null;

  for (const el of grid.querySelectorAll('.widget')) paintWidget(el);
  fitAll();

  if (restore) {
    const el = grid.querySelector(`.widget[data-id="${restore.id}"]`);
    [...(el?.querySelectorAll(`[data-action="${restore.action}"]`) ?? [])]
      .find((b) => (b.dataset.id ?? b.dataset.key) === restore.key)
      ?.focus();
  }
}

// Une liste trop longue pour sa case perd ses dernières lignes au lieu d'être
// coupée à moitié : on réduit le contenu, jamais la page (guide de style).
function fitAll(root = grid) {
  for (const list of root.querySelectorAll('.fit')) {
    const items = [...list.children];
    for (const item of items) item.hidden = false;
    const bounds = (list.closest('.table-wrap') ?? list).getBoundingClientRect();
    if (!bounds.height) continue;
    let overflow = false;
    for (const item of items) {
      overflow ||= item.getBoundingClientRect().bottom > bounds.bottom + 1;
      item.hidden = overflow;
    }
  }
}

// Animation douce quand des widgets changent de place (technique FLIP :
// on mesure avant, on change, on mesure après, on anime l'écart).
function flip(change, { skip } = {}) {
  if (reducedMotion()) return change();
  const before = new Map([...grid.querySelectorAll('.widget')].map((el) => [el.dataset.id, el.getBoundingClientRect()]));
  change();
  for (const el of grid.querySelectorAll('.widget')) {
    const a = before.get(el.dataset.id);
    if (!a || el.dataset.id === skip) continue;
    const b = el.getBoundingClientRect();
    const dx = a.left - b.left;
    const dy = a.top - b.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
      duration: 180,
      easing: 'cubic-bezier(.2, .8, .2, 1)',
    });
  }
}

// Taille d'une case de la grille, en pixels (glisser-déposer, aperçus)
function cellMetrics() {
  const rect = grid.getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(grid).columnGap) || 12;
  if (isPhone() || !rect.width) return { cw: 100, ch: 96, gap: 12, rect };
  return { cw: (rect.width - gap * (COLS - 1)) / COLS, ch: (rect.height - gap * (ROWS - 1)) / ROWS, gap, rect };
}

// Met en évidence un widget qui vient d'arriver
function flash(id) {
  const el = grid.querySelector(`.widget[data-id="${id}"]`);
  if (!el) return;
  el.classList.add('is-new');
  el.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  setTimeout(() => el.classList.remove('is-new'), 1600);
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

let toastTimer;
function toast(message, { action, onAction } = {}) {
  clearTimeout(toastTimer);
  toastEl.innerHTML = `<span class="toast-text">${esc(message)}</span>${action ? `<button type="button" class="toast-action">${esc(action)}</button>` : ''}`;
  toastEl.hidden = false;
  toastEl.querySelector('.toast-action')?.addEventListener('click', () => {
    hideToast();
    onAction();
  });
  toastTimer = setTimeout(hideToast, action ? 7000 : 3500);
}

function hideToast() {
  toastEl.hidden = true;
  toastEl.innerHTML = '';
}

// Annonce lue par les lecteurs d'écran, sans rien afficher
function announce(message) {
  srStatus.textContent = '';
  requestAnimationFrame(() => {
    srStatus.textContent = message;
  });
}

Object.assign(app, { render, repaint, paintWidget, widgetHTML, fitAll, flip, setPos, cellMetrics, flash, toast, announce });
const editor = createEditor(app);
const library = createLibrary(app, editor);

// ---------------------------------------------------------------------------
// Interactions des widgets en mode lecture (délégation : un seul écouteur
// pour toute la grille, chaque bouton dit ce qu'il fait avec data-action)
// ---------------------------------------------------------------------------

grid.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (app.editing || !target) return;
  const w = app.find(target.closest('.widget').dataset.id);
  const action = CATALOG[w.type].actions?.[target.dataset.action];
  if (!action) return;
  if (target.tagName === 'A') e.preventDefault();
  action(context(), w, target);
});

grid.addEventListener('input', (e) => {
  const target = e.target.closest('[data-input]');
  if (!target) return;
  const w = app.find(target.closest('.widget').dataset.id);
  CATALOG[w.type].input?.(context(), w, target);
});

// ---------------------------------------------------------------------------
// Barre du haut
// ---------------------------------------------------------------------------

document.getElementById('btn-edit').addEventListener('click', () => editor.enter());
document.getElementById('btn-done').addEventListener('click', () => editor.finish());
document.getElementById('btn-cancel').addEventListener('click', () => editor.cancel());
document.getElementById('btn-undo').addEventListener('click', () => editor.undo());
document.getElementById('btn-redo').addEventListener('click', () => editor.redo());
document.getElementById('btn-add').addEventListener('click', () => library.open());
document.getElementById('btn-search').addEventListener('click', () => toast('La recherche arrive avec la v1.0.'));

// Menu du compte : thème et remise à zéro de la démo
const accountBtn = document.getElementById('btn-account');
const accountPop = document.getElementById('account-pop');

function toggleAccount(open = accountPop.hidden) {
  accountPop.hidden = !open;
  accountBtn.setAttribute('aria-expanded', String(open));
  if (open) accountPop.querySelector('input:checked')?.focus();
}

accountBtn.addEventListener('click', () => toggleAccount());
accountPop.addEventListener('change', (e) => {
  if (e.target.name !== 'theme') return;
  // Un thème ne change que les jetons de couleur (variables CSS)
  if (e.target.value === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = e.target.value;
});
document.getElementById('btn-reset').addEventListener('click', () => {
  app.state = createDemoState();
  app.editing = false;
  toggleAccount(false);
  render();
  toast('Démo remise à zéro');
});
document.addEventListener('pointerdown', (e) => {
  if (!accountPop.hidden && !accountPop.contains(e.target) && !accountBtn.contains(e.target)) toggleAccount(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !accountPop.hidden) {
    toggleAccount(false);
    accountBtn.focus();
  }
});

// ---------------------------------------------------------------------------
// Vues : l'adresse (#perso, #maison…) dit quelle vue afficher
// ---------------------------------------------------------------------------

function route() {
  const id = location.hash.slice(1) || 'generale';
  if (!app.state.views.some((v) => v.id === id)) return;
  if (app.editing) editor.finish();
  app.viewId = id;
  render();
}

window.addEventListener('hashchange', route);
window.addEventListener('resize', () => requestAnimationFrame(() => fitAll()));
document.fonts?.ready.then(() => fitAll());

// L'agenda avance avec l'heure : on redessine les widgets qui en dépendent
setInterval(() => {
  if (editor.busy()) return;
  for (const el of grid.querySelectorAll('.widget')) {
    const w = app.find(el.dataset.id);
    if (w && CATALOG[w.type].live) paintWidget(el);
  }
  fitAll();
}, 30_000);

route();
