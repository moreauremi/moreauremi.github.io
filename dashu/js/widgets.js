// Catalogue des widgets : tout ce que propose la bibliothèque (« + Widget »).
//
// Chaque type de widget décrit :
//   - sa fiche dans la bibliothèque (nom, catégorie, description, icône) ;
//   - les sources qu'il accepte (types de connecteurs) et les tailles conseillées ;
//   - render(widget, ctx) : le HTML du contenu, recalculé à chaque changement ;
//   - meta(widget, ctx)   : l'information secondaire en haut à droite ;
//   - actions             : ce que font ses boutons (data-action="…").
//
// ctx = { state, now, toast, announce, update } est fourni par main.js.
// Tout texte venant des données passe par esc() avant d'entrer dans le HTML.
import { icon } from './icons.js';
import { CONNECTORS, CATEGORY_NAMES, CALENDAR_CATEGORY, eventsOn, displayedMonday } from './demo-data.js';
import { esc, fmtHour, fmtRange, fmtNumber, hoursOf, addDays, startOfDay, sameDay, weekdayIndex } from './util.js';

export const CATEGORIES = ['Agenda', 'Données', 'Maison', 'Infos', 'Liens et notes', 'Services'];

// ---------------------------------------------------------------------------
// Petits morceaux réutilisés
// ---------------------------------------------------------------------------

const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const H_START = 8; // l'agenda de la semaine va de 8:00…
const H_END = 20; // … à 20:00

const calendarsOf = (w) => CONNECTORS[w.source]?.calendars ?? [];
const pick = (collection, source) => collection[source] ?? Object.values(collection)[0];
const dot = (cls) => `<span class="dot ${cls}" aria-hidden="true"></span>`;
const hidden = (text) => `<span class="visually-hidden">${esc(text)}</span>`;
const empty = (text) => `<p class="empty">${esc(text)}</p>`;
const temp = (value) => fmtNumber(value, value % 1 ? 1 : 0);
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

// Courbe sans axes pour le chiffre clé
function sparkline(values) {
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const points = values
    .map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(1)},${(29 - ((v - min) / range) * 26).toFixed(1)}`)
    .join(' ');
  return `<svg class="spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}

// Légende des catégories : la couleur ne suffit pas, on écrit aussi le nom
function legend(w) {
  const categories = [...new Set(calendarsOf(w).map((c) => CALENDAR_CATEGORY[c]))];
  return `<span class="legend">${categories
    .map((c) => `<span class="legend-item">${dot(`cat-${c}`)}${CATEGORY_NAMES[c]}</span>`)
    .join('')}</span>`;
}

// ---------------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------------

function renderWeek(w, ctx) {
  // Moins de place = moins de jours : on réduit le contenu, pas la page
  const days = w.w >= 5 ? 5 : w.w >= 3 ? 3 : 1;
  const monday = displayedMonday(ctx.now);
  const todayIndex = weekdayIndex(ctx.now);
  const first = days === 5 || todayIndex > 4 ? 0 : Math.min(todayIndex, 5 - days);
  const pct = (h) => ((Math.min(Math.max(h, H_START), H_END) - H_START) / (H_END - H_START)) * 100;
  const now = hoursOf(ctx.now);

  let head = '<span></span>';
  let columns = '';
  for (let i = 0; i < days; i++) {
    const date = addDays(monday, first + i);
    const isToday = sameDay(date, ctx.now);
    head += `<div class="week-day${isToday ? ' is-today' : ''}"><span>${DAY_SHORT[first + i]}</span><span class="day-num">${date.getDate()}</span></div>`;

    const events = eventsOn(date, calendarsOf(w))
      .filter((e) => e.end > H_START && e.start < H_END)
      .map((e) => `
        <div class="event cat-${e.category}" style="top:${pct(e.start)}%;height:calc(${pct(e.end) - pct(e.start)}% - 2px)">
          <span class="event-title">${hidden(`${CATEGORY_NAMES[e.category]} : `)}${esc(e.title)}</span>
          <span class="event-time">${fmtRange(e.start, e.end)}</span>
        </div>`)
      .join('');
    const nowLine = isToday && now >= H_START && now <= H_END
      ? `<div class="now-line" style="top:${pct(now)}%">${hidden(`Il est ${fmtHour(now)}`)}</div>`
      : '';
    columns += `<div class="day-col${isToday ? ' is-today' : ''}" style="grid-column:${i + 2}">${events}${nowLine}</div>`;
  }

  const hours = [];
  for (let h = H_START; h < H_END; h += 2) hours.push(h);
  return `
    <div class="week" style="--days:${days}">
      ${head}
      <div class="week-hours" aria-hidden="true">${hours.map((h) => `<span style="top:${pct(h)}%">${h}:00</span>`).join('')}</div>
      <div class="week-lines" aria-hidden="true">${hours.map((h) => `<span style="top:${pct(h)}%"></span>`).join('')}</div>
      ${columns}
    </div>`;
}

