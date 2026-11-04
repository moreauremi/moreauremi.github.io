// =============================================================================
// Langue du site : français (langue d'origine) ou anglais
// -----------------------------------------------------------------------------
// Tout est d'abord écrit en français ; la version anglaise suit les mêmes
// règles partout :
//   - adresses : préfixe « en/ » (#/en/realisations/homelab) ; sans préfixe,
//     le site est en français (voir src/router.js) ;
//   - textes de l'interface : tr('Présentation', 'About me'), les deux
//     langues côte à côte dans le code, au moment de l'affichage ;
//   - contenu Markdown : un fichier <nom>.en.md à côté de <nom>.md ; tant
//     qu'il n'existe pas, le texte français est affiché (voir src/content.js) ;
//   - configuration : sous-objets « en » dans content/site.config.js (voir
//     localizeConfig ci-dessous).
//
// Ce module sert au build (Node) comme dans le navigateur : il ne dépend
// d'aucune API propre à l'un ou à l'autre.
// =============================================================================

export const LANGS = ['fr', 'en'];
export const DEFAULT_LANG = 'fr';

let current = DEFAULT_LANG;

export function currentLang() {
  return current;
}

// Appelé par src/content.js, une fois le contenu de la langue chargé
export function setCurrentLang(lang) {
  current = LANGS.includes(lang) ? lang : DEFAULT_LANG;
}

// Texte de l'interface dans la langue affichée
export function tr(fr, en) {
  return current === 'en' ? en : fr;
}

// Configuration dans une langue. Tout objet de la configuration peut avoir
// un champ « en » : la version anglaise de ses textes, qui remplace les
// textes français champ par champ (les sous-objets sont fusionnés, les listes
// remplacées entièrement). Ce qui n'est pas traduit reste en français.
//
//   { code: 'B1.4', libelle: 'Travailler en mode projet', en: { libelle: 'Work in project mode' } }
//   → en français : { code: 'B1.4', libelle: 'Travailler en mode projet' }
//   → en anglais  : { code: 'B1.4', libelle: 'Work in project mode' }
export function localizeConfig(value, lang) {
  if (Array.isArray(value)) return value.map((item) => localizeConfig(item, lang));
  if (!isPlainObject(value)) return value;
  const { en, ...rest } = value;
  const result = Object.fromEntries(Object.entries(rest).map(([key, item]) => [key, localizeConfig(item, lang)]));
  return lang === 'en' && isPlainObject(en) ? merge(result, localizeConfig(en, lang)) : result;
}

function merge(base, extra) {
  for (const [key, value] of Object.entries(extra)) {
    base[key] = isPlainObject(value) && isPlainObject(base[key]) ? merge({ ...base[key] }, value) : value;
  }
  return base;
}

export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
