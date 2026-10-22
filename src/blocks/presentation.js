// Rubrique « Présentation » : photo, liens vers les profils et le CV, puis le
// texte de content/pages/presentation.md.

import { site, pages } from '../content.js';
import { escapeHtml, placeholder } from '../utils/html.js';
import { NEW_TAB } from './shared.js';


// Photo, liens vers les profils et le CV, puis le texte de présentation.
// Dans RémiOS, la photo et les liens forment une colonne à gauche du texte
// (blocks.css) : la rubrique tient sur un écran, sans défiler.
export function presentationBlock() {
  return `<div class="presentation">
    <div class="profile">
      ${portrait()}
      <ul class="profile-links">${profileLinks()}</ul>
    </div>
    <div class="prose">${pages.presentation.html}</div>
  </div>`;
}

function portrait() {
  const { photo, nom } = site.identite;
  if (photo) {
    return `<img class="portrait" src="${escapeHtml(photo)}" alt="Portrait de ${escapeHtml(nom)}" width="128" height="128" decoding="async">`;
  }
  const missing = placeholder('[À COMPLÉTER : photo professionnelle]');
  return missing ? `<p class="portrait portrait--empty">${missing}</p>` : '';
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
