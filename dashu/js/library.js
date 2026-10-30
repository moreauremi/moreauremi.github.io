// Bibliothèque de widgets : le panneau qui s'ouvre avec « + Widget ».
// Deux écrans : la liste (recherche, catégories, filtre « compatible »), puis
// la fiche d'un widget (source, taille, titre, aperçu en direct) avant l'ajout.
import { CATALOG, CATEGORIES, compatibleSources } from './widgets.js';
import { CONNECTORS, SOURCE_TYPES } from './demo-data.js';
import { firstFree, freeCells } from './layout.js';
import { icon } from './icons.js';
import { esc, newId, normalize } from './util.js';

export function createLibrary(app, editor) {
  const dialog = document.getElementById('library');
  const heading = document.getElementById('library-title');
  const content = document.getElementById('library-content');

  const filters = { query: '', category: null, compatible: false };
  let draft = null; // widget en préparation sur la fiche

  function open() {
    if (!app.editing) editor.enter({ focus: false });
    dialog.showModal();
    showList();
  }

  // -------------------------------------------------------------------------
  // Liste
  // -------------------------------------------------------------------------

  function showList(focusType) {
    const view = app.view();
    const free = freeCells(view.widgets);
    draft = null;
    heading.textContent = 'Ajouter un widget';
    content.innerHTML = `
      <div class="lib-tools">
        <input type="search" id="lib-search" class="input" placeholder="Rechercher un widget" aria-label="Rechercher un widget" autocomplete="off" value="${esc(filters.query)}">
        <div class="chips" role="group" aria-label="Catégories">
          ${[null, ...CATEGORIES].map((c) => `<button type="button" class="chip" data-category="${c ?? ''}" aria-pressed="${filters.category === c}">${c ?? 'Tous'}</button>`).join('')}
        </div>
        <label class="check"><input type="checkbox" id="lib-compatible"${filters.compatible ? ' checked' : ''}> Compatible avec mes connecteurs</label>
        <p class="row-sub">${free
          ? `${free} case${free > 1 ? 's' : ''} libre${free > 1 ? 's' : ''} sur 72 dans la vue « ${esc(view.name)} ».`
          : `La vue « ${esc(view.name)} » est pleine : réduis ou retire un widget pour en ajouter un.`}</p>
      </div>
      <div class="lib-list" id="lib-list"></div>`;
    renderItems();
    const target = focusType ? content.querySelector(`.lib-item[data-type="${focusType}"]`) : content.querySelector('#lib-search');
    target?.focus();
  }

  function renderItems() {
    const view = app.view();
    const query = normalize(filters.query.trim());
    const groups = CATEGORIES
      .filter((c) => !filters.category || c === filters.category)
      .map((category) => {
        const items = Object.entries(CATALOG).filter(([type, spec]) =>
          spec.category === category
          && (!query || normalize(`${spec.name} ${spec.description} ${category}`).includes(query))
          && (!filters.compatible || compatibleSources(type, view, app.state).length > 0));
        if (!items.length) return '';
        return `
          <section class="lib-group">
            <h3 class="lib-group-title">${category}</h3>
            <ul class="lib-items">${items.map(([type, spec]) => itemHTML(type, spec, view)).join('')}</ul>
          </section>`;
      })
      .join('');
    content.querySelector('#lib-list').innerHTML = groups
      || `<p class="empty">Aucun widget ne correspond à « ${esc(filters.query)} ».</p>`;
  }

  function itemHTML(type, spec, view) {
    const usable = compatibleSources(type, view, app.state).length > 0;
    return `
      <li>
        <button type="button" class="lib-item" data-type="${type}">
          <span class="lib-icon">${icon(spec.icon, 20)}</span>
          <span class="lib-text">
            <span class="lib-name">${esc(spec.name)}</span>
            <span class="lib-desc">${esc(spec.description)}</span>
            <span class="lib-meta">${spec.sizes.map(([w, h]) => `${w} × ${h}`).join(' · ')} · ${spec.sources.map((s) => SOURCE_TYPES[s]).join(', ')}${usable ? '' : ' · aucun connecteur compatible ici'}</span>
          </span>
        </button>
      </li>`;
  }

  // -------------------------------------------------------------------------
  // Fiche d'un widget : brancher une source, choisir la taille, voir l'aperçu
  // -------------------------------------------------------------------------

  function showDetail(type) {
    const spec = CATALOG[type];
    const view = app.view();
    const sources = compatibleSources(type, view, app.state);
    const [w, h] = spec.sizes[0];
    draft = { id: 'apercu', type, x: 1, y: 1, w, h, title: spec.name, source: sources[0], refresh: 15, settings: spec.defaults?.(view) ?? {} };
    heading.textContent = spec.name;

    const sizeOptions = spec.sizes.map(([sw, sh], i) => {
      const fits = firstFree(view.widgets, sw, sh) !== null;
      return `<option value="${sw}x${sh}">${sw} × ${sh}${i === 0 ? ' (conseillée)' : ''}${fits ? '' : ' · pas de place'}</option>`;
    }).join('');
    const sourceOptions = sources
      .map((s) => `<option value="${s}">${esc(CONNECTORS[s].name)} · ${SOURCE_TYPES[CONNECTORS[s].type]}</option>`)
      .join('');

    content.innerHTML = `
      <div class="lib-detail">
        <button type="button" class="btn btn-ghost lib-back">${icon('back', 16)}Tous les widgets</button>
        <p class="lib-lead">${esc(spec.description)}</p>
        ${sources.length ? `
          <div class="preview-frame" inert><div class="preview-scale" id="lib-preview"></div></div>
          <form class="lib-form" id="lib-form" novalidate>
            <div class="field">
              <label for="lib-source">Source</label>
              <select id="lib-source" class="input">${sourceOptions}<option disabled>Nouveau connecteur… (v1.0)</option></select>
            </div>
            <div class="field">
              <label for="lib-size">Taille (colonnes × lignes)</label>
              <select id="lib-size" class="input">${sizeOptions}</select>
            </div>
            <div class="field">
              <label for="lib-title">Titre</label>
              <input id="lib-title" class="input" maxlength="40" autocomplete="off" value="${esc(draft.title)}">
            </div>
            <p class="form-error" id="lib-error" role="alert" hidden></p>
            <button type="submit" class="btn btn-primary btn-block">Ajouter à la vue</button>
          </form>`
        : `<p class="notice">Aucun connecteur ${spec.sources.map((s) => SOURCE_TYPES[s]).join(' ou ')} dans la vue « ${esc(view.name)} ». Ajouter un connecteur arrive en v1.0 ; en attendant, essaie depuis la vue Générale.</p>`}
      </div>`;
    paintPreview();
    content.querySelector('.lib-back').focus();
  }

  // Le widget est dessiné à sa vraie taille, puis réduit pour tenir dans le panneau
  function paintPreview() {
    const host = content.querySelector('#lib-preview');
    if (!host) return;
    const { cw, ch, gap } = app.cellMetrics();
    const width = cw * draft.w + gap * (draft.w - 1);
    const height = ch * draft.h + gap * (draft.h - 1);
    const scale = Math.min(1, host.parentElement.clientWidth / width);
    host.innerHTML = app.widgetHTML(draft, { preview: true });
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    host.style.transform = `scale(${scale})`;
    host.parentElement.style.height = `${height * scale}px`;
    app.fitAll(host);
  }

  function add() {
    const view = app.view();
    const spot = firstFree(view.widgets, draft.w, draft.h);
    if (!spot) {
      const error = content.querySelector('#lib-error');
      error.textContent = `Plus de place pour un widget ${draft.w} × ${draft.h}. Choisis une taille plus petite, ou ferme ce panneau pour réduire ou retirer un widget.`;
      error.hidden = false;
      return;
    }
    const widget = { ...structuredClone(draft), ...spot, id: newId(), title: draft.title.trim() || CATALOG[draft.type].name };
    dialog.close();
    editor.commit([...view.widgets, widget]);
    app.flash(widget.id);
    app.toast(`« ${widget.title} » ajouté. Glisse-le pour le placer ailleurs.`);
  }

  // -------------------------------------------------------------------------
  // Événements (un seul écouteur par type pour tout le panneau)
  // -------------------------------------------------------------------------

  content.addEventListener('input', (e) => {
    if (e.target.id === 'lib-search') {
      filters.query = e.target.value;
      renderItems();
    } else if (e.target.id === 'lib-title') {
      draft.title = e.target.value;
      paintPreview();
    }
  });

  content.addEventListener('change', (e) => {
    if (e.target.id === 'lib-compatible') {
      filters.compatible = e.target.checked;
      renderItems();
    } else if (e.target.id === 'lib-source') {
      draft.source = e.target.value;
      paintPreview();
    } else if (e.target.id === 'lib-size') {
      [draft.w, draft.h] = e.target.value.split('x').map(Number);
      content.querySelector('#lib-error').hidden = true;
      paintPreview();
    }
  });

  content.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    const item = e.target.closest('.lib-item');
    if (chip) {
      filters.category = chip.dataset.category || null;
      for (const c of content.querySelectorAll('.chip')) c.setAttribute('aria-pressed', String(c === chip));
      renderItems();
    } else if (item) {
      showDetail(item.dataset.type);
    } else if (e.target.closest('.lib-back')) {
      showList(draft?.type);
    }
  });

  content.addEventListener('submit', (e) => {
    e.preventDefault();
    add();
  });

  document.getElementById('library-close').addEventListener('click', () => dialog.close());
  // Un clic sur le fond assombri ferme le panneau
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  return { open };
}
