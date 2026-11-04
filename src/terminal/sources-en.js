// Textes sources des traductions anglaises (<nom>.en.md), affichés par `cat`
// dans le terminal de la version anglaise. Fichier JavaScript à part : il
// n'est téléchargé qu'à l'ouverture du terminal sur le site en anglais
// (voir filesystem.js).
export default import.meta.glob('../../content/**/*.en.md', { query: '?source', import: 'default', eager: true });
