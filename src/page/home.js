// =============================================================================
// Accueil de la vue page : une colonne centrée, façon page Notion
// -----------------------------------------------------------------------------
// De haut en bas : nom et photo, phrase d'accueil, réalisations à la une,
// projet professionnel, toutes les réalisations (filtrables par
// type), épreuve E5, dernières synthèses de veille, contact et signature.
// Tout vient du contenu (content/) : rien n'est écrit ici en dur, sauf les
// libellés de l'interface.
//
// Chaque lien dit où il mène : nom de la page de destination suivi de « → »,
// ou « ↗ » pour un autre site (nouvel onglet).
// =============================================================================

import { site, pages, realisations, getRealisation, veilles, TYPES } from '../content.js';
import { link } from '../router.js';
import { escapeHtml, safe } from '../utils/html.js';
import { formatDate, formatShortDate } from '../utils/dates.js';
import { ICONS } from './icons.js';
import { TYPE_STYLES, ficheIcon, typeTag, menuButton, themeButton, externalLink, label, goTo } from './parts.js';

// Couleur d'étiquette de chaque sujet de veille, dans l'ordre des sujets
const VEILLE_COLORS = ['red', 'blue', 'yellow', 'purple', 'green'];

export function homePage() {
  return `<div class="pg-mobilebar">${menuButton()}${themeButton()}</div>
  ${corner()}
  <main class="pg-col" id="pg-main">
    ${header()}
    ${intro()}
    ${featured()}
    ${projet()}
    ${realisationsList()}
    ${epreuve()}
    ${veille()}
    ${footer()}
  </main>`;
}

// Valeur d'une ligne « neofetch » de la configuration (« Formation »…)
function fact(key) {
  return site.neofetch.find(([k]) => k === key)?.[1] ?? '';
}

// --- Coin droit : lieu, fuseau et heure (mise à jour par page-view.js) --------

function corner() {
  const { localisation } = site.contact;
  return `<div class="pg-corner" aria-label="Heure à ${escapeHtml(localisation || 'Nantes')}" role="group">
    ${localisation ? `<span class="pg-chip">${ICONS.pin}<span>${escapeHtml(localisation.toUpperCase())}</span></span>` : ''}
    <span class="pg-chip">${ICONS.globe}<span data-clock="offset"></span></span>
    <span class="pg-chip"><span class="pg-live">${ICONS.clock}</span><time data-clock="time"></time></span>
  </div>`;
}

// --- Nom, formation et poste, photo avec pastille « disponible » --------------

function header() {
  const { nom, photo } = site.identite;
  const { disponibilite } = site.contact;
  const role = [fact('Formation'), fact('Poste')].filter(Boolean).map(safe).join(' &lt;&gt; ');
  const avatar = photo
    ? `<span class="pg-avatar">
        <img src="${escapeHtml(photo)}" alt="Portrait de ${escapeHtml(nom)}" width="56" height="56" decoding="async">
        ${disponibilite ? `<span class="pg-avatar-dot" title="${escapeHtml(disponibilite)}"></span>` : ''}
      </span>`
    : '';
  return `<header class="pg-head">
    <div>
      <h1 class="pg-name" tabindex="-1">${safe(nom)}</h1>
      <p class="pg-role">${role}</p>
    </div>
    ${avatar}
  </header>`;
}

function intro() {
  const { intro: first = '', introSuite = '' } = site.accueil ?? {};
  const { cv } = site.documents;
  return `<p class="pg-intro">${safe(first)} <span class="pg-muted">${safe(introSuite)}</span></p>
  <p class="pg-intro-links">
    <a href="${link.section('presentation')}">${goTo('Ma présentation')}</a>
    ${cv ? externalLink(cv, 'Mon CV (PDF)') : ''}
  </p>`;
}

// --- Réalisations à la une (accueil.aLaUne) : une à la fois, des points
// pour passer à la suivante -----------------------------------------------------

function featured() {
  const slides = (site.accueil?.aLaUne ?? [])
    .map(({ fiche, image }) => ({ r: getRealisation(fiche), image }))
    .filter(({ r }) => r);
  if (slides.length === 0) return '';

  const items = slides
    .map(
      ({ r, image }, i) => `<a class="pg-feature-slide" href="${link.fiche(r.slug)}"${i ? ' data-off' : ''}>
      <span class="pg-feature-media pg-feature-media--${r.type}">
        ${image ? `<img src="${escapeHtml(image)}" alt="" ${i ? 'loading="lazy" ' : ''}decoding="async">` : ''}
      </span>
      <span class="pg-feature-meta">
        <span class="pg-feature-title">${safe(r.titre)}</span>
        <span class="pg-feature-sub">${[TYPE_STYLES[r.type]?.label, ...r.technos.slice(0, 3)].filter(Boolean).map(safe).join(' · ')}</span>
        ${goTo('Lire la fiche')}
      </span>
    </a>`,
    )
    .join('');
  const dots =
    slides.length > 1
      ? `<div class="pg-dots" role="group" aria-label="Choisir la réalisation à la une">${slides
          .map(
            ({ r }, i) => `<button type="button" class="pg-dot" data-slide="${i}" aria-pressed="${i === 0}" aria-label="${escapeHtml(r.titre)}"></button>`,
          )
          .join('')}</div>`
      : '';

  return `<section aria-labelledby="pg-une">
    ${label('Réalisation à la une', { id: 'pg-une' })}
    <div class="pg-feature" data-carousel>${items}${dots}</div>
  </section>`;
}

