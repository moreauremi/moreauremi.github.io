// Rubrique « Présentation » : photo, liens vers les profils et le CV, puis le
// texte de content/pages/presentation.md.

import { site, pages } from '../content.js';
import { escapeHtml } from '../utils/html.js';
import { NEW_TAB } from './shared.js';


// Photo, liens vers les profils et le CV, puis le texte de présentation
export function presentationBlock() {
  return `<div class="profile">
    ${portrait()}
    <ul class="profile-links">${profileLinks()}</ul>
  </div>
  <div class="prose">${pages.presentation.html}</div>`;
}

function portrait() {
  const { photo, nom } = site.identite;
  return photo
    ? `<img class="portrait" src="${escapeHtml(photo)}" alt="Portrait de ${escapeHtml(nom)}" width="128" height="128" decoding="async">`
    : '<p class="portrait portrait--empty"><mark class="ph">[À COMPLÉTER : photo professionnelle]</mark></p>';
}

function profileLinks() {
  const { github, linkedin } = site.contact;
  const { cv } = site.documents;
  return [
    `<li><a href="${escapeHtml(github)}" ${NEW_TAB}>GitHub</a></li>`,
    `<li><a href="${escapeHtml(linkedin)}" ${NEW_TAB}>LinkedIn</a></li>`,
    cv ? `<li><a href="${escapeHtml(cv)}" ${NEW_TAB}>CV (PDF)</a></li>` : '',
  ].join('');
}
