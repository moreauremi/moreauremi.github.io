// Veille par e-mail (scripts/veille-mail.mjs) : `npm test`
// Lecture de mes réponses, format des synthèses, et un échange complet avec
// une IA et une publication simulées.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  announcement,
  checkDraft,
  cleanReply,
  insertSynthesis,
  parseChoices,
  parseValidation,
  ReplyError,
  respond,
  withSources,
} from '../scripts/veille-mail.mjs';

const TOPICS = [
  { id: 'cybersecurite', nom: 'Cybersécurité' },
  { id: 'virtualisation', nom: 'Virtualisation' },
];
const news = (id, titre) => ({ id, titre, source: 'IT-Connect', date: '2026-10-08', url: `https://exemple.fr/${id}`, resume: `Résumé de ${titre}.` });
const STATE = announcement(
  [
    { topic: TOPICS[0], items: [news('a1', 'Faille <Atlassian>'), news('a2', 'ClickFix'), news('a3', 'NIS2')] },
    { topic: TOPICS[1], items: [news('b1', 'Proxmox 9')] },
  ],
  '2026-10-12',
);
const AVIS = "NIS2 va coûter cher aux PME, mais beaucoup moins qu'une attaque.";

// Réponse écrite dans Gmail : citation du message précédent en dessous
const QUOTED = `

Le lun. 12 oct. 2026 à 07:30, RémiOS veille <moi@gmail.com>
a écrit :

> 4 nouvelles actualités cette semaine.
> 1 : ne doit pas être lu
`;

