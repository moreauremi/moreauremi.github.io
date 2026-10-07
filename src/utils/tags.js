// Identifiant d'un tag de la veille, utilisé dans les adresses (#/veille/<tag>)
// et pour reconnaître deux écritures d'un même tag.
//   'Fuite de données'          → 'fuite-de-donnees'
//   'Systèmes industriels (OT)' → 'systemes-industriels-ot'
// Ce module sert à la fois au script de veille (Node) et dans le navigateur.

export function tagSlug(tag) {
  return String(tag)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents retirés : é → e
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