// --- Projet professionnel : repris de la présentation (paragraphe qui suit le
// titre « Mon projet professionnel »), pour ne l'écrire qu'une fois ---------------

function projet() {
  const template = document.createElement('template');
  template.innerHTML = pages.presentation.html;
  const heading = [...template.content.querySelectorAll('h2')].find((h) => /projet professionnel/i.test(h.textContent));
  const paragraph = heading?.nextElementSibling;
  if (!paragraph || paragraph.tagName !== 'P') return '';

  return `<figure class="pg-quote">
    <svg class="pg-quote-mark" viewBox="0 0 30 22" aria-hidden="true" focusable="false"><path d="M0 22V12C0 5 3.6 1.2 10.8 0l1 3.4C8 4.6 6.4 7 6.3 10H12v12H0zm17 0V12c0-7 3.6-10.8 10.8-12l1 3.4C25 4.6 23.4 7 23.3 10H29v12H17z" fill="currentColor"/></svg>
    <blockquote><p>${paragraph.innerHTML}</p></blockquote>
    <figcaption>Mon projet professionnel</figcaption>
  </figure>`;
}

// --- Toutes les réalisations, en liste façon base Notion ---------------------
// Les onglets filtrent la liste par type (page-view.js) ; chaque ligne ouvre
// sa fiche ; ↑ ↓ passent d'une réalisation à l'autre.

function realisationsList() {
  const filter = (type, text, count, pressed = false) =>
    `<button type="button" class="pg-db-tab" data-filter="${type}" aria-pressed="${pressed}">${text} <span class="pg-db-count">${count}</span></button>`;
  const tabs = [
    filter('', 'Toutes', realisations.length, true),
    ...Object.keys(TYPES).map((type) =>
      filter(type, TYPE_STYLES[type].label, realisations.filter((r) => r.type === type).length),
    ),
  ].join('');

  const rows = realisations
    .map(
      (r) => `<li data-type="${r.type}">
      <a class="pg-row" href="${link.fiche(r.slug)}">
        <span class="pg-row-icon" aria-hidden="true">${ficheIcon(r)}</span>
        <span class="pg-row-text">
          <span class="pg-row-title">${safe(r.titre)}${r.brouillon ? ' <span class="draft-badge">brouillon</span>' : ''}</span>
          ${r.resume ? `<span class="pg-row-sub">${safe(r.resume)}</span>` : ''}
        </span>
        ${typeTag(r)}
        <span class="pg-row-date">${safe(formatShortDate(r.date))}</span>
      </a>
    </li>`,
    )
    .join('');

  return `<section aria-labelledby="pg-realisations">
    ${label('Réalisations', { id: 'pg-realisations' })}
    <p class="pg-hint">Cliquez sur une réalisation pour ouvrir sa fiche.</p>
    <div class="pg-db" data-db>
      <div class="pg-db-tabs" role="group" aria-label="Filtrer les réalisations par type">${tabs}</div>
      <ul class="pg-rows" data-nav-list>${rows}</ul>
    </div>
    <a class="pg-link-out" href="${link.section('realisations')}">${goTo('Rubrique Réalisations, classées par contexte')}</a>
  </section>`;
}

// --- Épreuve E5 : tableau de synthèse, compétences, certifications ------------

function epreuve() {
  const codes = site.competences.map((c) => c.code);
  const { niveaux, domaines } = site.savoirFaire;
  const skills = domaines.reduce((sum, d) => sum + d.items.length, 0);
  const certifs = site.certifications?.length ?? 0;

  const card = (id, title, text, badge = '') => `<a class="pg-card pg-card--link" href="${link.section(id)}">
      <span class="pg-card-title">${title}${badge ? ` <span class="pg-badge">${badge}</span>` : ''}</span>
      <span class="pg-card-text">${text}</span>
      ${goTo(`Ouvrir « ${title} »`)}
    </a>`;

  return `<section aria-labelledby="pg-e5">
    ${label('Épreuve E5', { id: 'pg-e5' })}
    <div class="pg-cards">
      ${card(
        'synthese',
        'Tableau de synthèse',
        `${realisations.length} réalisations croisées avec les ${codes.length} compétences du référentiel (${escapeHtml(codes[0])} à ${escapeHtml(codes.at(-1))}), généré à partir des fiches.`,
        'À jour',
      )}
      ${card(
        'competences',
        'Compétences',
        `${skills} savoir-faire techniques en ${domaines.length} domaines, chacun avec mon niveau, de « ${safe(niveaux[0].nom)} » à « ${safe(niveaux.at(-1).nom)} », et les réalisations qui le prouvent.`,
      )}
      ${card(
        'certifications',
        'Certifications',
        certifs
          ? `${certifs} certification${certifs > 1 ? 's' : ''}, langue${certifs > 1 ? 's' : ''} et formations, avec leur justificatif.`
          : 'Certifications, langues, formations et badges numériques : à venir.',
      )}
    </div>
  </section>`;
}

