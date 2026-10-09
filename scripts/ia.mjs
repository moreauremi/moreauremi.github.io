// =============================================================================
// Appel de l'IA, commun à la veille automatique (scripts/veille.mjs) et au
// tableau de bord des synthèses (dashboard/server.mjs)
// -----------------------------------------------------------------------------
// Le fournisseur et le modèle se règlent dans content/site.config.js
// (veille.ia). Le jeton est passé par l'appelant (variable d'environnement
// VEILLE_IA_CLE) ; il n'est jamais écrit dans le dépôt.
//
// En cas d'échec, une erreur est levée : l'appelant décide quoi en faire
// (arrêter la veille, ou afficher le message dans le tableau de bord).
// =============================================================================

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Consignes + données → objet JSON renvoyé par l'IA.
//   settings   : veille.ia de content/site.config.js (fournisseur, modele, url)
//   apiKey     : jeton de l'IA (sans jeton, Copilot CLI utilise le compte connecté)
//   attempts   : nombre d'essais en cas de surcharge ou d'erreur passagère
//   retryDelay : attente entre deux essais (ms)
//   timeout    : durée maximale d'une réponse (ms)
export async function askAi(system, user, { settings, apiKey, attempts = 3, retryDelay = 30_000, timeout = 300_000 }) {
  const options = { settings, apiKey, attempts, retryDelay, timeout };
  const content = settings.fournisseur === 'api' ? await askApi(system, user, options) : await askCopilot(system, user, options);
  // Réponse attendue : un objet JSON, parfois entouré de texte ou de ```json.
  // Copilot CLI coupe ses lignes à la largeur d'un terminal en remplaçant une
  // espace par un retour à la ligne, y compris au milieu d'un texte du JSON,
  // qui devient illisible : chaque retour à la ligne redevient une espace
  // (hors des textes, une espace ne change rien au JSON ; les vrais retours à
  // la ligne d'un texte sont écrits « \n » dans le JSON et ne sont pas touchés).
  const json = content
    .slice(content.indexOf('{'), content.lastIndexOf('}') + 1)
    .replace(/[ \t]*\r?\n[ \t]*/g, ' ');
  try {
    return JSON.parse(json);
  } catch {
    throw new Error(`réponse de l'IA illisible (JSON attendu) :\n${content.slice(0, 500)}`);
  }
}

// GitHub Copilot, par Copilot CLI en mode non interactif.
// Copilot CLI est un agent capable de lire des fichiers et de lancer des
// commandes : ici, il n'a droit à aucun outil (ni shell, ni écriture, ni
// serveur MCP) et travaille dans un dossier temporaire vide. Un texte piégé
// qui lui demanderait d'agir ne peut donc rien faire : seul son texte de
// réponse est utilisé, et il est vérifié ensuite.
async function askCopilot(system, user, options, attempt = 1) {
  const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'ia-'));
  const args = [
    '-p', `${system}\n\nDonnées (JSON) :\n${user}`,
    '--silent', // seulement la réponse, sans statistiques
    '--no-ask-user',
    '--available-tools=', // aucun outil
    '--deny-tool=shell',
    '--deny-tool=write',
    '--disable-builtin-mcps',
    '--no-custom-instructions',
    '--no-auto-update',
    '--stream', 'off',
    '-C', workdir,
  ];
  if (options.settings.modele) args.push('--model', options.settings.modele);

  const env = { ...process.env };
  if (options.apiKey) env.COPILOT_GITHUB_TOKEN = options.apiKey;
  let result;
  try {
    result = await run('copilot', args, env, options.timeout);
  } finally {
    fs.rmSync(workdir, { recursive: true, force: true });
  }
  const { code, stdout, stderr } = result;

  if (code !== 0 || !stdout.trim()) {
    const detail = `${stderr}\n${stdout}`.trim().slice(0, 800);
    if (attempt < options.attempts && /rate limit|429|timeout|ECONNRESET|5\d\d/i.test(detail)) {
      console.warn(`! Copilot indisponible (${detail.split('\n')[0]}), nouvel essai dans ${options.retryDelay / 1000} s.`);
      await new Promise((resolve) => setTimeout(resolve, options.retryDelay));
      return askCopilot(system, user, options, attempt + 1);
    }
    throw new Error(`Copilot CLI a échoué (code ${code}). Jeton absent, expiré ou sans la permission « Copilot Requests » ? Voir le README.\n${detail}`);
  }
  return stdout;
}

// Lance une commande et récupère sa sortie ; arrêtée au bout de `timeout` ms
function run(command, args, env, timeout) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    const timer = setTimeout(() => child.kill('SIGTERM'), timeout);
    child.on('error', (error) => {
      clearTimeout(timer);
      const hint = error.code === 'ENOENT' ? ' Copilot CLI est-il installé ? (npm install -g @github/copilot)' : '';
      reject(new Error(`impossible de lancer « ${command} » : ${error.message}.${hint}`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

// Autre fournisseur : API au format OpenAI (chat completions), réponse imposée
// en JSON. Nouvel essai en cas de surcharge (429) ou d'erreur serveur.
async function askApi(system, user, options, attempt = 1) {
  const { settings } = options;
  const response = await fetch(settings.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.apiKey}` },
    body: JSON.stringify({
      model: settings.modele,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(options.timeout),
  });

  if ((response.status === 429 || response.status >= 500) && attempt < options.attempts) {
    console.warn(`! l'IA a répondu ${response.status}, nouvel essai dans ${options.retryDelay / 1000} s.`);
    await new Promise((resolve) => setTimeout(resolve, options.retryDelay));
    return askApi(system, user, options, attempt + 1);
  }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    const hint = response.status === 404 ? ` Le modèle « ${settings.modele} » existe-t-il encore ? (veille.ia.modele)` : '';
    throw new Error(`l'IA a répondu ${response.status}.${hint}\n${detail}`);
  }

  return (await response.json()).choices?.[0]?.message?.content ?? '';
}
