// Identifiant d'un tag de la veille, utilisé dans les adresses (#/veille/<tag>)
// et pour reconnaître deux écritures d'un même tag.
//   'Fuite de données'          → 'fuite-de-donnees'
//   'Systèmes industriels (OT)' → 'systemes-industriels-ot'
// Ce module sert à la fois au script de veille (Node) et dans le navigateur.

export function tagSlug(tag) {
  return withoutAccents(String(tag))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// « Sécurité » → « Securite ». La décomposition NFD sépare chaque lettre de
// son accent (é → e + accent aigu seul) ; les accents seuls, entre U+0300 et
// U+036F, sont ensuite retirés.
export function withoutAccents(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
