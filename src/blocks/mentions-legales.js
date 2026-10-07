// Page « Mentions légales » (#/mentions-legales), hors menu.

import { site } from '../content.js';
import { escapeHtml, safe, frenchSpacing } from '../utils/html.js';
import { NEW_TAB, shortUrl } from './shared.js';


export function mentionsLegalesBlock() {
  const { nom } = site.identite;
  const { email } = site.contact;
  const { hebergeur, codeSource } = site.mentionsLegales;
  const mail = `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`;

  // frenchSpacing : espaces insécables avant « : » et « ; », comme dans les
  // textes Markdown
  return frenchSpacing(`<div class="prose">
    <h2>Éditeur du site</h2>
    <p>Ce site est le portfolio personnel de ${safe(nom)}, étudiant en BTS SIO, publié à titre non professionnel.</p>
    <ul>
      <li>Responsable de la publication : ${safe(nom)}</li>
      <li>Contact : ${mail}</li>
    </ul>

    <h2>Hébergement</h2>
    <p>${safe(hebergeur.nom)}<br>${safe(hebergeur.adresse)}<br><a href="${escapeHtml(hebergeur.site)}" ${NEW_TAB}>${escapeHtml(shortUrl(hebergeur.site))}</a></p>

    <h2>Propriété intellectuelle</h2>
    <p>Les textes, photos, captures d'écran et documents (CV, tableau de synthèse) de ce site appartiennent à ${safe(nom)} : leur reproduction nécessite son accord.</p>
    <p>Le code source du site est publié sous licence MIT, qui en autorise la réutilisation : <a href="${escapeHtml(codeSource)}" ${NEW_TAB}>code source</a>, <a href="${escapeHtml(codeSource)}/blob/main/LICENSE" ${NEW_TAB}>texte de la licence</a>.</p>

    <h2>Crédits</h2>
    <ul>
      <li>Police IBM Plex Mono : © IBM Corp., licence SIL Open Font License 1.1, hébergée par le site lui-même.</li>
      <li>Logo, icônes et image d'aperçu : créations originales.</li>
      <li>Générique caché du terminal : parodie originale (texte et musique), qui ne reprend aucune œuvre protégée.</li>
      <li>Outils de fabrication du site, non envoyés aux visiteurs : Vite, marked et gray-matter, sous licence MIT.</li>
    </ul>

    <h2>Données personnelles et cookies</h2>
    <p>Ce site ne dépose aucun cookie, n'utilise aucun outil de mesure d'audience et ne charge aucune ressource extérieure (police, script, image).</p>
    <p>Le réglage du son (activé ou coupé) est mémorisé dans le navigateur du visiteur, sur son appareil : il n'est jamais transmis.</p>
    <p>Comme tout hébergeur, ${safe(hebergeur.nom)} enregistre l'adresse IP des visiteurs pour la sécurité de son service : voir sa <a href="${escapeHtml(hebergeur.confidentialite)}" ${NEW_TAB}>déclaration de confidentialité</a>.</p>
    ${site.formulaire?.cle ? formPrivacy(mail) : ''}
  </div>`);
}

// Informations obligatoires (RGPD) dès qu'un formulaire collecte des données
function formPrivacy(mail) {
  return `<h2>Formulaire de contact</h2>
    <p>Les informations saisies dans le formulaire (nom, adresse e-mail, message) servent uniquement à vous répondre, et ne sont jamais cédées à des tiers. Elles sont transmises au service Web3Forms, qui les transfère par e-mail sans conserver les messages (traitement aux États-Unis, journaux techniques effacés tous les deux mois) : voir sa <a href="https://docs.web3forms.com/getting-started/faq" ${NEW_TAB}>foire aux questions</a>. Les messages reçus sont conservés le temps nécessaire à l'échange.</p>
    <p>Conformément au RGPD, vous pouvez demander l'accès à ces données, leur rectification ou leur effacement en écrivant à ${mail}. Vous pouvez aussi adresser une réclamation à la <a href="https://www.cnil.fr" ${NEW_TAB}>CNIL</a>.</p>`;
}
