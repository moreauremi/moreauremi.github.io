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

import { site, pages, realisations, realisationsOfType, getRealisation, competenceLabel, TYPES } from './content.js';
import { link } from './router.js';
import { escapeHtml, safe, frenchSpacing } from './utils/html.js';
import { formatDate } from './utils/dates.js';
import { FORM_ACTION } from './utils/contact-form.js';

// Attributs d'un lien qui s'ouvre dans un nouvel onglet
const NEW_TAB = 'target="_blank" rel="noopener noreferrer"';

// --- Présentation --------------------------------------------------------------

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

// --- Alternance et parcours ------------------------------------------------------

// Texte de la page « alternance » ; dans RémiOS, suivi de la liste des
// réalisations en entreprise (la vue jury les montre déjà plus bas).
export function alternanceBlock(hrefFor) {
  const fiches = hrefFor
    ? `<section class="fiche-group" aria-labelledby="alternance-fiches">
        <h2 class="block-title" id="alternance-fiches">Réalisations en entreprise</h2>
        ${realisationList('entreprise', hrefFor)}
      </section>`
    : '';
  return `<div class="prose">${pages.alternance.html}</div>${fiches}`;
}

// --- Réalisations ----------------------------------------------------------------

// Les trois groupes de réalisations : entreprise, formation, projets personnels
export function realisationsBlock(hrefFor) {
  const groups = Object.entries(TYPES)
    .map(
      ([type, { group, intro }]) => `<section class="fiche-group" aria-labelledby="groupe-${type}">
      <h2 class="block-title" id="groupe-${type}">${group}</h2>
      <p class="intro">${intro}</p>
      ${realisationList(type, hrefFor)}
    </section>`,
    )
    .join('');
  return `<p class="intro">Chaque réalisation ouvre sa fiche détaillée : contexte, objectifs, mise en œuvre, résultats.</p>${groups}`;
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
        <span class="fiche-link-title">${safe(r.titre)}${draftBadge(r)}</span>
        ${r.resume ? `<span class="fiche-link-summary">${safe(r.resume)}</span>` : ''}
      </a>
    </li>`,
    )
    .join('')}
  </ul>`;
}

// Repère « brouillon » : n'apparaît qu'en développement, puisque les fiches
// en brouillon sont retirées du site publié.
function draftBadge(r) {
  return r.brouillon ? ' <span class="draft-badge">brouillon, non publié</span>' : '';
}

