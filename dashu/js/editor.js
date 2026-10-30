// Mode édition : déplacer, redimensionner, dupliquer, supprimer et configurer
// les widgets, avec annuler / rétablir. On y entre avec « Modifier », on en
// sort avec « Terminer » (on garde) ou « Annuler » (tout revient comme avant).
// Le calcul des places libres est dans layout.js.
import { COLS, ROWS, clamp, tryPlace, nearestFree } from './layout.js';
import { CATALOG, compatibleSources } from './widgets.js';
import { CONNECTORS, SOURCE_TYPES } from './demo-data.js';
import { clone, esc, isPhone, newId } from './util.js';

export function createEditor(app) {
  const grid = document.getElementById('grid');
  const menu = document.getElementById('widget-menu');
  const dialog = document.getElementById('config');
  const form = document.getElementById('config-form');

  let snapshot = null; // la vue telle qu'elle était en entrant
  let undoStack = [];
  let redoStack = [];
  let drag = null; // glisser-déposer en cours
  let menuFor = null; // widget dont le menu est ouvert
  let configId = null; // widget en cours de configuration

  const widgets = () => app.view().widgets;
  const find = (id) => widgets().find((w) => w.id === id);
  const focusLater = (selector) => requestAnimationFrame(() => document.querySelector(selector)?.focus());

  // -------------------------------------------------------------------------
  // Entrer, terminer, annuler
  // -------------------------------------------------------------------------

  function enter({ focus = true } = {}) {
    if (app.editing) return;
    app.editing = true;
    snapshot = clone(widgets());
    undoStack = [];
    redoStack = [];
    app.render();
    if (focus) focusLater('#btn-done');
  }

  function leave() {
    closeMenu();
    app.editing = false;
    snapshot = null;
    undoStack = [];
    redoStack = [];
  }

  function finish() {
    if (!app.editing) return;
    const changed = undoStack.length > 0;
    leave();
    app.render();
    focusLater('#btn-edit');
    if (changed) app.toast("Disposition appliquée. C'est une démo : rien n'est enregistré.");
  }

  function cancel() {
    if (!app.editing) return;
    const changed = undoStack.length > 0;
    app.view().widgets = snapshot;
    leave();
    app.flip(() => app.render());
    focusLater('#btn-edit');
    if (changed) app.toast('Modifications annulées');
  }

  // -------------------------------------------------------------------------
  // Historique : chaque changement garde une copie de la disposition d'avant
  // -------------------------------------------------------------------------

  function commit(next) {
    undoStack.push(clone(widgets()));
    redoStack = [];
    app.view().widgets = next;
    app.flip(() => app.render());
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(clone(widgets()));
    app.view().widgets = undoStack.pop();
    app.flip(() => app.render());
    app.announce('Action annulée');
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(clone(widgets()));
    app.view().widgets = redoStack.pop();
    app.flip(() => app.render());
    app.announce('Action rétablie');
  }

  // Ctrl+Z / Ctrl+Maj+Z (Cmd sur Mac), sauf pendant une saisie de texte
  document.addEventListener('keydown', (e) => {
    if (!app.editing || !(e.ctrlKey || e.metaKey) || e.target.closest('input, textarea, select, dialog')) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((key === 'z' && e.shiftKey) || key === 'y') {
      e.preventDefault();
      redo();
    }
  });

  // -------------------------------------------------------------------------
  // Glisser-déposer et redimensionnement à la souris (ou au doigt sur tablette)
  // -------------------------------------------------------------------------

  const placeholder = () => grid.querySelector('.drop-target');

  function showPlaceholder(target, valid) {
    const ph = placeholder();
    ph.hidden = false;
    app.setPos(ph, target);
    ph.classList.toggle('is-invalid', !valid);
    ph.innerHTML = valid ? '' : '<span>Pas assez de place</span>';
  }

  grid.addEventListener('pointerdown', (e) => {
    if (!app.editing || e.button !== 0 || isPhone()) return;
    const el = e.target.closest('.widget');
    if (!el || e.target.closest('.handle-menu')) return;
    e.preventDefault();
    const w = find(el.dataset.id);
    const rect = el.getBoundingClientRect();
    drag = {
      el,
      mode: e.target.closest('.handle-resize') ? 'resize' : 'move',
      id: w.id,
      start: { ...w },
      base: widgets(),
      metrics: app.cellMetrics(),
      x0: e.clientX,
      y0: e.clientY,
      // Où on a attrapé le widget : il reste sous le pointeur au même endroit
      grabX: e.clientX - rect.left,
      grabY: e.clientY - rect.top,
      key: null,
      candidate: null,
      started: false,
    };
    el.setPointerCapture(e.pointerId);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
  });

  function onMove(e) {
    const d = drag;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.started) {
      if (Math.hypot(dx, dy) < 4) return; // un simple clic n'est pas un déplacement
      d.started = true;
      d.el.classList.add(d.mode === 'move' ? 'is-dragging' : 'is-resizing');
    }

    const { rect, cw, ch, gap } = d.metrics;
    const s = d.start;
    let target;
    if (d.mode === 'move') {
      d.el.style.translate = `${dx}px ${dy}px`;
      target = {
        x: clamp(Math.round((e.clientX - d.grabX - rect.left) / (cw + gap)) + 1, 1, COLS - s.w + 1),
        y: clamp(Math.round((e.clientY - d.grabY - rect.top) / (ch + gap)) + 1, 1, ROWS - s.h + 1),
        w: s.w,
        h: s.h,
      };
    } else {
      // Le coin bas-droit suit la case sous le pointeur
      const col = clamp(Math.floor((e.clientX - rect.left) / (cw + gap)) + 1, 1, COLS);
      const row = clamp(Math.floor((e.clientY - rect.top) / (ch + gap)) + 1, 1, ROWS);
      const [minW, minH] = CATALOG[s.type].min;
      target = { x: s.x, y: s.y, w: clamp(col - s.x + 1, minW, COLS - s.x + 1), h: clamp(row - s.y + 1, minH, ROWS - s.y + 1) };
    }

    // On ne recalcule que si la case visée change
    const key = `${target.x},${target.y},${target.w},${target.h}`;
    if (key === d.key) return;
    d.key = key;
    const unchanged = target.x === s.x && target.y === s.y && target.w === s.w && target.h === s.h;
    d.candidate = unchanged ? d.base : tryPlace(d.base, d.id, target.x, target.y, target.w, target.h);
    showPlaceholder(target, Boolean(d.candidate));

    // Aperçu en direct : les autres widgets se poussent pour faire de la place
    const layout = d.candidate ?? d.base;
    app.flip(() => {
      for (const w of layout) {
        if (d.mode === 'move' && w.id === d.id) continue;
        app.setPos(grid.querySelector(`.widget[data-id="${w.id}"]`), w);
      }
      if (d.mode === 'resize') app.paintWidget(d.el, layout.find((w) => w.id === d.id));
    }, { skip: d.mode === 'move' ? d.id : null });
    if (d.mode === 'resize') app.fitAll();
  }

  function stopDrag() {
    const d = drag;
    d.el.removeEventListener('pointermove', onMove);
    d.el.removeEventListener('pointerup', onUp);
    d.el.removeEventListener('pointercancel', onCancel);
    drag = null;
    return d;
  }

  function onUp() {
    const d = stopDrag();
    if (!d.started) return;
    if (d.candidate && d.candidate !== d.base) {
      commit(d.candidate);
      return;
    }
    if (!d.candidate) {
      app.toast(d.mode === 'move'
        ? 'Pas assez de place à cet endroit : le widget reprend sa place.'
        : 'Pas assez de place pour cette taille.');
    }
    app.flip(() => app.render());
  }

  function onCancel() {
    stopDrag();
    app.render();
  }

  // -------------------------------------------------------------------------
  // Au clavier : flèches sur la poignée de déplacement
  // -------------------------------------------------------------------------

  const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

  grid.addEventListener('keydown', (e) => {
    const handle = e.target.closest('.handle-move');
    const dir = ARROWS[e.key];
    if (!app.editing || !handle || !dir) return;
    e.preventDefault();
    const w = find(handle.closest('.widget').dataset.id);
    const [minW, minH] = CATALOG[w.type].min;
    let next = null;
    if (!e.shiftKey) next = tryPlace(widgets(), w.id, w.x + dir[0], w.y + dir[1], w.w, w.h);
    else if (w.w + dir[0] >= minW && w.h + dir[1] >= minH) next = tryPlace(widgets(), w.id, w.x, w.y, w.w + dir[0], w.h + dir[1]);
    if (!next) {
      app.announce('Impossible : pas assez de place.');
      return;
    }
    commit(next);
    const r = next.find((x) => x.id === w.id);
    grid.querySelector(`.widget[data-id="${w.id}"] .handle-move`)?.focus();
    app.announce(`${w.title} : colonne ${r.x}, ligne ${r.y}, ${r.w} cases sur ${r.h}`);
  });

  // -------------------------------------------------------------------------
  // Menu d'un widget : configurer, dupliquer, supprimer
  // -------------------------------------------------------------------------

  grid.addEventListener('click', (e) => {
    const button = e.target.closest('.handle-menu');
    if (app.editing && button) openMenu(button);
  });

  function openMenu(button) {
    closeMenu();
    menuFor = button.closest('.widget').dataset.id;
    button.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    const r = button.getBoundingClientRect();
    const below = r.bottom + 4 + menu.offsetHeight <= innerHeight;
    menu.style.top = `${below ? r.bottom + 4 : Math.max(8, r.top - 4 - menu.offsetHeight)}px`;
    menu.style.left = `${clamp(r.right - menu.offsetWidth, 8, innerWidth - menu.offsetWidth - 8)}px`;
    menu.querySelector('[role="menuitem"]').focus();
  }

  function closeMenu({ focus = false } = {}) {
    if (!menuFor) return;
    const button = grid.querySelector(`.widget[data-id="${menuFor}"] .handle-menu`);
    button?.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    menuFor = null;
    if (focus) button?.focus();
  }

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-cmd]');
    if (!item) return;
    const id = menuFor;
    closeMenu();
    COMMANDS[item.dataset.cmd](id);
  });

  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll('[role="menuitem"]')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu({ focus: true });
    } else if (e.key === 'Tab') {
      closeMenu();
    }
  });

  document.addEventListener('pointerdown', (e) => {
    if (menuFor && !menu.contains(e.target) && !e.target.closest('.handle-menu')) closeMenu();
  });

  const COMMANDS = {
    configure: openConfig,

    duplicate(id) {
      const w = find(id);
      const spot = nearestFree(widgets(), w.w, w.h, w);
      if (!spot) {
        app.toast('Pas de place pour une copie : réduis ou retire un widget.');
        return;
      }
      const copy = { ...clone(w), ...spot, id: newId(), title: `${w.title} (copie)` };
      commit([...widgets(), copy]);
      app.flash(copy.id);
      app.toast(`« ${w.title} » dupliqué : change sa source dans « Configurer ».`);
    },

    delete(id) {
      const w = find(id);
      commit(widgets().filter((x) => x.id !== id));
      app.toast(`« ${w.title} » supprimé`, { action: 'Annuler', onAction: undo });
    },
  };

  // -------------------------------------------------------------------------
  // Configuration d'un widget : titre, source, rafraîchissement
  // -------------------------------------------------------------------------

  function openConfig(id) {
    const w = find(id);
    configId = id;
    const sources = compatibleSources(w.type, app.view(), app.state);
    if (!sources.includes(w.source)) sources.unshift(w.source);
    form.elements.title.value = w.title;
    form.elements.source.innerHTML = sources
      .map((s) => `<option value="${s}"${s === w.source ? ' selected' : ''}>${esc(CONNECTORS[s].name)} · ${SOURCE_TYPES[CONNECTORS[s].type]}</option>`)
      .join('') + '<option disabled>Nouveau connecteur… (v1.0)</option>';
    form.elements.refresh.value = String(w.refresh);
    syncRefresh();
    document.getElementById('config-title').textContent = `Configurer « ${w.title} »`;
    dialog.showModal();
  }

  // Une note ou une liste de tâches vit dans dashu : rien à rafraîchir
  function syncRefresh() {
    const internal = form.elements.source.value === 'dashu';
    form.elements.refresh.disabled = internal;
    document.getElementById('cfg-refresh-hint').textContent = internal
      ? 'Données stockées dans dashu : elles sont toujours à jour.'
      : 'Une minute au minimum, pour ne pas surcharger les services.';
  }

  form.elements.source.addEventListener('change', syncRefresh);
  document.getElementById('cfg-cancel').addEventListener('click', () => dialog.close());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = form.elements.title.value.trim();
    const next = widgets().map((w) => (w.id === configId
      ? { ...clone(w), title: title || CATALOG[w.type].name, source: form.elements.source.value, refresh: Number(form.elements.refresh.value) }
      : w));
    dialog.close();
    commit(next);
    app.toast('Widget mis à jour');
  });

  return {
    enter,
    finish,
    cancel,
    commit,
    undo,
    redo,
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    busy: () => drag !== null,
  };
}
