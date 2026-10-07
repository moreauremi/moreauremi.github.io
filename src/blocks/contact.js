// Rubrique « CV et contact » : coordonnées, formulaire de contact, et page
// affichée après l'envoi du formulaire.

import { site } from '../content.js';
import { link } from '../router.js';
import { escapeHtml, safe } from '../utils/html.js';
import { FORM_ACTION } from '../utils/contact-form.js';
import { publicBase } from '../utils/url.js';
import { NEW_TAB, shortUrl } from './shared.js';


// `legalHref` : adresse des mentions légales dans la vue qui affiche le bloc
export function contactBlock({ legalHref = link.legal() } = {}) {
  const { email, github, linkedin, localisation, disponibilite } = site.contact;
  const { cv } = site.documents;
  const cvLink = cv
    ? `<a href="${escapeHtml(cv)}" ${NEW_TAB}>Télécharger mon CV (PDF)</a>`
    : '<mark class="ph">[À COMPLÉTER : CV en PDF]</mark>';

  return `<dl class="contact">
    ${disponibilite ? `<dt>Disponibilité</dt><dd>${safe(disponibilite)}</dd>` : ''}
    ${localisation ? `<dt>Localisation</dt><dd>${safe(localisation)}</dd>` : ''}
    <dt>E-mail</dt><dd><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></dd>
    <dt>GitHub</dt><dd><a href="${escapeHtml(github)}" ${NEW_TAB}>${escapeHtml(shortUrl(github))}</a></dd>
    <dt>LinkedIn</dt><dd><a href="${escapeHtml(linkedin)}" ${NEW_TAB}>${escapeHtml(shortUrl(linkedin))}</a></dd>
    <dt>CV</dt><dd>${cvLink}</dd>
  </dl>
  ${contactForm(legalHref)}`;
}

// Formulaire envoyé au service Web3Forms, qui transfère le message par e-mail.
// C'est un formulaire HTML classique : il fonctionne même sans JavaScript.
// Après l'envoi, Web3Forms renvoie le visiteur sur la page « Message envoyé »
// du site. Les champs sont placés dans leur <label> : pas besoin d'identifiant
// (la page RémiOS et la vue jury peuvent contenir le formulaire en même temps).
function contactForm(legalHref) {
  const { cle } = site.formulaire ?? {};
  if (!cle) {
    // Rappel affiché seulement en développement : sans clé, pas de formulaire
    return import.meta.env.DEV
      ? '<p class="form-note"><mark class="ph">[À COMPLÉTER : clé du formulaire de contact, voir « formulaire » dans content/site.config.js]</mark></p>'
      : '';
  }

  const base = publicBase(site.urlPublique);
  const redirect = base ? `<input type="hidden" name="redirect" value="${escapeHtml(base + link.section('message-envoye'))}">` : '';

  return `<form class="contact-form" action="${FORM_ACTION}" method="post" accept-charset="utf-8">
    <h2 class="block-title">Écrire un message</h2>
    <input type="hidden" name="access_key" value="${escapeHtml(cle)}">
    <input type="hidden" name="subject" value="Nouveau message depuis le portfolio">
    <input type="hidden" name="from_name" value="Portfolio de ${escapeHtml(site.identite.nom)}">
    ${redirect}
    <input type="checkbox" name="botcheck" hidden tabindex="-1" autocomplete="off">
    <label class="field"><span>Nom</span>
      <input type="text" name="name" autocomplete="name" required maxlength="100">
    </label>
    <label class="field"><span>E-mail</span>
      <input type="email" name="email" autocomplete="email" required maxlength="200">
    </label>
    <label class="field"><span>Message</span>
      <textarea name="message" rows="6" required maxlength="5000"></textarea>
    </label>
    <p class="field-check">
      <label><input type="checkbox" required> J'accepte que ces informations servent uniquement à me répondre.</label>
      <a href="${legalHref}">Données personnelles : voir les mentions légales</a>
    </p>
    <button type="submit" class="form-submit">Envoyer</button>
  </form>`;
}

// Page affichée après l'envoi du formulaire
export function messageSentBlock() {
  return `<div class="prose">
    <p>Merci, votre message a bien été envoyé. Je vous répondrai dès que possible, à l'adresse indiquée.</p>
  </div>`;
}
