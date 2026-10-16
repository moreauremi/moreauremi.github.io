// =============================================================================
// Conversion Markdown → HTML (marked), avec le rendu propre à RémiOS
// -----------------------------------------------------------------------------
// Les commentaires <!-- … --> des fichiers Markdown sont des consignes de
// rédaction : ils sont retirés AVANT la conversion, et n'apparaissent donc ni
// dans le HTML envoyé aux visiteurs, ni dans le texte affiché par `cat`.
// =============================================================================

import path from 'node:path';
import { Marked } from 'marked';
import { escapeHtml, markPlaceholders, stripPlaceholders, hasPlaceholder, frenchSpacing } from '../../src/utils/html.js';

// Corps Markdown → { html, images }. `images` : chemins des images
// rencontrées, vérifiés ensuite par le plugin.
// hidePlaceholders : site publié, repères [À COMPLÉTER] retirés au lieu d'être
// surlignés (voir stripPlaceholders).
export function renderMarkdown(markdown, { hidePlaceholders = false } = {}) {
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

      // Liens externes et documents PDF : ouverts dans un nouvel onglet, sans
      // que la page ouverte puisse agir sur celle-ci (rel="noopener noreferrer").
      link({ href, title, tokens }) {
        const label = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href) || /\.pdf(?:[?#]|$)/i.test(href);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const target = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(href)}"${titleAttr}${target}>${label}</a>`;
      },
    },
  });

  // Commentaires retirés sans les retours à la ligne qui les entourent : deux
  // paragraphes séparés par un commentaire restent deux paragraphes.
  const html = marked.parse(markdown.replace(/<!--[\s\S]*?-->/g, ''));
  return { html: frenchSpacing(hidePlaceholders ? stripPlaceholders(html) : markPlaceholders(html)), images };
}

// Texte source affiché par `cat` dans le terminal : sans les commentaires
// ni les lignes vides qui les suivaient
export function stripComments(source) {
  return source.replace(/<!--[\s\S]*?-->\s*/g, '');
}

// Texte source du site publié, sans repères [À COMPLÉTER], comme la page :
// une ligne qui ne contenait qu'un repère disparaît (paragraphe, élément de
// liste, champ de l'en-tête), puis le titre d'une section restée vide.
export function stripSourcePlaceholders(source) {
  const lines = source.split('\n').flatMap((line) => {
    if (!hasPlaceholder(line)) return [line];
    const rest = line.replace(/[ \t]*\[À COMPLÉTER[^\]]*\]/g, '').trimEnd();
    // Rien d'utile autour du repère : puce, guillemets vides, « champ: », commentaire
    return /^\s*(?:-\s*)?(?:[\w-]+:\s*)?(?:""|'')?\s*(?:#.*)?$/.test(rest) ? [] : [rest];
  });

  // Un titre retiré peut en vider un autre : on recommence jusqu'à stabilité
  let kept = lines;
  let previousLength;
  do {
    previousLength = kept.length;
    kept = withoutEmptySections(kept);
  } while (kept.length !== previousLength);

  // Plus d'une ligne vide d'affilée : une seule
  return kept.join('\n').replace(/\n{3,}/g, '\n\n');
}

// Titres des sections vides, en dehors de l'en-tête et des blocs de code
function withoutEmptySections(lines) {
  const frontmatterEnd = lines[0] === '---' ? lines.indexOf('---', 1) : -1;
  const headingLevel = (index) => (index > frontmatterEnd ? /^(#{1,6})\s/.exec(lines[index])?.[1].length : undefined);
  let fenced = false;
  const isCode = lines.map((line) => {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    return fenced;
  });
  return lines.filter((line, index) => {
    const level = isCode[index] ? undefined : headingLevel(index);
    if (!level) return true;
    let next = index + 1;
    while (next < lines.length && lines[next].trim() === '') next += 1;
    const nextLevel = next < lines.length && !isCode[next] ? headingLevel(next) : undefined;
    return next < lines.length && !(nextLevel && nextLevel <= level);
  });
}
