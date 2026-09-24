// =============================================================================
// Contenu du journal de démarrage
// -----------------------------------------------------------------------------
// Trois blocs de lignes, affichés l'un après l'autre :
//   1. les messages du noyau Linux (façon « dmesg »), avec leur horodatage ;
//   2. les services systemd « [  OK  ] », dont ceux de content/site.config.js ;
//   3. la connexion automatique de l'utilisateur.
//
// Chaque ligne est un petit objet ({ kind, … }) : sequence.js le transforme en
// élément HTML au moment de l'afficher.
// =============================================================================

import { site } from '../content.js';

// Messages du noyau : purement décoratifs, inspirés d'un vrai démarrage Linux
const KERNEL = [
  'Linux version 6.8.0-remios (remi@homelab) (gcc 13.2.0) #1 SMP PREEMPT_DYNAMIC',
  'Command line: BOOT_IMAGE=/vmlinuz-6.8.0-remios root=/dev/nvme0n1p2 ro quiet splash',
  'KERNEL supported cpus:',
  '  Intel GenuineIntel',
  '  AMD AuthenticAMD',
  'BIOS-provided physical RAM map:',
  'BIOS-e820: [mem 0x0000000000000000-0x000000000009ffff] usable',
  'BIOS-e820: [mem 0x0000000000100000-0x000000007fffffff] usable',
  'NX (Execute Disable) protection: active',
  'DMI: RémiOS Portfolio/BTS-SIO, BIOS 2026.09',
  'tsc: Detected 3600.000 MHz processor',
  'ACPI: Early table checksum verification disabled',
  'ACPI: RSDP 0x00000000000F05B0 000024 (v02 REMIOS)',
  'Zone ranges:',
  '  DMA      [mem 0x0000000000001000-0x0000000000ffffff]',
  '  DMA32    [mem 0x0000000001000000-0x00000000ffffffff]',
  'smpboot: Allowing 8 CPUs, 0 hotplug CPUs',
  'Memory: 16284112K/16777216K available',
  'rcu: Preemptible hierarchical RCU implementation.',
  'NR_IRQS: 524544, nr_irqs: 1032, preallocated irqs: 16',
  'Console: colour dummy device 80x25',
  'printk: console [tty0] enabled',
  'pid_max: default: 32768 minimum: 301',
  'LSM: initializing lsm=lockdown,capability,landlock,yama,apparmor',
  'smp: Bringing up secondary CPUs ...',
  'smp: Brought up 1 node, 8 CPUs',
  'devtmpfs: initialized',
  'NET: Registered PF_NETLINK/PF_ROUTE protocol family',
  'PCI: Using configuration type 1 for base access',
  'pci 0000:00:00.0: [8086:3e1f] type 00 class 0x060000',
  'pci 0000:00:02.0: [8086:3e92] type 00 class 0x030000',
  'pci 0000:00:14.0: [8086:a36d] type 00 class 0x0c0330',
  'pci 0000:00:1f.6: [8086:15bc] type 00 class 0x020000',
  'usbcore: registered new interface driver usbfs',
  'NET: Registered PF_INET protocol family',
  'TCP established hash table entries: 131072 (order: 8, 1048576 bytes)',
  'Freeing unused kernel image (initmem) memory: 4176K',
  'Run /init as init process',
  'nvme nvme0: 8/0/0 default/read/poll queues',
  ' nvme0n1: p1 p2 p3',
  'e1000e 0000:00:1f.6 eno1: Intel(R) PRO/1000 Network Connection',
  'EXT4-fs (nvme0n1p2): mounted filesystem with ordered data mode.',
  'systemd[1]: systemd 255 running in system mode',
  'systemd[1]: Detected architecture x86-64.',
  `systemd[1]: Hostname set to <${site.identite.machine}>.`,
];

// Lignes systemd communes à tout démarrage, avant les services personnels
const SYSTEM_UNITS = [
  { action: 'Started', unite: 'Journal Service' },
  { action: 'Mounted', unite: '/srv/realisations' },
  { action: 'Reached target', unite: 'Local File Systems' },
  { action: 'Started', unite: 'Network Manager' },
  { action: 'Reached target', unite: 'Network is Online' },
  { action: 'Started', unite: 'OpenSSH server daemon' },
];

// Lignes du noyau, avec un horodatage croissant « [    0.123456] »
export function kernelLines() {
  let seconds = 0;
  return KERNEL.map((text) => {
    seconds += Math.random() * 0.09;
    return { kind: 'kernel', ts: `[${seconds.toFixed(6).padStart(12, ' ')}]`, text };
  });
}

// Lignes systemd : services système, services de la configuration, veille, cibles finales
export function unitLines() {
  const ok = ({ action, unite, description }) => ({
    kind: 'unit',
    status: 'ok',
    before: `${action} `,
    unit: unite,
    after: description ? ` - ${description}.` : '.',
  });

  // Veille : [ WARN ] tant qu'aucun sujet n'est défini dans la configuration
  const { sujet } = site.veille;
  const veille = sujet
    ? ok({ action: 'Started', unite: 'veille-techno.service', description: sujet })
    : { kind: 'unit', status: 'warn', before: '', unit: 'veille-techno.service', after: ' : sujet non défini, démarrage différé.' };

  return [
    ...SYSTEM_UNITS.map(ok),
    ...site.boot.map(ok),
    veille,
    ok({ action: 'Started', unite: 'tableau-de-synthese.service' }),
    ok({ action: 'Reached target', unite: 'Portfolio BTS SIO' }),
    ok({ action: 'Reached target', unite: 'Multi-User System' }),
  ];
}

// Écran de connexion automatique (la commande tapée est ajoutée à part)
export function loginLines() {
  const { utilisateur, machine } = site.identite;
  const now = new Date().toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return [
    { kind: 'text', text: ' ' },
    { kind: 'text', text: `RémiOS 1.0 ${machine} tty1` },
    { kind: 'text', text: ' ' },
    { kind: 'text', text: `${machine} login: ${utilisateur} (connexion automatique)` },
    { kind: 'text', text: `Dernière connexion : ${now} sur tty1` },
  ];
}

export const COMMAND = 'portfolio --menu';

export function promptText() {
  const { utilisateur, machine } = site.identite;
  return `${utilisateur}@${machine}:~$ `;
}
