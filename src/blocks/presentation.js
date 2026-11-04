// Rubrique « Présentation », mise en page comme une lettre de présentation :
//  - en-tête : photo, nom, formation et liens à gauche ; destinataire, lieu
//    et date à droite ;
//  - objet, puis le texte de content/pages/presentation.md ;
//  - pied : formule de fin et signature manuscrite.
// L'en-tête, l'objet et la formule viennent du frontmatter de
// presentation.md (champ « lettre »), le corps de la lettre de son texte.

import { site, pages } from '../content.js';
import { escapeHtml, frenchSpacing, placeholder, safe } from '../utils/html.js';
import { NEW_TAB } from './shared.js';
// Signature manuscrite vectorisée, intégrée à la page (aucun fichier à
// charger) : elle prend la couleur du texte (currentColor), donc s'adapte à
// la boîte grise de RémiOS, à la vue jury et à l'impression.
import SIGNATURE from '../assets/signature.svg?raw';


export function presentationBlock() {
  const { html, lettre = {} } = pages.presentation;
  const { signataire = [], destinataire, date, objet, formule } = lettre;
  // Lieu de la lettre : la ville de la configuration (« Nantes, novembre 2026 »)
  const lieuDate = [site.contact.localisation, date].filter(Boolean).join(', ');

  return `<div class="presentation lettre">
    <header class="lettre-entete">
      <div class="profile">
        ${portrait()}
        <div class="profile-id">
          <p class="profile-name">${escapeHtml(site.identite.nom)}</p>
          ${signataire.map((ligne) => `<p>${safe(ligne)}</p>`).join('')}
          <ul class="profile-links">${profileLinks()}</ul>
        </div>
      </div>
      <div class="lettre-destinataire">
        ${destinataire ? `<p>${frenchSpacing(safe(destinataire))}</p>` : ''}
        ${lieuDate ? `<p>${safe(lieuDate)}</p>` : ''}
      </div>
    </header>
    ${objet ? `<p class="lettre-objet">${frenchSpacing(`<strong>Objet :</strong> ${safe(objet)}`)}</p>` : ''}
    <div class="prose">${html}</div>
    <footer class="lettre-pied">
      ${formule ? `<p>${frenchSpacing(safe(formule))}</p>` : ''}
      <div class="presentation-signature">${SIGNATURE}</div>
    </footer>
  </div>`;
}

function portrait() {
  const { photo, nom } = site.identite;
  if (photo) {
    return `<img class="portrait" src="${escapeHtml(photo)}" alt="Portrait de ${escapeHtml(nom)}" width="96" height="96" decoding="async">`;
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
