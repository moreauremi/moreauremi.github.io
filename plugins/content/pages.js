// =============================================================================
// Gabarits des pages du site
// -----------------------------------------------------------------------------
// Chaque page est une vraie page HTML, fabriquée au build (et à la demande
// avec `npm run dev`) à partir du contenu lu par site.js :
//
//   index.html                     accueil : sphère ASCII + carte
//   projets/index.html             en formation · en entreprise · perso
//   projets/<slug>/index.html      fiche détaillée
//   formations/index.html          formations 1Life et badges
//   veille/index.html              méthode, puis un bloc par sujet
//   contact/index.html             e-mail, liens, formulaire
//   contact/merci/index.html       après l'envoi du formulaire
//   mentions-legales/index.html
//
// Tous les liens internes sont écrits depuis la racine du site (« ./projets/ ») ;
// vite-plugin-content.js les corrige ensuite selon la profondeur de la page
// (« ../projets/ »). Le site fonctionne ainsi à la racine d'un domaine comme
// dans un sous-dossier (version Docker derrière un reverse proxy).
// =============================================================================

import { escapeHtml, markPlaceholders, withoutPlaceholders, frenchSpacing } from '../../src/utils/html.js';
import { formatDate } from '../../src/utils/dates.js';
import { FORM_ACTION } from '../../src/utils/contact-form.js';

const SECTIONS = [
  { type: 'formation', titre: 'en formation', note: 'MyDigitalSchool Nantes' },
  { type: 'entreprise', titre: 'en entreprise (1Life)', note: 'alternance depuis septembre 2026' },
  { type: 'perso', titre: 'perso', note: "en dehors des cours et de l'entreprise" },
];

// --- Aides de mise en forme ------------------------------------------------------

// Texte de contenu : échappé ; repères [À COMPLÉTER] surlignés en dev, retirés au build
function texter(dev) {
  return (value) => {
    const text = String(value ?? '');
    return frenchSpacing(dev ? markPlaceholders(escapeHtml(text)) : escapeHtml(withoutPlaceholders(text)));
  };
}

// Liste sans les éléments qui ne contenaient qu'un repère (site publié)
function kept(list, dev) {
  return (list ?? []).filter((item) => dev || withoutPlaceholders(item) !== '');
}

const sep = '<span class="sep" aria-hidden="true"> · </span>';
const joinDots = (parts) => parts.filter(Boolean).join(sep);

// --- Cadre commun ------------------------------------------------------------------

const NAV = [
  { label: 'accueil', href: './', id: '' },
  { label: 'projets', href: './projets/', id: 'projets/' },
  { label: 'veille', href: './veille/', id: 'veille/' },
];

function header(site, current) {
  const { github, linkedin } = site.config.contact;
  const items = [
    ...NAV.map((n) => {
      const active = current === n.id || (n.id && current.startsWith(n.id));
      return `<a href="${n.href}"${active ? ' aria-current="page"' : ''}>${n.label}</a>`;
    }),
    site.config.documents.cv ? `<a href="./${escapeHtml(site.config.documents.cv)}">cv</a>` : '',
    `<a href="${escapeHtml(github)}">github</a>`,
    `<a href="${escapeHtml(linkedin)}">linkedin</a>`,
  ].filter(Boolean);
  return `<a class="skip" href="#contenu">aller au contenu</a>
<header class="site-header">
  <a class="brand" href="./"${current === '' ? ' aria-current="page"' : ''}>rémi moreau</a>
  <nav aria-label="navigation principale"><ul class="nav">${items.map((i) => `<li>${i}</li>`).join('')}</ul></nav>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <ul class="nav nav--footer">
    <li><a href="./formations/">formations</a></li>
    <li><a href="./contact/">contact</a></li>
    <li><a href="./mentions-legales/">mentions légales</a></li>
  </ul>
</footer>`;
}

function layout(site, path, main) {
  return `${header(site, path)}
<main id="contenu" class="page">
${main}
</main>
${footer()}`;
}

// --- Gabarit d'une réalisation --------------------------------------------------------

function tagList(site, tags, t) {
  const codes = Object.fromEntries(site.config.competences.map((c) => [c.code, c.libelle]));
  const items = kept(tags, site.dev).map((tag) =>
    codes[tag] ? `<li><abbr title="${escapeHtml(codes[tag])}">${t(tag)}</abbr></li>` : `<li>${t(tag)}</li>`,
  );
  return `<ul class="tags">${items.join('')}</ul>`;
}

