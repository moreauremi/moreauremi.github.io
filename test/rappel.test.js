// Rappel de régularité des synthèses (scripts/rappel-syntheses.mjs) : `npm test`

import assert from 'node:assert/strict';
import test from 'node:test';
import { issueBody, lastSynthesisDate, topicStatus } from '../scripts/rappel-syntheses.mjs';

const TODAY = new Date('2026-11-02T06:00:00Z');
const FILE = `---
titre: Mes synthèses
---

<!--
  ## 19/01/2027 - exemple des consignes, ignoré
-->

## 05/10/2026 - Plus ancienne

Texte.

## 20/10/2026 : La plus récente

Texte.
`;

test('date de la dernière synthèse : lue dans les titres, hors commentaires', () => {
  assert.equal(lastSynthesisDate(FILE), '2026-10-20');
  assert.equal(lastSynthesisDate('---\ntitre: t\n---\n\nÀ venir.\n'), null);
});

test('en retard au-delà de 21 jours, ou sans aucune synthèse', () => {
  assert.deepEqual(topicStatus('A', FILE, TODAY), { nom: 'A', derniere: '2026-10-20', jours: 13, enRetard: false });
  assert.equal(topicStatus('B', FILE, new Date('2026-11-12T06:00:00Z')).enRetard, true);
  assert.equal(topicStatus('C', 'À venir.', TODAY).enRetard, true);
});

test('issue de rappel : mention du propriétaire, sujets en retard en tête', () => {
  const body = issueBody([topicStatus('À jour', FILE, TODAY), topicStatus('Vide', '', TODAY)], 'moreauremi');
  assert.match(body, /^@moreauremi /);
  assert.ok(body.indexOf('Vide') < body.indexOf('À jour'));
  assert.match(body, /aucune synthèse/);
  assert.match(body, /il y a 13 jours \(20\/10\/2026\)/);
});
