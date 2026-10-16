// Petites fonctions pour fabriquer du HTML en toute sécurité.
// Ce module sert à la fois au build (plugin Markdown, exécuté par Node) et dans
// le navigateur : il ne dépend donc d'aucune API propre à l'un ou à l'autre,
// sauf safe() et placeholder(), réservées au navigateur (voir en fin de fichier).

// Repère de contenu à compléter : « [À COMPLÉTER] » ou « [À COMPLÉTER : précision] »
const PLACEHOLDER = /\[À COMPLÉTER[^\]]*\]/g;

// Le texte contient-il un repère [À COMPLÉTER] ? (expression sans « g » :
// un test répété ne dépend pas du résultat du précédent)
export function hasPlaceholder(value) {
  return /\[À COMPLÉTER[^\]]*\]/.test(String(value));
}

// Remplace les caractères spéciaux du HTML par leur équivalent affichable.
// Indispensable avant d'insérer un texte dans une page : un « < » dans un titre
// serait sinon interprété comme le début d'une balise.
export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Entoure chaque repère [À COMPLÉTER] d'une balise <mark> (surlignée en jaune).
// Le HTML est découpé en balises / texte : seul le texte est modifié, jamais
// l'intérieur d'une balise (un attribut alt="…" par exemple).
export function markPlaceholders(html) {
  return html
    .split(/(<[^>]*>)/)
    .map((part) =>
      part.startsWith('<') ? part : part.replace(PLACEHOLDER, '<mark class="ph">$&</mark>'),
    )
    .join('');
}

// Site publié : les repères sont retirés (ils ne restent visibles qu'avec
// `npm run dev`), avec ce qui ne contenait qu'eux : paragraphe, élément de
// liste, légende, puis le titre d'une section restée vide (« Bilan personnel »
// sans rien dessous).
const PLACEHOLDER_WITH_SPACE = /[ \t]*\[À COMPLÉTER[^\]]*\]/g;
const EMPTY_BLOCK = /<(p|li|ul|ol|figcaption|blockquote)\b[^>]*>\s*<\/\1>\s*/g;
// Titre suivi d'un autre titre de même niveau ou de niveau supérieur, ou de la
// fin du texte : sa section est vide.
const HEADING = /<h([1-6])\b[^>]*>(?:(?!<\/h\1>)[\s\S])*<\/h\1>\s*(?=<h([1-6])\b|$)/g;

export function stripPlaceholders(html) {
  let result = html.replace(PLACEHOLDER_WITH_SPACE, '');
  let previous;
  do {
    previous = result;
    result = result
      .replace(EMPTY_BLOCK, '')
      .replace(HEADING, (heading, level, next) => (next && Number(next) > Number(level) ? heading : ''));
  } while (result !== previous);
  return result;
}

// Texte brut sans ses repères : « Proxmox [À COMPLÉTER] » → « Proxmox »
export function withoutPlaceholders(value) {
  return String(value).replace(PLACEHOLDER_WITH_SPACE, '').trim();
}

// Typographie française : l'espace avant « ; : ! ? » et à l'intérieur des
// guillemets « » devient insécable, pour que la ligne ne se coupe jamais juste
// avant la ponctuation (« blocage » en fin de ligne, « ; » seul au début de la
// suivante). Comme pour les repères, seul le texte est modifié, pas les balises.
export function frenchSpacing(html) {
  return html
    .split(/(<[^>]*>)/)
    .map((part) =>
      part.startsWith('<')
        ? part
        : part
            .replace(/ ([;!?])/g, '\u202f$1') // espace fine insécable
            .replace(/ (:)/g, '\u00a0$1') // espace insécable avant les deux-points
            .replace(/« /g, '«\u00a0')
            .replace(/ »/g, '\u00a0»'),
    )
    .join('');
}

// safe() et placeholder() ne servent que dans le navigateur : import.meta.env
// n'existe que dans le code passé par Vite (le build n'appelle que les
// fonctions précédentes).

// Texte brut → HTML sûr. Repères [À COMPLÉTER] : surlignés avec `npm run dev`,
// retirés du site publié.
export function safe(value) {
  return import.meta.env.DEV ? markPlaceholders(escapeHtml(value)) : escapeHtml(withoutPlaceholders(value));
}

// Repère d'une information absente de la configuration (CV, photo…) :
// surligné avec `npm run dev`, rien dans le site publié.
export function placeholder(text) {
  return import.meta.env.DEV ? `<mark class="ph">${escapeHtml(text)}</mark>` : '';
}
