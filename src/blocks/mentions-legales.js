// Page « Mentions légales » (#/mentions-legales), hors menu.

import { site } from '../content.js';
import { escapeHtml, safe } from '../utils/html.js';
import { tr } from '../utils/lang.js';
import { NEW_TAB, shortUrl, typography } from './shared.js';


export function mentionsLegalesBlock() {
  const { nom } = site.identite;
  const { email } = site.contact;
  const { hebergeur, codeSource } = site.mentionsLegales;
  const mail = `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`;
  const link = (href, label) => `<a href="${escapeHtml(href)}" ${NEW_TAB}>${label}</a>`;
  const audience = Boolean(site.audience?.goatcounter);

  // typography : espaces insécables avant « : » et « ; », comme dans les
  // textes Markdown (en français seulement)
  return typography(`<div class="prose">
    <h2>${tr('Éditeur du site', 'Publisher')}</h2>
    <p>${tr(
      `Ce site est le portfolio personnel de ${safe(nom)}, étudiant en BTS SIO, publié à titre non professionnel.`,
      `This website is the personal portfolio of ${safe(nom)}, a BTS SIO student, published on a non-professional basis.`,
    )}</p>
    <ul>
      <li>${tr('Responsable de la publication :', 'Publication manager:')} ${safe(nom)}</li>
      <li>${tr('Contact :', 'Contact:')} ${mail}</li>
    </ul>

    <h2>${tr('Hébergement', 'Hosting')}</h2>
    <p>${safe(hebergeur.nom)}<br>${safe(hebergeur.adresse)}<br>${link(hebergeur.site, escapeHtml(shortUrl(hebergeur.site)))}</p>

    <h2>${tr('Propriété intellectuelle', 'Intellectual property')}</h2>
    <p>${tr(
      `Les textes, photos, captures d'écran et documents (CV, tableau de synthèse) de ce site appartiennent à ${safe(nom)} : leur reproduction nécessite son accord.`,
      `The texts, photos, screenshots and documents (CV, summary table) on this website belong to ${safe(nom)}: they may not be reproduced without permission.`,
    )}</p>
    <p>${tr(
      `Le code source du site est publié sous licence MIT, qui en autorise la réutilisation : ${link(codeSource, 'code source')}, ${link(`${codeSource}/blob/main/LICENSE`, 'texte de la licence')}.`,
      `The source code of the website is published under the MIT licence, which allows it to be reused: ${link(codeSource, 'source code')}, ${link(`${codeSource}/blob/main/LICENSE`, 'licence text')}.`,
    )}</p>

    <h2>${tr('Crédits', 'Credits')}</h2>
    <ul>
      <li>${tr(
        'Police IBM Plex Mono : © IBM Corp., licence SIL Open Font License 1.1, hébergée par le site lui-même.',
        'IBM Plex Mono font: © IBM Corp., SIL Open Font License 1.1, hosted by the website itself.',
      )}</li>
      <li>${tr("Logo, icônes et image d'aperçu : créations originales.", 'Logo, icons and preview image: original creations.')}</li>
      <li>${tr(
        'Générique caché du terminal : parodie originale (texte et musique), qui ne reprend aucune œuvre protégée.',
        "The terminal's hidden opening crawl: an original parody (text and music) that does not reproduce any protected work.",
      )}</li>
      <li>${tr(
        'Outils de fabrication du site, non envoyés aux visiteurs : Vite, marked et gray-matter, sous licence MIT.',
        'Tools used to build the website, never sent to visitors: Vite, marked and gray-matter, under the MIT licence.',
      )}</li>
    </ul>

    <h2>${tr('Données personnelles et cookies', 'Personal data and cookies')}</h2>
    <p>${tr(
      `Ce site ne dépose aucun cookie${audience ? '' : ", n'utilise aucun outil de mesure d'audience"} et ne charge aucune ressource extérieure (police, script, image).`,
      `This website sets no cookies${audience ? '' : ', uses no audience measurement tool'} and loads no external resources (fonts, scripts, images).`,
    )}</p>
    <p>${tr(
      "Les réglages du son (activé ou coupé) et du thème (clair ou sombre) sont mémorisés dans le navigateur du visiteur, sur son appareil : ils ne sont jamais transmis.",
      'The sound setting (on or off) and the theme setting (light or dark) are stored in the visitor’s browser, on their device: they are never transmitted.',
    )}</p>
    <p>${tr(
      `Comme tout hébergeur, ${safe(hebergeur.nom)} enregistre l'adresse IP des visiteurs pour la sécurité de son service : voir sa ${link(hebergeur.confidentialite, 'déclaration de confidentialité')}.`,
      `Like any host, ${safe(hebergeur.nom)} records visitors’ IP addresses for the security of its service: see its ${link(hebergeur.confidentialite, 'privacy statement')}.`,
    )}</p>
    ${audience ? audiencePrivacy(link) : ''}
    ${site.formulaire?.cle ? formPrivacy(mail, link) : ''}
  </div>`);
}

// Mesure d'audience (voir src/utils/audience.js)
function audiencePrivacy(link) {
  return `<h2>${tr("Mesure d'audience", 'Audience measurement')}</h2>
    <p>${tr(
      `Pour connaître la fréquentation du site, chaque page consultée est comptée avec GoatCounter, un outil de statistiques open source qui ne dépose aucun cookie et ne conserve ni l'adresse IP ni d'identifiant des visiteurs. Seuls des totaux sont enregistrés : page consultée, date, site d'origine, navigateur, système, taille d'écran et pays. Voir sa ${link('https://www.goatcounter.com/help/privacy', 'politique de confidentialité')}.`,
      `To know how often the website is visited, each page viewed is counted with GoatCounter, an open-source analytics tool that sets no cookies and keeps neither the IP address nor any identifier of visitors. Only totals are recorded: page viewed, date, referring site, browser, operating system, screen size and country. See its ${link('https://www.goatcounter.com/help/privacy', 'privacy policy')}.`,
    )}</p>
    <p>${tr(
      'Les navigateurs réglés pour demander à ne pas être suivis (« Do Not Track » ou « Global Privacy Control ») ne sont pas comptés.',
      'Browsers set to ask not to be tracked (“Do Not Track” or “Global Privacy Control”) are not counted.',
    )}</p>`;
}

// Informations obligatoires (RGPD) dès qu'un formulaire collecte des données
function formPrivacy(mail, link) {
  return `<h2>${tr('Formulaire de contact', 'Contact form')}</h2>
    <p>${tr(
      `Les informations saisies dans le formulaire (nom, adresse e-mail, message) servent uniquement à vous répondre, et ne sont jamais cédées à des tiers. Elles sont transmises au service Web3Forms, qui les transfère par e-mail sans conserver les messages (traitement aux États-Unis, journaux techniques effacés tous les deux mois) : voir sa ${link('https://docs.web3forms.com/getting-started/faq', 'foire aux questions')}. Les messages reçus sont conservés le temps nécessaire à l'échange.`,
      `The information entered in the form (name, e-mail address, message) is only used to reply to you, and is never passed on to third parties. It is sent to the Web3Forms service, which forwards it by e-mail without keeping the messages (processing in the United States, technical logs deleted every two months): see its ${link('https://docs.web3forms.com/getting-started/faq', 'FAQ')}. Messages received are kept for as long as the conversation requires.`,
    )}</p>
    <p>${tr(
      `Conformément au RGPD, vous pouvez demander l'accès à ces données, leur rectification ou leur effacement en écrivant à ${mail}. Vous pouvez aussi adresser une réclamation à la ${link('https://www.cnil.fr', 'CNIL')}.`,
      `Under the GDPR, you can ask to access, correct or delete this data by writing to ${mail}. You can also lodge a complaint with the ${link('https://www.cnil.fr/en', 'CNIL')}, the French data protection authority.`,
    )}</p>`;
}
