// Traductions anglaises du contenu : chaque fichier <nom>.en.md de content/,
// converti au build comme les fichiers français (plugins/vite-plugin-content.js).
//
// Ce module forme un fichier JavaScript à part, téléchargé par src/content.js
// seulement quand le site s'affiche en anglais : un visiteur de la version
// française ne le télécharge jamais.
export default import.meta.glob('../content/**/*.en.md', { eager: true, import: 'default' });