// Caractéristiques d'une fiche : type, date, statut, technologies
export function ficheMeta(r) {
  const technos = r.technos.length
    ? `<ul class="tags">${r.technos.map((t) => `<li>${safe(t)}</li>`).join('')}</ul>`
    : '<mark class="ph">[À COMPLÉTER]</mark>';

  return `<dl class="fiche-meta">
    <dt>Type</dt><dd>${TYPES[r.type].label}${draftBadge(r)}</dd>
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

// --- Compétences techniques -----------------------------------------------------

// Savoir-faire par domaine : niveau de maîtrise et fiches qui le prouvent
export function competencesBlock(hrefFor) {
  const { niveaux, domaines } = site.savoirFaire;

  const scale = niveaux
    .map((n, i) => `<dt>${levelBar(i + 1)} ${safe(n.nom)}</dt><dd>${safe(n.description)}</dd>`)
    .join('');

  // Sur petit écran, chaque ligne du tableau devient une petite fiche (voir
  // blocks.css) : les rôles ARIA explicites gardent la structure de tableau
  // pour les lecteurs d'écran, que le changement d'affichage ferait perdre.
  const tables = domaines
    .map(
      (domaine, i) => `<h2 class="block-title" id="savoir-faire-${i}">${safe(domaine.nom)}</h2>
    <div class="table-scroll" tabindex="0" role="region" aria-labelledby="savoir-faire-${i}">
      <table class="skills" role="table">
        <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Compétence</th><th scope="col" role="columnheader">Niveau</th><th scope="col" role="columnheader">Mise en pratique</th></tr></thead>
        <tbody role="rowgroup">${domaine.items
          .map(
            (item) => `<tr role="row">
            <th scope="row" role="rowheader">${safe(item.nom)}</th>
            <td class="skills-level" role="cell" data-label="Niveau">${level(item.niveau)}</td>
            <td role="cell" data-label="Mise en pratique">${proofs(item.preuves ?? [], hrefFor)}</td>
          </tr>`,
          )
          .join('')}</tbody>
      </table>
    </div>`,
    )
    .join('');

  return `<div class="prose">
    <p>Mon savoir-faire technique, domaine par domaine. Chaque compétence renvoie aux réalisations où je l'ai mise en pratique. Les compétences du référentiel BTS SIO sont détaillées dans le tableau de synthèse.</p>
  </div>
  <dl class="legend levels" aria-label="Échelle des niveaux">${scale}</dl>
  ${tables}`;
}

// Barre de niveau en caractères, façon terminal : [####----] pour 2 sur 4.
// Purement visuelle : le nom du niveau est écrit à côté.
function levelBar(value) {
  const max = site.savoirFaire.niveaux.length;
  return `<span class="level-bar" aria-hidden="true">[${'##'.repeat(value)}${'--'.repeat(max - value)}]</span>`;
}

function level(value) {
  if (value === null) return '<mark class="ph">[À COMPLÉTER]</mark>';
  const { niveaux } = site.savoirFaire;
  return `${levelBar(value)} ${safe(niveaux[value - 1].nom)}<span class="visually-hidden"> (niveau ${value} sur ${niveaux.length})</span>`;
}

// Liens vers les fiches qui prouvent une compétence. Une fiche absente du
// site (brouillon) est simplement ignorée.
function proofs(slugs, hrefFor) {
  const fiches = slugs.map(getRealisation).filter(Boolean);
  if (fiches.length === 0) {
    return '<span aria-hidden="true">—</span><span class="visually-hidden">aucune fiche pour l\'instant</span>';
  }
  return fiches.map((r) => `<a href="${hrefFor(r.slug)}">${safe(r.titre)}</a>`).join(', ');
}

// --- Tableau de synthèse ---------------------------------------------------------

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

// --- Veille ------------------------------------------------------------------------

export function veilleBlock() {
  const sujet = site.veille.sujet ? safe(site.veille.sujet) : 'À venir';
  return `<div class="prose">
    <p><strong>Sujet :</strong> ${sujet}</p>
    ${pages.veille.html}
  </div>`;
}

// --- Certifications ------------------------------------------------------------------

const CERTIFICATION_GROUPS = [
  ['certification', 'Certifications'],
  ['langue', 'Langues'],
  ['formation', 'Formations complémentaires'],
  ['badge', 'Badges numériques'],
];

export function certificationsBlock() {
  const all = site.certifications ?? [];
  const intro = '<p>Certifications, résultats en langues, formations complémentaires et badges numériques, avec leur justificatif.</p>';
  if (all.length === 0) return `<div class="prose">${intro}<p>À venir.</p></div>`;

  const groups = CERTIFICATION_GROUPS.map(([categorie, label]) => {
    // Les plus récentes d'abord (dates AAAA-MM-JJ : l'ordre alphabétique suffit)
    const items = all
      .filter((c) => c.categorie === categorie)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (items.length === 0) return '';
    return `<h2 class="block-title">${label}</h2>
      <ul class="certifs">${items.map(certification).join('')}</ul>`;
  }).join('');

  return `<div class="prose">${intro}</div>${groups}`;
}

function certification(c) {
  const details = [
    safe(c.organisme),
    safe(formatDate(String(c.date))),
    c.statut === 'en cours' ? 'en cours' : '',
    c.detail ? safe(c.detail) : '',
  ].filter(Boolean);
  const links = [
    c.justificatif ? `<a href="${escapeHtml(c.justificatif)}" ${NEW_TAB}>Justificatif</a>` : '',
    c.lien ? `<a href="${escapeHtml(c.lien)}" ${NEW_TAB}>Vérifier en ligne</a>` : '',
  ].filter(Boolean);

  return `<li>
    <span class="certif-title">${safe(c.titre)}</span>
    <span class="certif-meta">${details.join(' · ')}</span>
    ${links.length ? `<span class="certif-links">${links.join(' · ')}</span>` : ''}
  </li>`;
}

// --- Contact -----------------------------------------------------------------------

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

  const base = site.urlPublique ? site.urlPublique.replace(/\/?$/, '/') : '';
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

// --- Mentions légales -------------------------------------------------------------

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

// « https://www.github.com/moreauremi » → « github.com/moreauremi »
function shortUrl(url) {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}