// --- Veille : les sujets, puis ma dernière synthèse de chaque sujet, en
// cartes empilées (« Synthèse suivante » fait passer la carte du dessus) -----

function veille() {
  if (veilles.length === 0) return '';
  const tags = veilles
    .map((v, i) => `<span class="pg-tag pg-tag--${VEILLE_COLORS[i % VEILLE_COLORS.length]}">${escapeHtml(v.nom)}</span>`)
    .join('');
  const lastUpdate = veilles.map((v) => v.miseAJour).filter(Boolean).sort().at(-1);

  const cards = veilles
    .map((v) => ({ v, ...latestSynthese(v) }))
    .filter((s) => s.title)
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    .map(
      (s, i) => `<article class="pg-card pg-stack-card"${i ? ' data-off' : ''}>
        <p class="pg-stack-when">${escapeHtml(s.v.nom)}${s.date ? ` · ${escapeHtml(s.date)}` : ''}</p>
        <h3 class="pg-stack-title">${s.title}</h3>
        ${s.text ? `<p class="pg-stack-text">${s.text}</p>` : ''}
        <p class="pg-stack-link"><a href="${link.veille(s.v.id)}">${goTo(`Veille ${escapeHtml(s.v.nom)} : toutes mes synthèses`)}</a></p>
      </article>`,
    );

  return `<section aria-labelledby="pg-veille">
    ${label('Veille technologique', { id: 'pg-veille' })}
    <div class="pg-vtop">
      <div class="pg-tags" aria-label="Sujets suivis">${tags}</div>
      ${lastUpdate ? `<span class="pg-vtop-update"><span class="pg-live-dot" aria-hidden="true"></span>Collecte automatique, dernière le ${escapeHtml(formatDate(lastUpdate))}</span>` : ''}
    </div>
    ${
      cards.length
        ? `<div class="pg-stack" data-stack>${cards.join('')}</div>
          ${cards.length > 1 ? `<button type="button" class="pg-stack-next" data-action="next-synthese">Synthèse suivante <span aria-hidden="true">↻</span></button>` : ''}`
        : ''
    }
    <a class="pg-link-out" href="${link.section('veille')}">${goTo('Rubrique Veille technologique')}</a>
  </section>`;
}

// Dernière synthèse d'un sujet : le premier titre de syntheses.md
// (« 19/10/2026 - Titre ») et le paragraphe qui le suit
function latestSynthese(v) {
  const template = document.createElement('template');
  template.innerHTML = v.syntheses;
  const heading = template.content.querySelector('h2');
  if (!heading) return {};
  const [, date = '', title = heading.textContent] = /^\s*(\d{2}\/\d{2}\/\d{4})\s*[-–]\s*(.+)$/.exec(heading.textContent) ?? [];
  const paragraph = heading.nextElementSibling?.tagName === 'P' ? heading.nextElementSibling.innerHTML : '';
  // Clé de tri AAAA-MM-JJ, à partir de la date JJ/MM/AAAA du titre
  const sortKey = date.split('/').reverse().join('-');
  return { date, title: escapeHtml(title.trim()), text: paragraph, sortKey };
}

// --- Contact, puis la signature, comme au bas d'une lettre --------------------

function footer() {
  const { email, github, linkedin, disponibilite } = site.contact;
  const { cv } = site.documents;
  const { nom } = site.identite;
  const links = [
    externalLink(linkedin, 'LinkedIn'),
    `<a href="mailto:${escapeHtml(email)}">E-mail</a>`,
    externalLink(github, 'GitHub'),
    cv ? externalLink(cv, 'CV (PDF)') : '',
    `<a href="${link.section('contact')}">Formulaire de contact</a>`,
  ]
    .filter(Boolean)
    .map((a) => `<li>${a}</li>`)
    .join('');
  const domain = site.urlPublique ? new URL(site.urlPublique).host : '';

  return `<footer class="pg-foot">
    <h2 class="pg-foot-title">Restons en contact</h2>
    <p class="pg-foot-text">${disponibilite ? `${safe(disponibilite)}. ` : ''}Une question sur une réalisation ou sur mon parcours ? <a class="pg-foot-cta" href="${link.section('contact')}">Écrivez-moi.</a></p>
    <ul class="pg-foot-links">${links}</ul>
    <p class="pg-signature" role="img" aria-label="Signature de ${escapeHtml(nom)}"></p>
    <p class="pg-copy">© ${__BUILD_DATE__.slice(0, 4)} — ${safe(nom)} · <a href="${link.legal()}">Mentions légales</a></p>
    ${domain ? `<p class="pg-domain">${escapeHtml(domain)}</p>` : ''}
  </footer>`;
}
