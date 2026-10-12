// =============================================================================
// Relais Gmail de la veille par e-mail (Google Apps Script)
// -----------------------------------------------------------------------------
// À copier dans un projet Apps Script de mon compte Google (script.google.com),
// voir le README, « Veille par e-mail ». Toutes les 10 minutes, check() :
//
//   1. liste les versions (releases) brouillons « Veille par e-mail du … » du dépôt du
//      site : une par semaine, créée par la veille du lundi ;
//   2. étape « a-envoyer » : envoie l'e-mail préparé dans le brouillon (le
//      premier ouvre un fil, les suivants y répondent), puis attend ma réponse ;
//   3. étape « attente » : si j'ai répondu dans le fil, range ma réponse dans
//      le brouillon et lance le workflow veille-mail.yml, qui la traite.
//
// Le relais ne fait rien d'autre : la lecture de ma réponse, l'IA et la
// publication se font dans GitHub Actions (scripts/veille-mail.mjs). Il ne lit
// que les fils qu'il a lui-même ouverts, et seulement mes propres messages.
//
// Propriétés du script (Paramètres du projet → Propriétés du script) :
//   GITHUB_TOKEN  jeton fine-grained limité au dépôt du site, permissions
//                 « Contents » et « Actions » en lecture et écriture
//   REPOSITORY    (facultatif) dépôt du site, moreauremi/moreauremi.github.io par défaut
// =============================================================================

/* exported install, check */

const PREFIX = 'veille-mail-';
const NAME = 'Veille par e-mail du ';
const WORKFLOW = 'veille-mail.yml';
const LABEL = 'Veille RémiOS'; // libellé Gmail des fils de la veille
const SENDER_NAME = 'RémiOS veille';
const STUCK_MINUTES = 45; // une tâche plus longue a échoué sans prévenir
const MAX_REPLY = 50000; // caractères gardés d'une réponse (citation comprise)

// À lancer une fois, à la main : vérifie le jeton, crée le déclencheur
// (toutes les 10 minutes) et fait une première vérification
function install() {
  const repository = github('GET', '');
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'check')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('check').timeBased().everyMinutes(10).create();
  console.log(`Relais installé pour ${repository.full_name} : vérification toutes les 10 minutes.`);
  check();
}

// Lancé toutes les 10 minutes
function check() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return; // la vérification précédente n'est pas finie
  try {
    // Brouillons des échanges, les plus anciens d'abord. Reconnus par leur tag,
    // ou par leur titre : GitHub remplace le tag d'un brouillon modifié par « untagged-… »
    const drafts = github('GET', '/releases?per_page=100').filter((release) => release.draft);
    const releases = drafts
      .filter((release) => release.tag_name.indexOf(PREFIX) === 0 || (release.name || '').indexOf(NAME) === 0)
      .reverse();
    console.log(`${drafts.length} brouillon(s) sur GitHub, dont ${releases.length} échange(s) en cours`);
    for (const release of releases) {
      try {
        handle(release);
      } catch (error) {
        console.error(`${release.name} : ${error.message}`);
      }
    }
  } finally {
    lock.releaseLock();
  }
}

function handle(release) {
  const state = JSON.parse(release.body);
  console.log(`${release.name} (n° ${release.id}) : étape « ${state.etape} », phase « ${state.phase} »`);
  if (state.etape === 'a-envoyer') return send(release, state);
  if (state.etape === 'attente') return waitForReply(release, state);
  if (state.etape === 'travail' && Date.now() - (state.lanceLe || 0) > STUCK_MINUTES * 60000) {
    // La tâche n'a jamais répondu (workflow désactivé, GitHub en panne…) :
    // je suis prévenu, et « réessaie » reprendra la même réponse
    state.etape = 'a-envoyer';
    state.derniereReponse = state.reponse;
    delete state.reponse;
    state.mail = {
      objet: 'Veille : erreur',
      texte: `Ta réponse n'a pas été traitée : la tâche GitHub Actions « Veille par e-mail » n'a pas répondu en ${STUCK_MINUTES} minutes.\n\nRéponds « réessaie » pour relancer avec la même réponse. Le détail est dans l'onglet Actions du dépôt.`,
      html: null,
    };
    save(release, state);
  }
}

