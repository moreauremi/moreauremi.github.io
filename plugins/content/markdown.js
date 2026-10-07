// =============================================================================
// Conversion Markdown → HTML (marked), avec le rendu propre à RémiOS
// -----------------------------------------------------------------------------
// Les commentaires <!-- … --> des fichiers Markdown sont des consignes de
// rédaction : ils sont retirés AVANT la conversion, et n'apparaissent donc ni
// dans le HTML envoyé aux visiteurs, ni dans le texte affiché par `cat`.
// =============================================================================

import path from 'node:path';
import { Marked } from 'marked';
import { escapeHtml, markPlaceholders, frenchSpacing } from '../../src/utils/html.js';

// Corps Markdown → { html, images }. `images` : chemins des images
// rencontrées, vérifiés ensuite par le plugin.
export function renderMarkdown(markdown) {
  const images = [];

  const marked = new Marked({
    gfm: true, // Markdown « GitHub » : tableaux, listes de tâches…
    renderer: {
      // Image cliquable : le lien ouvre l'image en grand (la visionneuse du
      // site l'intercepte ; sans JavaScript, l'image s'ouvre seule).
      // Dans RémiOS, l'image (capture d'écran ou schéma) est présentée dans une
      // fenêtre, avec une barre de titre : nom du fichier et « [agrandir] ».
      // La barre est décorative (aria-hidden) : le lien garde pour nom la
      // description de l'image.
      image({ href, text }) {
        images.push(href);
        const src = escapeHtml(href);
        const bar = `<span class="shot-bar" aria-hidden="true"><span class="shot-bar-name">${escapeHtml(path.posix.basename(href))}</span><span class="shot-bar-zoom">[agrandir]</span></span>`;
        return `<a class="shot shot--window" href="${src}">${bar}<img src="${src}" alt="${escapeHtml(text)}" loading="lazy" decoding="async"></a>`;
      },

      // Paragraphe qui ne contient qu'une image : devient une figure, avec le
      // titre de l'image comme légende : ![description](chemin "Légende")
      paragraph({ tokens }) {
        const inner = this.parser.parseInline(tokens);
        if (tokens.length === 1 && tokens[0].type === 'image') {
          const caption = tokens[0].title;
          return `<figure class="shot-figure">${inner}${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>\n`;
        }
        return `<p>${inner}</p>\n`;
      },

      // Liens externes : ouverts dans un nouvel onglet, sans que la page ouverte
      // puisse agir sur celle-ci (rel="noopener noreferrer").
      link({ href, title, tokens }) {
        const label = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const target = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(href)}"${titleAttr}${target}>${label}</a>`;
      },
    },
  });

  // Commentaires retirés sans les retours à la ligne qui les entourent : deux
  // paragraphes séparés par un commentaire restent deux paragraphes.
  const html = marked.parse(markdown.replace(/<!--[\s\S]*?-->/g, ''));
  return { html: frenchSpacing(markPlaceholders(html)), images };
}

// Texte source affiché par `cat` dans le terminal : sans les commentaires
// ni les lignes vides qui les suivaient
export function stripComments(source) {
  return source.replace(/<!--[\s\S]*?-->\s*/g, '');
}
