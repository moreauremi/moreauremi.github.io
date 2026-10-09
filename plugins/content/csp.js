// =============================================================================
// Politique de sécurité du contenu (CSP)
// -----------------------------------------------------------------------------
// Une seule définition pour tout le site : la balise <meta> ajoutée à chaque
// page au build (GitHub Pages ne permet pas d'envoyer d'en-têtes HTTP), et
// l'en-tête envoyé par nginx dans la version Docker
// (docker/security-headers.conf), que le build vérifie : si les deux
// divergent, le build s'arrête et indique la ligne à écrire.
// =============================================================================

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { FORM_ACTION } from '../../src/utils/contact-form.js';

export const NGINX_HEADERS_FILE = 'docker/security-headers.conf';

// Scripts, styles, polices et images ne peuvent venir que du site lui-même.
// Deux exceptions : si le formulaire de contact est activé, il peut être
// envoyé au service qui transmet les messages ; si la mesure d'audience est
// activée, une requête peut partir vers GoatCounter (connect-src pour
// sendBeacon, img-src pour les navigateurs qui ne l'ont pas).
// `scriptHashes`, `styleHashes` : empreintes des blocs écrits dans la page
// (données structurées, style de 503.html), autorisés un par un.
export function contentSecurityPolicy(site, { scriptHashes = [], styleHashes = [] } = {}) {
  const formAction = site.formulaire?.cle ? `'self' ${new URL(FORM_ACTION).origin}` : "'self'";
  const audience = site.audience?.goatcounter ? ` ${new URL(site.audience.goatcounter).origin}` : '';
  return [
    "default-src 'self'",
    ["script-src 'self'", ...scriptHashes].join(' '),
    ["style-src 'self'", ...styleHashes].join(' '),
    `img-src 'self' data:${audience}`,
    "font-src 'self'",
    `connect-src 'self'${audience}`,
    "object-src 'none'",
    "base-uri 'self'",
    `form-action ${formAction}`,
  ].join('; ');
}

// Politique envoyée par nginx : la même, plus frame-ancestors (interdit
// d'afficher le site dans un cadre), qui n'est pas autorisé dans une balise
// <meta>. Sans empreintes : nginx ne sert ni la page 503 (affichée par le
// reverse proxy) ni de script exécutable écrit dans une page.
export function nginxPolicy(site) {
  return `${contentSecurityPolicy(site)}; frame-ancestors 'none'`;
}

// Vérifie que docker/security-headers.conf annonce bien la politique du site
export function checkNginxPolicy(site, root) {
  const file = path.join(root, NGINX_HEADERS_FILE);
  if (!fs.existsSync(file)) return [];
  const current = /^\s*add_header\s+Content-Security-Policy\s+"([^"]*)"/m.exec(fs.readFileSync(file, 'utf8'))?.[1];
  const expected = nginxPolicy(site);
  if (current === expected) return [];
  return [
    `l'en-tête Content-Security-Policy ne correspond plus à la politique des pages (content/site.config.js). Ligne attendue :\n    add_header Content-Security-Policy "${expected}" always;`,
  ];
}

// Empreinte SHA-256 d'un bloc écrit dans la page, au format attendu par la CSP.
// La CSP autorise exactement ce contenu-là, et aucun autre, au lieu de tout
// autoriser avec 'unsafe-inline'.
export function cspHash(text) {
  return `'sha256-${crypto.createHash('sha256').update(text).digest('base64')}'`;
}

// Empreintes des blocs <style> écrits dans la page (seule 503.html en a, car
// elle ne peut charger aucun fichier : vite-plugin-inline.js y recopie
// src/styles/maintenance.css). Calculées sur le HTML final : Vite a déjà
// minifié le contenu des <style>.
export function inlineStyleHashes(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(([, css]) => cspHash(css));
}
