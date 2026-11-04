// Rubrique « CV et contact » : coordonnées, formulaire de contact, et page
// affichée après l'envoi du formulaire.

import { site } from '../content.js';
import { link } from '../router.js';
import { escapeHtml, placeholder, safe } from '../utils/html.js';
import { FORM_ACTION } from '../utils/contact-form.js';
import { publicBase } from '../utils/url.js';
import { tr } from '../utils/lang.js';
import { NEW_TAB, shortUrl } from './shared.js';


// `legalHref` : adresse des mentions légales dans la vue qui affiche le bloc
export function contactBlock({ legalHref = link.legal() } = {}) {
  const { email, github, linkedin, localisation, disponibilite } = site.contact;
  const { cv } = site.documents;
  const cvLink = cv
    ? `<a href="${escapeHtml(cv)}" ${NEW_TAB}>${tr('Télécharger mon CV (PDF)', 'Download my CV (PDF, in French)')}</a>`
    : placeholder('[À COMPLÉTER : CV en PDF]');

  return `<dl class="contact">
    ${disponibilite ? `<dt>${tr('Disponibilité', 'Availability')}</dt><dd>${safe(disponibilite)}</dd>` : ''}
    ${localisation ? `<dt>${tr('Localisation', 'Location')}</dt><dd>${safe(localisation)}</dd>` : ''}
    <dt>E-mail</dt><dd><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></dd>
    <dt>GitHub</dt><dd><a href="${escapeHtml(github)}" ${NEW_TAB}>${escapeHtml(shortUrl(github))}</a></dd>
    <dt>LinkedIn</dt><dd><a href="${escapeHtml(linkedin)}" ${NEW_TAB}>${escapeHtml(shortUrl(linkedin))}</a></dd>
    ${cvLink ? `<dt>CV</dt><dd>${cvLink}</dd>` : ''}
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
    const note = placeholder('[À COMPLÉTER : clé du formulaire de contact, voir « formulaire » dans content/site.config.js]');
    return note ? `<p class="form-note">${note}</p>` : '';
  }

  const base = publicBase(site.urlPublique);
  const redirect = base ? `<input type="hidden" name="redirect" value="${escapeHtml(base + link.section('message-envoye'))}">` : '';

  return `<form class="contact-form" action="${FORM_ACTION}" method="post" accept-charset="utf-8">
    <h2 class="block-title">${tr('Écrire un message', 'Send a message')}</h2>
    <input type="hidden" name="access_key" value="${escapeHtml(cle)}">
    <input type="hidden" name="subject" value="${tr('Nouveau message depuis le portfolio', 'Nouveau message depuis le portfolio (version anglaise)')}">
    <input type="hidden" name="from_name" value="Portfolio de ${escapeHtml(site.identite.nom)}">
    ${redirect}
    <input type="checkbox" name="botcheck" hidden tabindex="-1" autocomplete="off">
    <label class="field"><span>${tr('Nom', 'Name')}</span>
      <input type="text" name="name" autocomplete="name" required maxlength="100">
    </label>
    <label class="field"><span>E-mail</span>
      <input type="email" name="email" autocomplete="email" required maxlength="200">
    </label>
    <label class="field"><span>Message</span>
      <textarea name="message" rows="6" required maxlength="5000"></textarea>
    </label>
    <p class="field-check">
      <label><input type="checkbox" required> ${tr("J'accepte que ces informations servent uniquement à me répondre.", 'I agree that this information will only be used to reply to me.')}</label>
      <a href="${legalHref}">${tr('Données personnelles : voir les mentions légales', 'Personal data: see the legal notice')}</a>
    </p>
    <button type="submit" class="form-submit">${tr('Envoyer', 'Send')}</button>
  </form>`;
}

// Page affichée après l'envoi du formulaire
export function messageSentBlock() {
  return `<div class="prose">
    <p>${tr("Merci, votre message a bien été envoyé. Je vous répondrai dès que possible, à l'adresse indiquée.", 'Thank you, your message has been sent. I will reply as soon as possible, to the address you gave.')}</p>
  </div>`;
}