function renderToday(w, ctx) {
  const now = hoursOf(ctx.now);
  const all = eventsOn(ctx.now, calendarsOf(w));
  const left = all.filter((e) => e.end > now);
  if (!left.length) {
    const tomorrow = eventsOn(addDays(ctx.now, 1), calendarsOf(w))[0];
    return empty(all.length ? "Plus rien aujourd'hui." : "Rien de prévu aujourd'hui.")
      + (tomorrow ? `<p class="row-sub">Demain : ${esc(tomorrow.title)} à ${fmtHour(tomorrow.start)}</p>` : '');
  }
  return `<ul class="list fit">${left.map((e) => {
    const current = e.start <= now;
    return `
      <li class="row${current ? ' is-current' : ''}">
        <span class="row-time">${fmtRange(e.start, e.end)}</span>
        ${dot(`cat-${e.category}`)}
        <span class="row-title">${hidden(`${CATEGORY_NAMES[e.category]} : `)}${esc(e.title)}</span>
        ${current ? '<span class="badge">en cours</span>' : ''}
      </li>`;
  }).join('')}</ul>`;
}

function renderNext(w, ctx) {
  const now = hoursOf(ctx.now);
  for (let d = 0; d < 7; d++) {
    const date = addDays(startOfDay(ctx.now), d);
    const e = eventsOn(date, calendarsOf(w)).find((ev) => d > 0 || ev.start > now);
    if (!e) continue;

    let when;
    if (d === 0) {
      const minutes = Math.max(1, Math.round((e.start - now) * 60));
      when = minutes < 60
        ? `dans ${minutes} min`
        : `dans ${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${String(minutes % 60).padStart(2, '0')}` : ''}`;
    } else {
      when = `${d === 1 ? 'demain' : date.toLocaleDateString('fr-FR', { weekday: 'long' })} ${fmtHour(e.start)}`;
    }
    return `
      <div class="next">
        <p class="big-value">${esc(when)}</p>
        <p class="next-title">${dot(`cat-${e.category}`)}<span>${hidden(`${CATEGORY_NAMES[e.category]} : `)}${esc(e.title)}</span></p>
        <p class="row-sub">${fmtRange(e.start, e.end)}${e.place ? ` · ${esc(e.place)}` : ''}</p>
      </div>`;
  }
  return empty('Aucun événement dans les 7 prochains jours.');
}

// ---------------------------------------------------------------------------
// Maison (scènes : réglages groupés, appliqués d'un seul bouton)
// ---------------------------------------------------------------------------

const SCENES = [
  { id: 'soiree', name: 'Soirée', icon: 'sunset', lights: ['salon', 'cuisine', 'entree'], target: 21 },
  { id: 'nuit', name: 'Nuit', icon: 'moon', lights: [], target: 18 },
  { id: 'absent', name: 'Absent', icon: 'lock', lights: [], target: 16, confirm: "« Absent » active l'alarme et coupe toutes les lumières." },
  { id: 'reveil', name: 'Réveil', icon: 'sunrise', lights: ['chambre', 'cuisine'], target: 21 },
];

const WEATHER_LABELS = { rain: 'pluie', cloud: 'nuageux', sun: 'soleil', moon: 'nuit dégagée' };

// ---------------------------------------------------------------------------
// Le catalogue
// ---------------------------------------------------------------------------

export const CATALOG = {
  'agenda-semaine': {
    name: 'Semaine',
    category: 'Agenda',
    icon: 'calendar',
    description: 'Les cinq jours de la semaine, heure par heure.',
    sources: ['ics'],
    sizes: [[6, 4], [6, 3], [4, 4], [9, 4]],
    min: [3, 2],
    live: true,
    render: renderWeek,
    meta: legend,
  },

  aujourdhui: {
    name: "Aujourd'hui",
    category: 'Agenda',
    icon: 'clock',
    description: "Ce qui reste aujourd'hui, avec l'événement en cours.",
    sources: ['ics'],
    sizes: [[3, 2], [3, 3], [4, 2]],
    min: [2, 1],
    live: true,
    render: renderToday,
    meta: (w, ctx) => esc(ctx.now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })),
  },

  prochain: {
    name: 'Prochain événement',
    category: 'Agenda',
    icon: 'next',
    description: "Le prochain rendez-vous et le temps qu'il reste.",
    sources: ['ics'],
    sizes: [[3, 2], [3, 1], [4, 2]],
    min: [2, 1],
    live: true,
    render: renderNext,
  },

  chiffre: {
    name: 'Chiffre clé',
    category: 'Données',
    icon: 'hash',
    description: 'Un grand nombre et son évolution.',
    sources: ['csv', 'rest'],
    dataKey: 'metrics',
    sizes: [[3, 2], [2, 2], [4, 2]],
    min: [2, 1],
    render(w, ctx) {
      const m = pick(ctx.state.metrics, w.source);
      return `
        <div class="kpi">
          <div>
            <p class="kpi-value">${fmtNumber(m.value)}${m.unit ? `\u202f${esc(m.unit)}` : ''}</p>
            <p class="row-sub">${esc(m.label)}</p>
          </div>
          ${sparkline(m.spark)}
          <p class="kpi-delta">${icon(m.trend === 'up' ? 'up' : 'down', 16)}<span>${esc(m.delta)}</span></p>
        </div>`;
    },
  },

  graphique: {
    name: 'Graphique',
    category: 'Données',
    icon: 'chart',
    description: 'Des barres pour comparer des périodes.',
    sources: ['csv', 'rest'],
    dataKey: 'series',
    sizes: [[5, 3], [6, 3], [4, 2], [6, 2]],
    min: [3, 2],
    render(w, ctx) {
      const s = pick(ctx.state.series, w.source);
      // Échelle commune partant de zéro, avec un peu de marge pour les étiquettes
      const top = Math.max(...s.points.map(([, v]) => v)) * 1.18;
      const value = (v) => fmtNumber(v, v % 1 ? 1 : 0);
      const summary = s.points.map(([label, v]) => `${label} ${value(v)}`).join(', ');
      return `
        <div class="bars" role="img" aria-label="${esc(`${w.title}, ${s.unit} ${s.caption} : ${summary}`)}">
          ${s.points.map(([label, v], i) => `
            <div class="bar-col${i === s.points.length - 1 ? ' is-last' : ''}">
              <div class="bar-track" style="--h:${(v / top) * 100}%">
                <span class="bar"></span>
                <span class="bar-value">${value(v)}</span>
              </div>
              <span class="bar-label">${esc(label)}</span>
            </div>`).join('')}
        </div>`;
    },
    meta: (w, ctx) => {
      const s = pick(ctx.state.series, w.source);
      return esc(`${s.unit ? `${s.unit} ` : ''}${s.caption}`);
    },
  },

  tableau: {
    name: 'Tableau',
    category: 'Données',
    icon: 'table',
    description: "Les lignes d'un tableur, triables par colonne.",
    sources: ['csv'],
    dataKey: 'tables',
    sizes: [[6, 3], [6, 2], [9, 3]],
    min: [4, 2],
    render(w, ctx) {
      const t = pick(ctx.state.tables, w.source);
      const sort = w.settings.sort;
      const rows = [...t.rows];
      if (sort) {
        rows.sort((a, b) => {
          const x = a[sort.key];
          const y = b[sort.key];
          const order = typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'fr');
          return sort.dir === 'asc' ? order : -order;
        });
      }
      const head = t.columns.map((c) => {
        const active = sort?.key === c.key;
        const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
        return `
          <th scope="col" aria-sort="${ariaSort}"${c.width ? ` style="width:${c.width}"` : ''}>
            <button type="button" class="th-btn" data-action="sort" data-key="${c.key}">${esc(c.label)}${active ? `<span aria-hidden="true">${sort.dir === 'asc' ? '↑' : '↓'}</span>` : ''}</button>
          </th>`;
      }).join('');
      const body = rows.map((r) => `<tr>${t.columns.map((c) => {
        const muted = r[c.key] === 'Résolu';
        return `<td class="${c.numeric ? 'num' : ''}${muted ? ' muted' : ''}">${esc(r[c.key])}${c.unit ?? ''}</td>`;
      }).join('')}</tr>`).join('');
      return `<div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody class="fit">${body}</tbody></table></div>`;
    },
    meta: (w, ctx) => plural(pick(ctx.state.tables, w.source).rows.length, 'ligne'),
    actions: {
      sort(ctx, w, el) {
        const key = el.dataset.key;
        const current = w.settings.sort;
        w.settings.sort = { key, dir: current?.key === key && current.dir === 'asc' ? 'desc' : 'asc' };
        ctx.update();
      },
    },
  },

  json: {
    name: 'JSON libre',
    category: 'Données',
    icon: 'braces',
    description: "Les champs choisis d'une API, sans écrire de code.",
    sources: ['rest'],
    dataKey: 'json',
    sizes: [[3, 2], [3, 3], [4, 2]],
    min: [2, 2],
    render(w, ctx) {
      const j = pick(ctx.state.json, w.source);
      return `<dl class="kv fit">${j.fields.map(([k, v]) => `<div class="kv-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
    },
    meta: (w, ctx) => esc(pick(ctx.state.json, w.source).url),
  },

  appareil: {
    name: 'Appareil',
    category: 'Maison',
    icon: 'lightbulb',
    description: 'Allumer et éteindre lumières et prises.',
    sources: ['ha'],
    sizes: [[3, 3], [3, 2], [4, 3]],
    min: [2, 2],
    render(w, ctx) {
      return `<ul class="list fit">${ctx.state.devices.map((d) => `
        <li class="row device">
          <span class="row-icon">${icon(d.kind === 'plug' ? 'plug' : 'lightbulb')}</span>
          <span class="row-title">${esc(d.name)}</span>
          <button type="button" class="switch" aria-pressed="${d.on}" aria-label="${esc(`${d.kind === 'plug' ? 'Prise' : 'Lumière'} ${d.name}`)}" data-action="toggle" data-id="${d.id}"><span class="knob"></span></button>
        </li>`).join('')}</ul>`;
    },
    meta: (w, ctx) => {
      const on = ctx.state.devices.filter((d) => d.on).length;
      return on ? `${on} allumée${on > 1 ? 's' : ''}` : 'tout est éteint';
    },
    actions: {
      toggle(ctx, w, el) {
        const d = ctx.state.devices.find((x) => x.id === el.dataset.id);
        d.on = !d.on;
        ctx.state.scene = null; // un réglage à la main sort de la scène en cours
        ctx.update();
        ctx.announce(`${d.kind === 'plug' ? 'Prise' : 'Lumière'} ${d.name} ${d.on ? 'allumée' : 'éteinte'}`);
      },
    },
  },

  thermostat: {
    name: 'Thermostat',
    category: 'Maison',
    icon: 'thermometer',
    description: 'Température actuelle et consigne du chauffage.',
    sources: ['ha'],
    sizes: [[3, 3], [3, 2]],
    min: [2, 2],
    render(w, ctx) {
      const t = ctx.state.thermostat;
      return `
        <div class="thermo">
          <div>
            <p class="big-value">${temp(t.current)}\u202f°C</p>
            <p class="row-sub">${esc(t.room)} · humidité ${t.humidity} %</p>
          </div>
          <div class="thermo-set">
            <button type="button" class="btn-action" data-action="down" aria-label="Baisser la consigne">${icon('minus')}</button>
            <p class="thermo-target"><span class="row-sub">Consigne</span><strong>${temp(t.target)} °C</strong></p>
            <button type="button" class="btn-action" data-action="up" aria-label="Monter la consigne">${icon('plus')}</button>
          </div>
        </div>`;
    },
    meta: (w, ctx) => (ctx.state.thermostat.target > ctx.state.thermostat.current ? 'chauffe' : 'en veille'),
    actions: {
      down(ctx) {
        const t = ctx.state.thermostat;
        t.target = Math.max(12, t.target - 0.5);
        ctx.update();
        ctx.announce(`Consigne ${temp(t.target)} degrés`);
      },
      up(ctx) {
        const t = ctx.state.thermostat;
        const next = Math.min(28, t.target + 0.5);
        const apply = () => {
          t.target = next;
          ctx.update();
          ctx.announce(`Consigne ${temp(t.target)} degrés`);
        };
        // Action sensible : au-delà du seuil, on demande une confirmation
        if (next > t.limit) {
          ctx.toast(`Au-delà de ${t.limit} °C, une confirmation est demandée.`, { action: `Passer à ${temp(next)} °C`, onAction: apply });
          return;
        }
        apply();
      },
    },
  },

  scene: {
    name: 'Scène',
    category: 'Maison',
    icon: 'wand',
    description: "Plusieurs réglages d'un seul bouton.",
    sources: ['ha'],
    sizes: [[3, 2], [6, 1]],
    min: [2, 1],
    render(w, ctx) {
      return `<div class="scenes">${SCENES.map((s) => `
        <button type="button" class="scene" aria-pressed="${ctx.state.scene === s.id}" data-action="apply" data-id="${s.id}">${icon(s.icon)}<span>${s.name}</span></button>`).join('')}</div>`;
    },
    meta: (w, ctx) => SCENES.find((s) => s.id === ctx.state.scene)?.name.toLowerCase() ?? 'aucune active',
    actions: {
      apply(ctx, w, el) {
        const scene = SCENES.find((s) => s.id === el.dataset.id);
        const run = () => {
          for (const d of ctx.state.devices) if (d.kind === 'light') d.on = scene.lights.includes(d.id);
          ctx.state.thermostat.target = scene.target;
          ctx.state.scene = scene.id;
          ctx.update();
          ctx.toast(`Scène « ${scene.name} » appliquée`);
        };
        if (scene.confirm && ctx.state.scene !== scene.id) {
          ctx.toast(scene.confirm, { action: 'Confirmer', onAction: run });
          return;
        }
        run();
      },
    },
  },

  meteo: {
    name: 'Météo',
    category: 'Infos',
    icon: 'cloud',
    description: "Le temps qu'il fait et les prochaines heures.",
    sources: ['rest'],
    dataKey: 'weather',
    sizes: [[3, 1], [3, 2], [4, 2]],
    min: [2, 1],
    render(w, ctx) {
      const m = pick(ctx.state.weather, w.source);
      return `
        <div class="weather">
          <div class="weather-now">
            <span class="weather-icon">${icon(m.icon, 34)}</span>
            <p class="big-value">${m.temp}°</p>
            <p class="weather-desc"><span>${esc(m.condition)}</span><span class="row-sub">${m.min}° / ${m.max}°</span></p>
          </div>
          <ul class="forecast">${m.hours.map(([hour, t, ic]) => `
            <li><span class="row-sub">${hour}</span>${icon(ic)}${hidden(WEATHER_LABELS[ic])}<span>${t}°</span></li>`).join('')}</ul>
        </div>`;
    },
    meta: (w, ctx) => esc(pick(ctx.state.weather, w.source).place),
  },

  rss: {
    name: 'Flux RSS',
    category: 'Infos',
    icon: 'rss',
    description: 'Les derniers articles de vos sites préférés.',
    sources: ['rss'],
    dataKey: 'feed',
    sizes: [[4, 4], [3, 3], [6, 3]],
    min: [3, 2],
    render(w, ctx) {
      return `<ul class="list fit">${pick(ctx.state.feed, w.source).map((a) => `
        <li class="row feed-row">
          <a class="feed-link" href="#article" data-action="open">
            <span class="feed-title">${esc(a.title)}</span>
            <span class="row-sub">${esc(a.source)} · ${esc(a.age)}</span>
          </a>
        </li>`).join('')}</ul>`;
    },
    meta: (w, ctx) => {
      const fresh = pick(ctx.state.feed, w.source).filter((a) => a.fresh).length;
      return `${fresh} nouveau${fresh > 1 ? 'x' : ''}`;
    },
    actions: {
      open(ctx) {
        ctx.toast('Article de démo : ce flux RSS est fictif.');
      },
    },
  },

  liens: {
    name: 'Liens',
    category: 'Liens et notes',
    icon: 'link',
    description: 'Une grille de raccourcis.',
    sources: ['dashu'],
    sizes: [[3, 2], [6, 1], [3, 3]],
    min: [2, 1],
    render(w, ctx) {
      return `<div class="links fit">${ctx.state.links.map((l) => `
        <a class="link-tile" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
          <span class="monogram" aria-hidden="true">${esc(l.mono)}</span><span class="link-name">${esc(l.name)}</span>
        </a>`).join('')}</div>`;
    },
    meta: (w, ctx) => plural(ctx.state.links.length, 'raccourci'),
  },

  notes: {
    name: 'Notes',
    category: 'Liens et notes',
    icon: 'note',
    description: 'Un texte libre, modifiable sur place.',
    sources: ['dashu'],
    sizes: [[3, 2], [4, 2], [3, 3]],
    min: [2, 2],
    defaults: () => ({ heading: 'Nouvelle note', text: '' }),
    render(w) {
      const heading = w.settings.heading ?? 'Nouvelle note';
      return `
        <div class="note">
          <p class="note-title">${esc(heading)}</p>
          <textarea class="note-text" data-input="note" placeholder="Écrire ici…" aria-label="${esc(`Texte de la note « ${heading} »`)}">${esc(w.settings.text ?? '')}</textarea>
        </div>`;
    },
    input(ctx, w, el) {
      w.settings.text = el.value;
    },
  },

  taches: {
    name: 'Tâches',
    category: 'Liens et notes',
    icon: 'checklist',
    description: 'Une liste à cocher.',
    sources: ['dashu'],
    sizes: [[3, 2], [3, 3], [3, 4]],
    min: [2, 2],
    // Liste de départ selon la vue où on l'ajoute
    defaults: (view) => ({ list: { equipe: 'equipe', maison: 'courses' }[view.id] ?? 'perso' }),
    render(w, ctx) {
      const list = ctx.state.tasks[w.settings.list] ?? [];
      if (!list.length) return empty('Aucune tâche.');
      // Les tâches à faire d'abord : ce sont elles qui doivent rester visibles
      const sorted = [...list.filter((t) => !t.done), ...list.filter((t) => t.done)];
      return `<ul class="list fit">${sorted.map((t) => `
        <li class="row task${t.done ? ' is-done' : ''}">
          <label class="check"><input type="checkbox" data-action="toggle" data-id="${t.id}"${t.done ? ' checked' : ''}><span class="row-title">${esc(t.text)}</span></label>
        </li>`).join('')}</ul>`;
    },
    meta: (w, ctx) => {
      const list = ctx.state.tasks[w.settings.list] ?? [];
      return `${list.filter((t) => t.done).length}/${list.length} faites`;
    },
    actions: {
      toggle(ctx, w, el) {
        const t = ctx.state.tasks[w.settings.list].find((x) => x.id === el.dataset.id);
        t.done = el.checked;
        ctx.update();
      },
    },
  },

  services: {
    name: 'Statut de service',
    category: 'Services',
    icon: 'activity',
    description: 'En ligne ou hors ligne, avec le temps de réponse.',
    sources: ['ping'],
    dataKey: 'services',
    sizes: [[3, 2], [3, 3], [4, 2]],
    min: [2, 2],
    render(w, ctx) {
      const list = [...pick(ctx.state.services, w.source)].sort((a, b) => a.ok - b.ok);
      return `<ul class="list fit">${list.map((s) => `
        <li class="row">
          ${dot(s.ok ? 'ok' : 'error')}
          <span class="row-title">${esc(s.name)}</span>
          ${s.ok
            ? `<span class="row-sub">${hidden('en ligne, ')}${s.ms} ms</span>`
            : `<span class="row-sub error-text">hors ligne · ${esc(s.since)}</span>`}
        </li>`).join('')}</ul>`;
    },
    meta: (w, ctx) => {
      const down = pick(ctx.state.services, w.source).filter((s) => !s.ok).length;
      return down ? `<span class="error-text">${down} hors ligne</span>` : 'tout est en ligne';
    },
  },
};

// Connecteurs de la vue qu'un type de widget peut utiliser
export function compatibleSources(type, view, state) {
  const spec = CATALOG[type];
  return [...new Set(['dashu', ...view.connectors])].filter((id) =>
    spec.sources.includes(CONNECTORS[id].type) && (!spec.dataKey || state[spec.dataKey][id]));
}