// Envoie l'e-mail du brouillon, dans le fil de l'échange s'il existe
function send(release, state) {
  const options = { name: SENDER_NAME };
  if (state.mail.html) options.htmlBody = state.mail.html;
  const thread = state.fil ? GmailApp.getThreadById(state.fil) : null;
  let message;
  if (thread) {
    const messages = thread.getMessages();
    message = messages[messages.length - 1].createDraftReply(state.mail.texte, options).send();
  } else {
    const me = Session.getEffectiveUser().getEmail();
    message = GmailApp.createDraft(me, state.mail.objet, state.mail.texte, options).send();
  }

  // Bien visible dans la boîte de réception, et rangé sous un libellé
  const sent = message.getThread();
  sent.addLabel(GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL));
  sent.moveToInbox();
  sent.markUnread();

  console.log(`  e-mail envoyé : « ${message.getSubject()} »`);
  if (state.fin) {
    github('DELETE', `/releases/${release.id}`);
    console.log('  échange terminé : brouillon supprimé');
    return;
  }
  state.fil = sent.getId();
  state.vuLe = message.getDate().getTime();
  state.etape = 'attente';
  delete state.mail;
  save(release, state);
}

// Ma dernière réponse dans le fil, plus récente que le dernier message traité,
// est rangée dans le brouillon, puis le workflow est lancé
function waitForReply(release, state) {
  const thread = state.fil ? GmailApp.getThreadById(state.fil) : null;
  if (!thread) {
    console.log('  fil Gmail introuvable (supprimé ?)');
    return;
  }
  const me = Session.getEffectiveUser().getEmail().toLowerCase();
  // Messages arrivés après le dernier traité ; seuls les miens comptent
  const recent = thread.getMessages().filter((m) => !m.isDraft() && !m.isInTrash() && m.getDate().getTime() > state.vuLe);
  const replies = recent.filter((m) => m.getFrom().toLowerCase().indexOf(me) !== -1);
  console.log(`  fil « ${thread.getFirstMessageSubject()} » : ${thread.getMessageCount()} message(s), ${recent.length} nouveau(x), dont ${replies.length} de ${me}`);
  recent.filter((m) => replies.indexOf(m) === -1).forEach((m) => console.log(`  ignoré : message de ${m.getFrom()}`));
  if (replies.length === 0) return;

  const reply = replies[replies.length - 1];
  const previous = state.vuLe;
  state.reponse = reply.getPlainBody().slice(0, MAX_REPLY);
  state.vuLe = reply.getDate().getTime();
  state.etape = 'travail';
  state.lanceLe = Date.now();
  save(release, state);
  try {
    github('POST', `/actions/workflows/${WORKFLOW}/dispatches`, { ref: 'main', inputs: { demande: String(release.id) } });
  } catch (error) {
    // Workflow non lancé : la réponse sera reprise au prochain passage
    state.etape = 'attente';
    state.vuLe = previous;
    delete state.reponse;
    delete state.lanceLe;
    save(release, state);
    throw error;
  }
  reply.markRead();
  console.log('  réponse transmise : tâche GitHub « Veille par e-mail » lancée');
}

function save(release, state) {
  github('PATCH', `/releases/${release.id}`, { body: JSON.stringify(state) });
}

// API GitHub, sur le dépôt du site
function github(method, path, body) {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('propriété GITHUB_TOKEN absente (Paramètres du projet → Propriétés du script).');
  const repository = properties.getProperty('REPOSITORY') || 'moreauremi/moreauremi.github.io';

  const params = {
    method: method.toLowerCase(),
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
    muteHttpExceptions: true,
  };
  if (body) {
    params.contentType = 'application/json';
    params.payload = JSON.stringify(body);
  }
  const response = UrlFetchApp.fetch(`https://api.github.com/repos/${repository}${path}`, params);
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error(`GitHub a répondu ${status} (${method} ${path.split('?')[0] || '/'}) : ${response.getContentText().slice(0, 200)}`);
  }
  return status === 204 ? null : JSON.parse(response.getContentText());
}
