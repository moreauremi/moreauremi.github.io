// Pages d'erreur 404 et 403 : affiche l'adresse demandée dans la ligne de
// commande simulée (« bash: cd: /adresse : aucun fichier ou dossier de ce nom »).
// Sans JavaScript, le texte de remplacement écrit dans le HTML reste affiché.
//
// textContent : l'adresse est affichée comme du texte, jamais interprétée
// comme du HTML (une adresse piégée ne peut rien injecter dans la page).
//
// Ce fichier n'importe rien, volontairement : s'il partageait un module avec
// le site (src/utils/url.js), Vite en ferait un fichier JavaScript commun, à
// télécharger en plus par chaque page.

const path = readablePath(window.location.pathname);

for (const element of document.querySelectorAll('[data-path]')) {
  element.textContent = path;
}

// « /r%C3%A9alisations » → « /réalisations ». Une adresse mal encodée
// (« /%E9 ») ferait échouer le décodage : elle est alors affichée telle quelle.
function readablePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
