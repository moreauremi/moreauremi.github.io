// =============================================================================
// Blocs de contenu partagés
// -----------------------------------------------------------------------------
// L'interface RémiOS et la vue jury affichent le même contenu avec deux
// habillages différents. Ces fonctions produisent le HTML commun ; seul le CSS
// du conteneur change. Une information n'est donc écrite qu'à un seul endroit.
//
// `hrefFor(slug)` indique où mène le lien d'une fiche : #/realisations/<slug>
// dans RémiOS, #/jury/<slug> dans la vue jury.
// =============================================================================

import { site, pages, realisations, realisationsOfType, competenceLabel, TYPES } from './content.js';
import { escapeHtml, safe } from './utils/html.js';
import { formatDate } from './utils/dates.js';

// Attributs d'un lien qui s'ouvre dans un nouvel onglet
const NEW_TAB = 'target="_blank" rel="noopener noreferrer"';

export function presentationBlock() {
  return `<div class="prose">${pages.presentation.html}</div>`;
}

// Liste des réalisations d'un type (entreprise, formation, perso)
export function realisationList(type, hrefFor) {
  const items = realisationsOfType(type);
  if (items.length === 0) return '<p class="empty">À venir.</p>';

  return `<ul class="fiche-list" data-nav-list>${items
    .map(
      (r) => `
    <li>
      <a class="fiche-link" href="${hrefFor(r.slug)}">
        <span class="fiche-link-title">${safe(r.titre)}</span>
        ${r.resume ? `<span class="fiche-link-summary">${safe(r.resume)}</span>` : ''}
      </a>
    </li>`,
    )
    .join('')}
  </ul>`;
}

// Caractéristiques d'une fiche : type, date, statut, technologies
export function ficheMeta(r) {
  const technos = r.technos.length
    ? `<ul class="tags">${r.technos.map((t) => `<li>${safe(t)}</li>`).join('')}</ul>`
    : '<mark class="ph">[À COMPLÉTER]</mark>';

  return `<dl class="fiche-meta">
    <dt>Type</dt><dd>${TYPES[r.type].label}</dd>
    <dt>Date</dt><dd>${safe(formatDate(r.date))}</dd>
    <dt>Statut</dt><dd>${safe(r.statut)}</dd>
    <dt>Technos</dt><dd>${technos}</dd>
  </dl>`;
}

// Compétences du référentiel mobilisées par une fiche
export function ficheCompetences(r) {
  const list = r.competences.length
    ? `<ul>${r.competences.map((code) => `<li><strong>${escapeHtml(code)}</strong> — ${safe(competenceLabel(code))}</li>`).join('')}</ul>`
    : '<p><mark class="ph">[À COMPLÉTER : compétences mobilisées]</mark></p>';

  return `<section class="fiche-competences" aria-labelledby="competences-${r.slug}">
    <h2 id="competences-${r.slug}">Compétences du référentiel mobilisées</h2>
    ${list}
  </section>`;
}

// Fiche complète : caractéristiques, texte de la fiche, compétences
export function ficheBlock(r) {
  return `<article class="fiche">
    ${ficheMeta(r)}
    <div class="prose">${r.html}</div>
    <div class="prose">${ficheCompetences(r)}</div>
  </article>`;
}

// Tableau de synthèse : lien vers le PDF officiel + tableau croisé généré
// automatiquement à partir du champ « competences » de chaque fiche.
export function syntheseBlock(hrefFor) {
  const { synthese } = site.documents;
  const pdf = synthese
    ? `<a href="${escapeHtml(synthese)}" ${NEW_TAB}>Ouvrir le tableau de synthèse (PDF)</a>`
    : '<mark class="ph">[À COMPLÉTER : tableau de synthèse en PDF]</mark>';

  const codes = site.competences;
  const header = codes
    .map((c) => `<th scope="col"><abbr title="${escapeHtml(c.libelle)}">${escapeHtml(c.code)}</abbr></th>`)
    .join('');
  const rows = realisations
    .map(
      (r) => `<tr>
        <th scope="row"><a href="${hrefFor(r.slug)}">${safe(r.titre)}</a></th>
        ${codes
          .map((c) =>
            r.competences.includes(c.code)
              ? '<td><span aria-hidden="true">[X]</span><span class="visually-hidden">oui</span></td>'
              : '<td><span aria-hidden="true">[ ]</span><span class="visually-hidden">non</span></td>',
          )
          .join('')}
      </tr>`,
    )
    .join('');

  return `<div class="prose">
    <p>Document officiel : ${pdf}</p>
    <p>Tableau croisé généré à partir des fiches : chaque ligne est une réalisation, chaque colonne une compétence du référentiel.</p>
  </div>
  <div class="table-scroll" tabindex="0" role="region" aria-label="Tableau croisé des réalisations et des compétences">
    <table class="matrix">
      <thead><tr><th scope="col">Réalisation</th>${header}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <dl class="legend">${codes.map((c) => `<dt>${escapeHtml(c.code)}</dt><dd>${safe(c.libelle)}</dd>`).join('')}</dl>`;
}

export function veilleBlock() {
  const sujet = site.veille.sujet ? safe(site.veille.sujet) : 'À venir';
  return `<div class="prose">
    <p><strong>Sujet :</strong> ${sujet}</p>
    ${pages.veille.html}
  </div>`;
}

export function contactBlock() {
  const { email, github, linkedin } = site.contact;
  const { cv } = site.documents;
  const cvLink = cv
    ? `<a href="${escapeHtml(cv)}" ${NEW_TAB}>Télécharger mon CV (PDF)</a>`
    : '<mark class="ph">[À COMPLÉTER : CV en PDF]</mark>';

  return `<dl class="contact">
    <dt>E-mail</dt><dd><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></dd>
    <dt>GitHub</dt><dd><a href="${escapeHtml(github)}" ${NEW_TAB}>${escapeHtml(shortUrl(github))}</a></dd>
    <dt>LinkedIn</dt><dd><a href="${escapeHtml(linkedin)}" ${NEW_TAB}>${escapeHtml(shortUrl(linkedin))}</a></dd>
    <dt>CV</dt><dd>${cvLink}</dd>
  </dl>`;
}

// « https://www.github.com/moreauremi » → « github.com/moreauremi »
function shortUrl(url) {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}
