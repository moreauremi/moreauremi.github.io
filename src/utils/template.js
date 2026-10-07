// Gabarits HTML : la structure fixe d'un élément de l'interface est écrite
// dans un fichier .html à côté de son module (ex. src/tui/lightbox.html), et
// importée sous forme de texte avec le suffixe « ?raw » de Vite :
//
//   import lightboxHtml from './lightbox.html?raw';
//
// Les parties qui dépendent du contenu (nom, adresse d'un lien…) sont des
// emplacements vides marqués data-slot, remplis ensuite avec textContent :
// une donnée n'est jamais interprétée comme du HTML.

// Fichier qui décrit un seul élément (une fenêtre <dialog>…) → cet élément,
// prêt à être inséré dans la page.
export function htmlToElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}
