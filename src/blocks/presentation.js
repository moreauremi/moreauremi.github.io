// Rubrique « Présentation » : photo, liens vers les profils et le CV, puis le
// texte de content/pages/presentation.md, et la signature en pied de page.

import { site, pages } from '../content.js';
import { escapeHtml, placeholder } from '../utils/html.js';
import { NEW_TAB } from './shared.js';
// Signature manuscrite vectorisée, intégrée à la page (aucun fichier à
// charger) : elle prend la couleur du texte (currentColor), donc s'adapte à
// la boîte grise de RémiOS, à la vue jury et à l'impression.
import SIGNATURE from '../assets/signature.svg?raw';


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
    <footer class="presentation-signature">${SIGNATURE}</footer>
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
