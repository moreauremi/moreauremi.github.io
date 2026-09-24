// Petites fonctions pour fabriquer du HTML en toute sécurité.
// Ce module sert à la fois au build (plugin Markdown, exécuté par Node) et dans
// le navigateur : il ne dépend donc d'aucune API propre à l'un ou à l'autre.

// Repère de contenu à compléter : « [À COMPLÉTER] » ou « [À COMPLÉTER : précision] »
const PLACEHOLDER = /\[À COMPLÉTER[^\]]*\]/g;

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

// Texte brut → HTML sûr, avec les repères [À COMPLÉTER] surlignés.
export function safe(value) {
  return markPlaceholders(escapeHtml(value));
}
