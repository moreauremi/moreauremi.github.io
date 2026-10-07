// Petites fonctions sur les adresses. Ce module sert à la fois au build
// (plugin de contenu, exécuté par Node) et dans le navigateur (routeur, pages
// d'erreur) : il ne dépend donc d'aucune API propre à l'un ou à l'autre.

// « /r%C3%A9alisations » → « /réalisations ». Une adresse mal encodée
// (« /%E9 ») ferait échouer le décodage : elle est alors gardée telle quelle,
// et mène simplement à une page « introuvable ».
export function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Adresse publique du site (urlPublique de la configuration), toujours
// terminée par « / », ou '' si elle n'est pas renseignée.
export function publicBase(url) {
  return url ? url.replace(/\/?$/, '/') : '';
}
