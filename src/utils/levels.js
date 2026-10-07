// Niveaux de la rubrique « Compétences » (savoirFaire dans la configuration).
// Un niveau est un nombre de 1 au nombre de niveaux, par pas de 0,5 : 3.5 se
// lit « entre le niveau 3 et le niveau 4 ». Partagé par la rubrique (blocks/competences.js)
// et par le terminal (`cat competences.txt`).

// Barre en caractères, façon terminal, deux caractères par niveau :
// 2 sur 4 → [####----], 3,5 sur 4 → [#######-]
export function levelBarText(value, max) {
  return `[${'#'.repeat(value * 2)}${'-'.repeat((max - value) * 2)}]`;
}

// Nom du niveau : « Autonome », ou « Entre autonome et maîtrise » pour 3.5
export function levelName(value, niveaux) {
  if (Number.isInteger(value)) return niveaux[value - 1].nom;
  const below = niveaux[Math.floor(value) - 1].nom.toLowerCase();
  const above = niveaux[Math.ceil(value) - 1].nom.toLowerCase();
  return `Entre ${below} et ${above}`;
}
