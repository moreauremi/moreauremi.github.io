// =============================================================================
// Sons de démarrage, générés avec la Web Audio API
// -----------------------------------------------------------------------------
// Aucun fichier audio : chaque son est fabriqué à la volée par le navigateur.
//   - bip POST : le bip unique du BIOS quand l'ordinateur démarre bien
//     (oscillateur carré à 1 000 Hz) ;
//   - clics de disque dur pendant le journal (bruit très court, filtré) ;
//   - bip de validation à l'ouverture d'une rubrique ;
//   - petite fanfare (composition originale) pour l'easter egg du terminal.
//
// Règles :
//   - sons COUPÉS par défaut ; le choix du visiteur est mémorisé (localStorage) ;
//   - aucun son avant une interaction : les navigateurs interdisent de jouer du
//     son tant que le visiteur n'a ni cliqué ni appuyé sur une touche. Le
//     « contexte audio » n'est donc créé qu'à ce moment-là. Conséquence : au tout
//     premier chargement, le bip POST ne peut pas sonner ; il sonne sur
//     <Redémarrer>, ou dès que le son est activé pendant le boot.
// =============================================================================

import { readSetting, writeSetting } from '../utils/storage.js';

const STORAGE_KEY = 'remios:sons';

export function createSounds() {
  let enabled = readSetting(STORAGE_KEY, 'off') === 'on';
  let context = null; // contexte audio, créé à la première interaction
  let noise = null; // bruit blanc réutilisé pour les clics de disque
  let lastDiskClick = 0;
  const listeners = new Set();

  // Crée (ou réveille) le contexte audio. À n'appeler que pendant une action
  // du visiteur (clic, touche), sinon le navigateur le laisse muet.
  function ensureContext() {
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return; // navigateur sans Web Audio : pas de son
      context = new AudioContextClass();
    }
    if (context.state === 'suspended') context.resume();
  }

  // Appelée à chaque clic ou touche : prépare le son si le visiteur l'a activé
  function unlock() {
    if (enabled) ensureContext();
  }

  function canPlay() {
    return enabled && context !== null && context.state !== 'closed';
  }

  // Note simple : oscillateur + enveloppe de volume. Le volume descend en
  // courbe jusqu'à presque zéro, ce qui évite un « clac » à la coupure.
  // `delay` : décalage en secondes, pour enchaîner plusieurs notes.
  function tone(frequency, duration, type, volume, delay = 0) {
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  // Bip POST du BIOS
  function post() {
    if (canPlay()) tone(1000, 0.18, 'square', 0.04);
  }

  // Petit clic de tête de lecture : 12 ms de bruit, qui s'éteint très vite,
  // passé dans un filtre pour lui donner un timbre « mécanique ».
  function disk() {
    if (!canPlay()) return;
    const now = context.currentTime;
    if (now - lastDiskClick < 0.06) return; // au plus un clic toutes les 60 ms
    lastDiskClick = now;

    if (!noise) {
      const length = Math.floor(context.sampleRate * 0.012);
      noise = context.createBuffer(1, length, context.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }

    const source = context.createBufferSource();
    source.buffer = noise;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2500 + Math.random() * 1500; // chaque clic un peu différent
    const gain = context.createGain();
    gain.gain.value = 0.3;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  }

  // Bip de validation (ouverture d'une rubrique)
  function select() {
    if (canPlay()) tone(880, 0.06, 'triangle', 0.08);
  }

  // Fanfare de l'easter egg « starwars » : simple arpège de do majeur
  // (sol, do, mi, puis accord tenu). Composition originale, sans rapport avec
  // la musique des films, qui est protégée par le droit d'auteur.
  function fanfare() {
    if (!canPlay()) return;
    const notes = [
      // [fréquence en Hz, départ en s, durée en s]
      [196, 0, 0.22], // sol
      [262, 0.25, 0.22], // do
      [330, 0.5, 0.22], // mi
      [392, 0.75, 1.6], // sol aigu, tenu…
      [262, 0.75, 1.6], // … avec do et mi : accord de do majeur
      [330, 0.75, 1.6],
    ];
    for (const [frequency, start, duration] of notes) {
      tone(frequency, duration, 'triangle', 0.06, start);
    }
  }

  // Bouton haut-parleur : active ou coupe, et mémorise le choix
  function toggle() {
    enabled = !enabled;
    writeSetting(STORAGE_KEY, enabled ? 'on' : 'off');
    if (enabled) {
      ensureContext(); // on est dans un clic : le navigateur l'autorise
      select(); // petit bip pour confirmer que le son marche
    }
    listeners.forEach((listener) => listener(enabled));
  }

  return {
    post,
    disk,
    select,
    fanfare,
    toggle,
    unlock,
    isEnabled: () => enabled,
    onChange: (listener) => listeners.add(listener),
  };
}
