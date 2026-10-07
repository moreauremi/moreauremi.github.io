// Réglage système « réduire les animations » (accessibilité), partagé par le
// démarrage (pas de boot), le terminal (générique affiché en texte) et le
// titre de l'onglet (curseur fixe). `reducedMotion.matches` est toujours à
// jour : un changement de réglage pendant la visite est pris en compte.
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