test("e-mail du lundi : actualités numérotées d'un sujet à l'autre, texte des flux échappé", () => {
  assert.deepEqual(STATE.actualites.map((a) => [a.n, a.sujet]), [[1, 'cybersecurite'], [2, 'cybersecurite'], [3, 'cybersecurite'], [4, 'virtualisation']]);
  assert.equal(STATE.phase, 'choix');
  assert.equal(STATE.etape, 'a-envoyer');
  assert.match(STATE.mail.objet, /^Veille du 12\/10\/2026 : 4 actualités/);
  assert.match(STATE.mail.texte, /\[4\] Proxmox 9/);
  // Exemple de réponse avec les numéros de la semaine, du même sujet
  assert.match(STATE.mail.texte, /^ {2}1, 2 : ce que j'en retiens/m);
  assert.match(STATE.mail.texte, /^ {2}4 : …$/m);
  assert.ok(STATE.mail.html.includes('Faille &lt;Atlassian&gt;') && !STATE.mail.html.includes('<Atlassian>'));
});

test('réponse : sans la citation du message précédent ni la signature', () => {
  assert.equal(cleanReply(`1, 3 : ${AVIS}\r\n\r\nEnvoyé de mon iPhone${QUOTED}`), `1, 3 : ${AVIS}`);
  assert.equal(cleanReply('ok\n\nOn Mon, Oct 12, 2026 at 7:30 AM Moi <moi@gmail.com> wrote:\n> texte'), 'ok');
  assert.equal(cleanReply('ok\n-- \nRémi'), 'ok');
});

test('choix : une synthèse par ligne de numéros, avis sur plusieurs lignes', () => {
  const reply = `Salut,\n\n1, 3 : ${AVIS}\nEt chez 1Life, on le voit déjà.\n\n4 — Proxmox devient une vraie alternative à VMware pour nos clients.${QUOTED}`;
  assert.deepEqual(parseChoices(reply, STATE.actualites), {
    syntheses: [
      { sujet: 'cybersecurite', numeros: [1, 3], avis: `${AVIS}\nEt chez 1Life, on le voit déjà.` },
      { sujet: 'virtualisation', numeros: [4], avis: 'Proxmox devient une vraie alternative à VMware pour nos clients.' },
    ],
  });
  assert.deepEqual(parseChoices(`[1] et [2] : ${AVIS}`, STATE.actualites).syntheses[0].numeros, [1, 2]);
  assert.deepEqual(parseChoices(`rien cette semaine${QUOTED}`, STATE.actualites), { rien: true });
});

test("choix : une réponse mal formée est expliquée, jamais devinée", () => {
  const error = (reply, pattern) => assert.throws(() => parseChoices(reply, STATE.actualites), (e) => e instanceof ReplyError && pattern.test(e.message));
  error(`3, 4 : ${AVIS}`, /pas du même sujet/);
  error(`9 : ${AVIS}`, /numéro 9 inconnu/);
  error('1 : bof', /trop court/);
  error("J'ai tout lu, c'était bien.", /aucune ligne/);
  // Une année en début de ligne n'est pas un numéro d'actualité
  assert.equal(parseChoices(`1 : ${AVIS}\n2026 : année de la réforme.`, STATE.actualites).syntheses.length, 1);
});

test('relecture : « ok » publie, « annule » abandonne, le reste corrige', () => {
  assert.deepEqual(parseValidation(`OK !${QUOTED}`, 2), { action: 'publier', numeros: [] });
  assert.deepEqual(parseValidation('oui, publie la 2', 2), { action: 'publier', numeros: [2] });
  assert.deepEqual(parseValidation('annule', 2), { action: 'annuler' });
  assert.deepEqual(parseValidation('2 : enlève la dernière phrase', 2), { action: 'corriger', cible: 1, texte: 'enlève la dernière phrase' });
  assert.deepEqual(parseValidation('ok mais raccourcis le titre', 1), { action: 'corriger', cible: null, texte: 'ok mais raccourcis le titre' });
  assert.deepEqual(parseValidation('non, change le titre', 1).action, 'corriger');
  assert.throws(() => parseValidation('ok 3', 2), ReplyError);
});

test("synthèse de l'IA : sans date dans le titre, sans « ## » ni bloc Sources dans le texte", () => {
  const draft = checkDraft({ titre: '« 12/10/2026 - NIS2 arrive chez les PME. »', texte: `## Contexte\n\n${AVIS}\n\n**Sources**\n\n- [x](https://x.fr)` });
  assert.deepEqual(draft, { titre: 'NIS2 arrive chez les PME', texte: `### Contexte\n\n${AVIS}` });
  assert.throws(() => checkDraft({ titre: 'Titre', texte: '' }));
});

test('publication : synthèse en tête, Sources au format du tableau de bord, pas de doublon', () => {
  const file = '---\ntitre: Mes synthèses\n---\n\n<!--\n  ## 19/01/2027 - exemple des consignes\n-->\n\nÀ venir.\n';
  const texte = withSources(AVIS, [STATE.actualites[0]]);
  assert.equal(texte, `${AVIS}\n\n**Sources**\n\n- [Faille <Atlassian>](https://exemple.fr/a1) (IT-Connect, 8 octobre 2026)`);

  const once = insertSynthesis(file, { titre: '12/10/2026 - Premier', texte });
  assert.ok(!once.includes('À venir.'));
  assert.ok(once.includes('## 19/01/2027 - exemple des consignes'), 'consignes intactes');
  const twice = insertSynthesis(once, { titre: '19/10/2026 - Second', texte: 'Autre texte.' });
  assert.ok(twice.indexOf('## 19/10/2026 - Second') < twice.indexOf('## 12/10/2026 - Premier'));
  assert.equal(insertSynthesis(twice, { titre: '20/10/2026 - Premier', texte }), null);
});

test('échange complet : avis → relecture → correction → publication', async () => {
  const calls = { write: [], publish: [] };
  const deps = {
    write: async (request) => {
      calls.write.push(request);
      return { titre: request.correction ? 'Titre corrigé' : 'Titre', texte: `Synthèse : ${request.avis}` };
    },
    publish: async (brouillons, day) => {
      calls.publish.push(brouillons);
      return brouillons.map((b) => ({ sujet: b.sujet, titre: `12/10/2026 - ${b.titre}`, commit: `https://github.com/commit/${day}` }));
    },
  };
  const reply = (state, text) => ({ ...state, etape: 'travail', reponse: `${text}${QUOTED}` });

  const [drafted, ok1] = await respond(reply(STATE, `1, 3 : ${AVIS}\n4 : Proxmox devient une vraie alternative à VMware.`), deps, '2026-10-12');
  assert.ok(ok1);
  assert.equal(drafted.phase, 'validation');
  assert.equal(drafted.etape, 'a-envoyer');
  assert.equal(drafted.brouillons.length, 2);
  assert.equal(calls.write[0].items.length, 2);
  assert.match(drafted.mail.texte, /Synthèse 1\/2 · Cybersécurité/);
  assert.match(drafted.mail.texte, /12\/10\/2026 - Titre/);

  const [corrected] = await respond(reply(drafted, '2 : plus court'), deps, '2026-10-12');
  assert.deepEqual(corrected.brouillons.map((b) => b.titre), ['Titre', 'Titre corrigé']);
  assert.equal(calls.write.at(-1).correction, 'plus court');

  const [done] = await respond(reply(corrected, 'ok 1'), deps, '2026-10-12');
  assert.equal(done.fin, true);
  assert.equal(calls.publish[0].length, 1);
  assert.match(calls.publish[0][0].texte, /\*\*Sources\*\*\n\n- \[Faille/);
  assert.match(done.mail.texte, /C'est publié/);
});

test("échange : réponse non comprise ou panne de l'IA → e-mail d'explication, même phase", async () => {
  const deps = {
    write: async () => {
      throw new Error('Copilot CLI a échoué (code 1).\ndétail privé');
    },
  };
  const [misunderstood, ok1] = await respond({ ...STATE, etape: 'travail', reponse: 'merci !' }, deps);
  assert.ok(ok1);
  assert.equal(misunderstood.phase, 'choix');
  assert.match(misunderstood.mail.texte, /pas compris/);

  const [failed, ok2] = await respond({ ...STATE, etape: 'travail', reponse: `1 : ${AVIS}` }, deps);
  assert.equal(ok2, false);
  assert.equal(failed.phase, 'choix');
  assert.ok(failed.mail.texte.includes('Copilot CLI a échoué') && !failed.mail.texte.includes('détail privé'));
  assert.equal(failed.derniereReponse, `1 : ${AVIS}`);

  // « réessaie » reprend la réponse précédente
  const retried = await respond({ ...failed, etape: 'travail', reponse: 'réessaie' }, { write: async () => ({ titre: 'T', texte: 'x'.repeat(50) }) });
  assert.equal(retried[0].phase, 'validation');
});