function projetLinks(p, { fiche }) {
  const links = [
    fiche ? `<a href="./projets/${p.slug}/">fiche</a>` : '',
    ...p.liens.map((l) => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.libelle)}</a>`),
  ].filter(Boolean);
  return links.length ? `<ul class="links">${links.map((l) => `<li>${l}</li>`).join('')}</ul>` : '';
}

// Le gabarit court, identique partout : titre, résumé, contexte, ce que j'ai
// fait, compétences, liens. `level` : niveau du titre (h2 sur la fiche, h3
// dans la liste).
function gabarit(site, p, { level = 3, fiche = true } = {}) {
  const t = texter(site.dev);
  const titre = fiche ? `<a href="./projets/${p.slug}/">${t(p.titre)}</a>` : t(p.titre);
  const draft = p.brouillon ? '<span class="draft">brouillon</span>' : '';
  const actions = kept(p.actions, site.dev).map((a) => `<li>${t(a)}</li>`).join('');
  const links = projetLinks(p, { fiche });
  return `<article class="projet" id="${p.slug}">
  <h${level} class="projet-titre">${titre}${draft}</h${level}>
  <p class="meta">${joinDots([t(formatDate(p.date)), p.domaine, t(p.statut)])}</p>
  <p class="resume">${t(p.resume)}</p>
  <dl class="gabarit">
    <div><dt>contexte</dt><dd>${t(p.contexte)}</dd></div>
    ${actions ? `<div><dt>ce que j'ai fait</dt><dd><ul class="actions">${actions}</ul></dd></div>` : ''}
    <div><dt>compétences</dt><dd>${tagList(site, p.tags, t)}</dd></div>
    ${links ? `<div><dt>lien</dt><dd>${links}</dd></div>` : ''}
  </dl>
</article>`;
}

// --- Pages ----------------------------------------------------------------------------

function accueil(site) {
  const t = texter(site.dev);
  const { formation, alternance, activite, ville } = site.config.accueil;
  return `<div class="sphere" aria-hidden="true"><canvas class="sphere-canvas" width="360" height="300"></canvas></div>
<section class="card" aria-labelledby="nom">
  <h1 id="nom" class="card-nom">rémi moreau</h1>
  <p>${t(formation)}<br>${t(alternance)}</p>
  <p>${t(activite)}</p>
  <p class="muted">${t(ville)}</p>
</section>`;
}

function projets(site) {
  const sections = SECTIONS.map((s) => {
    const list = site.projets.filter((p) => p.type === s.type);
    if (!list.length) return '';
    return `<section class="section" id="${s.type}" aria-labelledby="titre-${s.type}">
  <h2 id="titre-${s.type}">${s.titre}</h2>
  <p class="meta">${s.note}</p>
  ${list.map((p) => gabarit(site, p)).join('\n')}
</section>`;
  }).join('\n');
  return `<h1>projets</h1>
<p class="intro">classés par contexte. dans chaque section : l'applicatif (dev, SQL, paramétrage ERP), puis l'infra.</p>
<ul class="nav nav--toc">${SECTIONS.map((s) => `<li><a href="#${s.type}">${s.titre}</a></li>`).join('')}</ul>
${sections}
<p class="muted">voir aussi les <a href="./formations/">formations suivies chez 1Life</a>.</p>`;
}

function fiche(site, p) {
  const t = texter(site.dev);
  const mention = p.ia ? `<p class="note">${t(site.config.mentionsIa[p.ia])}</p>` : '';
  const documents = p.documents.length
    ? `<section class="section" aria-labelledby="documents"><h2 id="documents">documents</h2>
  <ul class="list">${p.documents.map((d) => `<li><a href="./${escapeHtml(d.url)}">${t(d.libelle)}</a></li>`).join('')}</ul></section>`
    : '';
  const illustrations = p.illustrations.length
    ? `<section class="section" aria-labelledby="illustrations"><h2 id="illustrations">illustrations</h2>
  ${p.illustrations
    .map((i) => `<figure class="figure"><a href="./${escapeHtml(i.src)}"><img src="./${escapeHtml(i.src)}" alt="${escapeHtml(i.legende)}" loading="lazy" decoding="async"></a><figcaption>${t(i.legende)}</figcaption></figure>`)
    .join('\n  ')}</section>`
    : '';
  const section = SECTIONS.find((s) => s.type === p.type);
  return `<p class="crumbs"><a href="./projets/">projets</a>${sep}<a href="./projets/#${p.type}">${section.titre}</a></p>
${gabarit(site, p, { level: 1, fiche: false })}
${mention}
${documents}
${illustrations}`;
}

function formations(site) {
  const t = texter(site.dev);
  const published = new Set(site.projets.map((p) => p.slug));
  const item = (f) => {
    const links = [
      f.fiche && published.has(f.fiche) ? `<a href="./projets/${f.fiche}/">fiche</a>` : '',
      f.justificatif ? `<a href="./${escapeHtml(f.justificatif)}">justificatif (PDF)</a>` : '',
      f.lien ? `<a href="${escapeHtml(f.lien)}">vérifier</a>` : '',
    ].filter(Boolean);
    return `<article class="projet">
  <h3 class="projet-titre">${t(f.titre)}</h3>
  <p class="meta">${joinDots([t(f.organisme), t(formatDate(f.date)), f.statut ? t(f.statut) : ''])}</p>
  ${f.description ? `<p class="resume">${t(f.description)}</p>` : ''}
  ${links.length ? `<ul class="links">${links.map((l) => `<li>${l}</li>`).join('')}</ul>` : ''}
</article>`;
  };
  const group = (categorie, titre, note) => {
    const list = site.config.formations.filter((f) => f.categorie === categorie).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (!list.length) return '';
    return `<section class="section" id="${categorie}" aria-labelledby="titre-${categorie}">
  <h2 id="titre-${categorie}">${titre}</h2>
  <p class="meta">${note}</p>
  ${list.map(item).join('\n')}
</section>`;
  };
  return `<h1>formations</h1>
<p class="intro">formations suivies en alternance chez 1Life, et badges obtenus en dehors.</p>
${group('formation', 'formations chez 1Life', 'Open-Prod, sur des bases de démonstration')}
${group('badge', 'badges', 'cours en ligne, avec justificatif vérifiable')}`;
}

function veille(site) {
  const t = texter(site.dev);
  const { sujets } = site.veille;
  const blocks = sujets.map((s) => {
    const syntheses = s.syntheses.length
      ? s.syntheses
          .map((y) => `<article class="synthese">
    <h4>${joinDots([y.date ? t(formatDate(y.date)) : '', t(y.titre)])}</h4>
    <div class="prose">${y.html}</div>
  </article>`)
          .join('\n')
      : '<p class="muted">pas encore de synthèse sur ce sujet.</p>';
    const actus = s.actualites.slice(0, 5);
    const actualites = actus.length
      ? `<ul class="list list--actus">${actus
          .map((a) => `<li><a href="${escapeHtml(a.url)}">${escapeHtml(a.titre)}</a><span class="meta">${joinDots([escapeHtml(formatDate(a.date)), escapeHtml(a.source)])}</span></li>`)
          .join('')}</ul>`
      : '<p class="muted">pas encore d\'actualité collectée.</p>';
    return `<section class="section" id="${s.id}" aria-labelledby="titre-${s.id}">
  <h2 id="titre-${s.id}">${t(s.titre)}</h2>
  <div class="prose">${s.pourquoi}</div>
  <h3>mes synthèses</h3>
  ${syntheses}
  <h3>dernières actualités</h3>
  ${actualites}
</section>`;
  });
  return `<h1>veille technologique</h1>
<div class="prose intro">${site.veille.html}</div>
<ul class="nav nav--toc">${sujets.map((s) => `<li><a href="#${s.id}">${t(s.titre)}</a></li>`).join('')}</ul>
${blocks.join('\n')}`;
}

function contact(site, base) {
  const { email, github, linkedin } = site.config.contact;
  const { cv } = site.config.documents;
  const cle = site.config.formulaire?.cle;
  const redirect = base ? `<input type="hidden" name="redirect" value="${escapeHtml(`${base}contact/merci/`)}">` : '';
  const form = cle
    ? `<form class="form" action="${FORM_ACTION}" method="post" accept-charset="utf-8">
  <h2>écrire un message</h2>
  <input type="hidden" name="access_key" value="${escapeHtml(cle)}">
  <input type="hidden" name="subject" value="Nouveau message depuis le portfolio">
  <input type="hidden" name="from_name" value="Portfolio de ${escapeHtml(site.config.identite.nom)}">
  ${redirect}
  <input type="checkbox" name="botcheck" class="hp" tabindex="-1" aria-hidden="true">
  <label class="field"><span>nom</span><input type="text" name="name" autocomplete="name" required maxlength="100"></label>
  <label class="field"><span>e-mail</span><input type="email" name="email" autocomplete="email" required maxlength="200"></label>
  <label class="field"><span>message</span><textarea name="message" rows="6" required maxlength="5000"></textarea></label>
  <label class="check"><input type="checkbox" required> j'accepte que ces informations servent uniquement à me répondre (<a href="./mentions-legales/#formulaire">données personnelles</a>).</label>
  <button type="submit" class="button">envoyer</button>
</form>`
    : '';
  return `<h1>contact</h1>
<dl class="gabarit">
  <div><dt>e-mail</dt><dd><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></dd></div>
  <div><dt>github</dt><dd><a href="${escapeHtml(github)}">${escapeHtml(github.replace(/^https:\/\/(www\.)?/, ''))}</a></dd></div>
  <div><dt>linkedin</dt><dd><a href="${escapeHtml(linkedin)}">${escapeHtml(linkedin.replace(/^https:\/\/(www\.)?/, ''))}</a></dd></div>
  ${cv ? `<div><dt>cv</dt><dd><a href="./${escapeHtml(cv)}">cv en PDF</a></dd></div>` : ''}
</dl>
${form}`;
}

function merci() {
  return `<h1>message envoyé</h1>
<p>merci, votre message a bien été envoyé. je vous réponds dès que possible, à l'adresse indiquée.</p>
<p><a href="./">retour à l'accueil</a></p>`;
}

