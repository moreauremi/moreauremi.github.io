// Pages d'erreur 404 et 403 : affiche l'adresse demandée dans la ligne de
// commande simulée. Sans JavaScript, le texte de remplacement reste affiché.
// textContent : l'adresse est affichée comme du texte, jamais interprétée
// comme du HTML (une adresse piégée ne peut rien injecter dans la page).
// Ce fichier n'importe rien : Vite n'en fait pas un fichier commun avec le site.

const path = readablePath(window.location.pathname);

for (const element of document.querySelectorAll('[data-path]')) {
  element.textContent = path;
}

// « /r%C3%A9alisations » → « /réalisations ». Une adresse mal encodée est
// affichée telle quelle.
function readablePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
