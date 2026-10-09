// =============================================================================
// Rappel de régularité des synthèses de veille
// -----------------------------------------------------------------------------
// Lancé chaque lundi après la collecte (.github/workflows/veille.yml). Pour
// chaque sujet de veille, la date de la dernière synthèse est lue dans son
// titre (« 19/01/2027 - … », format du tableau de bord). Si un sujet n'a
// aucune synthèse, ou rien depuis 21 jours :
//   - une issue GitHub « Veille : synthèses à écrire » est ouverte, avec une
//     mention du propriétaire du dépôt : GitHub le prévient par e-mail ;
//   - si elle est déjà ouverte, un commentaire la relance (nouvel e-mail).
// Quand tous les sujets sont à jour, l'issue est fermée.
//
// `node scripts/rappel-syntheses.mjs --essai` : affiche seulement le bilan.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const MAX_DAYS = 21; // au-delà, le sujet est en retard
const TITLE = 'Veille : synthèses à écrire';
const DASHBOARD = 'https://veille.remim.me';
const DAY = 24 * 60 * 60 * 1000;

// Texte de syntheses.md → date (AAAA-MM-JJ) de la synthèse la plus récente,
// d'après les titres « ## JJ/MM/AAAA … » hors commentaires ; null si aucune
export function lastSynthesisDate(markdown) {
  const visible = markdown.replace(/<!--[\s\S]*?-->/g, '');
  const dates = [...visible.matchAll(/^## .*?(\d{2})\/(\d{2})\/(\d{4})/gm)].map(([, d, m, y]) => `${y}-${m}-${d}`);
  return dates.sort().at(-1) ?? null;
}

// Bilan d'un sujet : { nom, derniere, jours, enRetard }
export function topicStatus(nom, markdown, today = new Date()) {
  const derniere = lastSynthesisDate(markdown);
  const jours = derniere ? Math.floor((Date.parse(today.toISOString().slice(0, 10)) - Date.parse(derniere)) / DAY) : null;
  return { nom, derniere, jours, enRetard: jours === null || jours > MAX_DAYS };
}

// Corps de l'issue : un sujet par ligne, ceux en retard d'abord
export function issueBody(statuses, owner) {
  const line = (s) =>
    s.derniere
      ? `- ${s.enRetard ? '⚠️' : '✅'} **${s.nom}** : dernière synthèse il y a ${s.jours} jour${s.jours > 1 ? 's' : ''} (${s.derniere.split('-').reverse().join('/')})`
      : `- ⚠️ **${s.nom}** : aucune synthèse pour l'instant`;
  return [
    `@${owner} une veille régulière se voit à l'oral : au moins une synthèse par sujet toutes les ${MAX_DAYS / 7} semaines.`,
    '',
    ...[...statuses].sort((a, b) => Number(b.enRetard) - Number(a.enRetard)).map(line),
    '',
    `À écrire depuis le tableau de bord : ${DASHBOARD}. Cette issue se ferme toute seule quand tous les sujets sont à jour (vérification chaque lundi).`,
  ].join('\n');
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { default: site } = await import(pathToFileURL(path.join(root, 'content/site.config.js')).href);
  const statuses = site.veille.sujets.map((s) => {
    const file = path.join(root, 'content/veille', s.id, 'syntheses.md');
    return topicStatus(s.nom, fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');
  });
  for (const s of statuses) console.log(`${s.enRetard ? '! ' : '  '}${s.nom} : ${s.derniere ?? 'aucune synthèse'}${s.jours !== null ? ` (il y a ${s.jours} j)` : ''}`);
  const late = statuses.filter((s) => s.enRetard);
  if (process.argv.includes('--essai')) return;

  const repository = process.env.GITHUB_REPOSITORY;
  const owner = process.env.GITHUB_REPOSITORY_OWNER ?? repository.split('/')[0];
  const github = async (method, url, body) => {
    const response = await fetch(`https://api.github.com/repos/${repository}${url}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`GitHub a répondu ${response.status} (${method} ${url}) : ${(await response.text()).slice(0, 200)}`);
    return response.json();
  };

  const open = (await github('GET', '/issues?state=open&per_page=100')).find((i) => i.title === TITLE && !i.pull_request);
  if (late.length && !open) {
    const issue = await github('POST', '/issues', { title: TITLE, body: issueBody(statuses, owner) });
    console.log(`Rappel ouvert : ${issue.html_url}`);
  } else if (late.length) {
    await github('PATCH', `/issues/${open.number}`, { body: issueBody(statuses, owner) });
    await github('POST', `/issues/${open.number}/comments`, {
      body: `@${owner} toujours à écrire : ${late.map((s) => s.nom).join(', ')}. ${DASHBOARD}`,
    });
    console.log(`Rappel relancé : ${open.html_url}`);
  } else if (open) {
    await github('POST', `/issues/${open.number}/comments`, { body: 'Tous les sujets ont une synthèse récente : rappel fermé.' });
    await github('PATCH', `/issues/${open.number}`, { state: 'closed', state_reason: 'completed' });
    console.log('Tous les sujets sont à jour : rappel fermé.');
  } else {
    console.log('Tous les sujets sont à jour.');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Rappel des synthèses : ${error.message}`);
    process.exit(1);
  });
}