function mentionsLegales(site) {
  const { nom } = site.config.identite;
  const { email } = site.config.contact;
  const { hebergeur, codeSource } = site.config.mentionsLegales;
  const mail = `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`;
  const a = (href, label) => `<a href="${escapeHtml(href)}">${label}</a>`;
  const audience = Boolean(site.config.audience?.goatcounter);
  return frenchSpacing(`<h1>mentions légales</h1>
<div class="prose">
<h2>éditeur</h2>
<p>portfolio personnel de ${escapeHtml(nom)}, étudiant en BTS SIO, publié à titre non professionnel. responsable de la publication : ${escapeHtml(nom)}. contact : ${mail}.</p>
<h2>hébergement</h2>
<p>${escapeHtml(hebergeur.nom)}, ${escapeHtml(hebergeur.adresse)}. ${a(hebergeur.site, escapeHtml(hebergeur.site.replace(/^https:\/\//, '')))}</p>
<h2>propriété intellectuelle</h2>
<p>les textes, photos, captures et documents de ce site appartiennent à ${escapeHtml(nom)} : leur reproduction nécessite son accord. le code source est publié sous licence MIT : ${a(codeSource, 'code source')}, ${a(`${codeSource}/blob/main/LICENSE`, 'licence')}.</p>
<h2>crédits</h2>
<p>police IBM Plex Mono : © IBM Corp., licence SIL Open Font License 1.1, hébergée par le site lui-même. outils de fabrication, non envoyés aux visiteurs : Vite, marked et gray-matter, sous licence MIT.</p>
<h2>données personnelles et cookies</h2>
<p>ce site ne dépose aucun cookie${audience ? '' : ", n'utilise aucun outil de mesure d'audience"} et ne charge aucune ressource extérieure (police, script, image). comme tout hébergeur, ${escapeHtml(hebergeur.nom)} enregistre l'adresse IP des visiteurs pour la sécurité de son service : voir sa ${a(hebergeur.confidentialite, 'déclaration de confidentialité')}.</p>
${audience ? `<h2 id="audience">mesure d'audience</h2>
<p>chaque page consultée est comptée avec GoatCounter, un outil open source sans cookie, qui ne conserve ni l'adresse IP ni d'identifiant. seuls des totaux sont enregistrés : page, date, site d'origine, navigateur, système, taille d'écran et pays (${a('https://www.goatcounter.com/help/privacy', 'politique de confidentialité')}). les navigateurs qui demandent à ne pas être suivis (Do Not Track, Global Privacy Control) ne sont pas comptés.</p>` : ''}
${site.config.formulaire?.cle ? `<h2 id="formulaire">formulaire de contact</h2>
<p>le nom, l'adresse e-mail et le message saisis servent uniquement à vous répondre et ne sont jamais cédés. ils passent par le service Web3Forms, qui les transfère par e-mail sans conserver les messages (traitement aux États-Unis, ${a('https://docs.web3forms.com/getting-started/faq', 'foire aux questions')}). les messages reçus sont gardés le temps de l'échange.</p>
<p>conformément au RGPD, vous pouvez demander l'accès à ces données, leur rectification ou leur effacement en écrivant à ${mail}, et adresser une réclamation à la ${a('https://www.cnil.fr', 'CNIL')}.</p>` : ''}
</div>`);
}

// --- Liste des pages --------------------------------------------------------------------

// Toutes les pages du site : { path, title, description, body, depth }.
// `base` : adresse publique (https://remim.me/) ou '' si elle n'est pas connue.
export function sitePages(site, base) {
  const nom = site.config.identite.nom;
  const t = (value) => withoutPlaceholders(String(value ?? ''));
  const page = (path, title, description, main) => ({
    path,
    depth: path.split('/').filter(Boolean).length,
    title,
    description: t(description),
    body: layout(site, path, main),
  });
  return [
    page('', site.config.referencement.titre, site.config.referencement.description, accueil(site)),
    page('projets/', `projets · ${nom}`, `réalisations de ${nom} en formation, en entreprise (1Life) et en projet personnel.`, projets(site)),
    ...site.projets.map((p) => page(`projets/${p.slug}/`, `${t(p.titre)} · ${nom}`, p.resume, fiche(site, p))),
    page('formations/', `formations · ${nom}`, `formations suivies par ${nom} chez 1Life, et badges.`, formations(site)),
    page('veille/', `veille technologique · ${nom}`, site.veille.data.description ?? '', veille(site)),
    page('contact/', `contact · ${nom}`, `contacter ${nom} : e-mail, GitHub, LinkedIn, CV.`, contact(site, base)),
    { ...page('contact/merci/', `message envoyé · ${nom}`, '', merci()), noindex: true },
    page('mentions-legales/', `mentions légales · ${nom}`, `mentions légales du portfolio de ${nom}.`, mentionsLegales(site)),
  ];
}

// Anciennes adresses (site RémiOS, fiches renommées) : petites pages qui
// renvoient vers la nouvelle. { path, target }
export function redirectPages(site) {
  const redirects = [
    ['realisations/', 'projets/'],
    ['presentation/', ''],
    ['alternance/', ''],
    ['en/', ''],
    ['en/realisations/', 'projets/'],
    ['en/veille/', 'veille/'],
  ];
  for (const p of site.projets) {
    for (const slug of [p.slug, ...p.anciennesAdresses]) {
      redirects.push([`realisations/${slug}/`, `projets/${p.slug}/`], [`en/realisations/${slug}/`, `projets/${p.slug}/`]);
      if (slug !== p.slug) redirects.push([`projets/${slug}/`, `projets/${p.slug}/`]);
    }
  }
  for (const s of site.veille.sujets) redirects.push([`veille/${s.id}/`, `veille/#${s.id}`], [`en/veille/${s.id}/`, `veille/#${s.id}`]);
  return redirects.map(([path, target]) => ({ path, target, depth: path.split('/').filter(Boolean).length }));
}

// Données du terminal caché (module virtual:site-data) : le strict nécessaire
export function terminalData(site) {
  const t = (value) => withoutPlaceholders(String(value ?? ''));
  const list = (values) => (values ?? []).map(t).filter(Boolean);
  return {
    nom: site.config.identite.nom,
    accueil: Object.fromEntries(Object.entries(site.config.accueil).map(([k, v]) => [k, t(v)])),
    contact: site.config.contact,
    cv: site.config.documents.cv,
    projets: site.projets.map((p) => ({
      slug: p.slug,
      type: p.type,
      domaine: p.domaine,
      titre: t(p.titre),
      date: formatDate(p.date),
      statut: t(p.statut),
      resume: t(p.resume),
      contexte: t(p.contexte),
      actions: list(p.actions),
      tags: list(p.tags),
      liens: p.liens,
    })),
    veille: site.veille.sujets.map((s) => ({ id: s.id, titre: t(s.titre), syntheses: s.syntheses.length })),
    formations: site.config.formations.map((f) => ({ titre: f.titre, organisme: f.organisme, date: formatDate(f.date), categorie: f.categorie })),
  };
}

