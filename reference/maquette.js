// Comportement de la maquette validée au départ du projet
// (reference/maquette.html) : boot simulé, menu, rubriques.
// Fichier de référence, hors build : le site utilise src/.

(function(){
  const $ = s => document.querySelector(s);
  const grub = $('#grub'), boot = $('#boot'), tui = $('#tui'), skipBtn = $('#skip');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timers = [], done = false;

  /* ---------- Contenu du menu ---------- */
  const PH = t => '<span class="ph">[' + t + ']</span>';
  const sections = [
    { key:'1', label:'Présentation', title:'Présentation',
      html:'<h2>Qui je suis</h2><p>Étudiant en BTS SIO option SISR à MyDigitalSchool Nantes, en alternance chez 1Life, intégrateur ERP du groupe Visiativ spécialisé dans Open-Prod pour les PME industrielles.</p><p>' + PH('Deux ou trois phrases sur ton parcours et ce qui t\'attire dans l\'infra') + '</p>' },
    { key:'2', label:'Réalisations en entreprise', title:'Réalisations — 1Life',
      html:'<h2>En entreprise</h2><ul><li>' + PH('Réalisation pro 1 : contexte, mission, résultat') + '</li><li>' + PH('Réalisation pro 2') + '</li></ul><p>Chaque réalisation ouvre sa fiche : contexte, mise en œuvre, captures, compétences mobilisées.</p>' },
    { key:'3', label:'Projets personnels', title:'Projets perso',
      html:'<h2>Projets personnels</h2><ul><li><strong>Homelab multimédia</strong> : serveur Jellyfin auto-hébergé pour mes propres vidéos.</li><li><strong>NAS</strong> : ' + PH('ce que tu as mis en place') + '</li><li><strong>CAFFEIN</strong> : SaaS de facturation pour micro-entrepreneurs et artisans du BTP (projet annexe).</li><li><strong>Clapvoice</strong> : assistant vocal déclenché par un claquement de mains (projet annexe).</li></ul>' },
    { key:'4', label:'Tableau de synthèse', title:'Tableau de synthèse',
      html:'<h2>Tableau de synthèse E5</h2><p>Correspondance entre chaque réalisation et les compétences du référentiel.</p><p>' + PH('Lien vers le PDF téléchargeable') + '</p>' },
    { key:'5', label:'Veille technologique', title:'Veille',
      html:'<h2>Veille technologique</h2><p>Sujet : ' + PH('à définir') + '</p><p>' + PH('Sources suivies, outils de veille, synthèses mensuelles') + '</p>' },
    { key:'6', label:'CV et contact', title:'Contact',
      html:'<h2>CV et contact</h2><ul><li>GitHub : <a href="https://github.com/moreauremi" target="_blank" rel="noopener">github.com/moreauremi</a></li><li>LinkedIn : <a href="https://www.linkedin.com/in/remi-moreau-dubois" target="_blank" rel="noopener" title="Lien vers le compte LinkedIn de Rémi MOREAU">linkedin.com/in/remi-moreau-dubois</a></li><li>' + PH('Lien vers le CV en PDF') + '</li></ul>' }
  ];

  const menu = $('#menu');
  let sel = 0, view = 'home';
  sections.forEach((s,i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = '<span class="key">' + s.key + '</span><span>' + s.label + '</span>';
    b.addEventListener('click', () => { setSel(i); openSel(); });
    b.addEventListener('focus', () => setSel(i));
    menu.appendChild(b);
  });
  const items = [...menu.children];
  function setSel(i){ sel = (i + items.length) % items.length; items.forEach((b,j)=>b.classList.toggle('sel', j===sel)); }
  function openSel(){
    const s = sections[sel];
    $('#detail-title').textContent = '[ ' + s.title + ' ]';
    $('#detail-body').innerHTML = s.html;
    $('#home').style.display = 'none'; $('#detail').style.display = 'block';
    view = 'detail'; $('#back-btn').focus();
  }
  function back(){
    $('#detail').style.display = 'none'; $('#home').style.display = 'block';
    view = 'home'; items[sel].focus();
  }
  $('#open-btn').addEventListener('click', openSel);
  $('#back-btn').addEventListener('click', back);
  $('#reboot-btn').addEventListener('click', start);

  /* ---------- Journal de démarrage ---------- */
  const kernel = [
    'Linux version 6.8.0-remios (remi@homelab) (gcc 13.2.0) #1 SMP PREEMPT_DYNAMIC',
    'Command line: BOOT_IMAGE=/vmlinuz-6.8.0-remios root=/dev/nvme0n1p2 ro quiet splash',
    'KERNEL supported cpus:', '  Intel GenuineIntel', '  AMD AuthenticAMD',
    'BIOS-provided physical RAM map:',
    'BIOS-e820: [mem 0x0000000000000000-0x000000000009ffff] usable',
    'BIOS-e820: [mem 0x0000000000100000-0x000000007fffffff] usable',
    'NX (Execute Disable) protection: active',
    'DMI: RémiOS Portfolio/BTS-SIO, BIOS 2026.09',
    'tsc: Detected 3600.000 MHz processor',
    'ACPI: Early table checksum verification disabled',
    'ACPI: RSDP 0x00000000000F05B0 000024 (v02 REMIOS)',
    'Zone ranges:', '  DMA      [mem 0x0000000000001000-0x0000000000ffffff]', '  DMA32    [mem 0x0000000001000000-0x00000000ffffffff]',
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
    'systemd[1]: Hostname set to <remios>.'
  ];
  const services = [
    ['ok','Started <span class="hl">Journal Service</span>.'],
    ['ok','Mounted <span class="hl">/srv/realisations</span>.'],
    ['ok','Mounted <span class="hl">/srv/nas</span> - stockage réseau.'],
    ['ok','Reached target <span class="hl">Local File Systems</span>.'],
    ['ok','Started <span class="hl">Network Manager</span>.'],
    ['ok','Reached target <span class="hl">Network is Online</span>.'],
    ['ok','Started <span class="hl">OpenSSH server daemon</span>.'],
    ['ok','Started <span class="hl">bts-sio-sisr.service</span> - MyDigitalSchool Nantes.'],
    ['ok','Started <span class="hl">alternance@1life.service</span> - consultant ERP Open-Prod.'],
    ['ok','Started <span class="hl">jellyfin.service</span> - serveur multimédia.'],
    ['ok','Started <span class="hl">caffein.service</span> - SaaS de facturation.'],
    ['ok','Started <span class="hl">clapvoice.service</span> - écoute des claquements.'],
    ['warn','<span class="hl">veille-techno.service</span>: sujet non défini, démarrage différé.'],
    ['ok','Started <span class="hl">tableau-de-synthese.service</span>.'],
    ['ok','Reached target <span class="hl">Portfolio BTS SIO</span>.'],
    ['ok','Reached target <span class="hl">Multi-User System</span>.']
  ];

  function line(html){
    const d = document.createElement('div');
    d.innerHTML = html;
    boot.appendChild(d);
    while (boot.children.length > 400) boot.removeChild(boot.firstChild);
    boot.scrollTop = boot.scrollHeight;
  }
  function later(fn, ms){ timers.push(setTimeout(fn, ms)); }
  function clearTimers(){ timers.forEach(clearTimeout); timers = []; }

  function start(){
    clearTimers(); done = false;
    tui.style.display = 'none'; boot.innerHTML = '';
    if (reduce){ showTui(); return; }
    skipBtn.style.display = 'block';
    grub.style.display = 'flex'; boot.style.display = 'none';
    let n = 2; $('#count').textContent = n;
    later(()=>{ $('#count').textContent = 1; }, 700);
    later(runKernel, 1400);
  }

  function runKernel(){
    grub.style.display = 'none'; boot.style.display = 'block';
    let t = 0, ts = 0;
    kernel.forEach(k => {
      t += 14 + Math.random()*22;
      ts += Math.random()*0.09;
      const stamp = '[' + ts.toFixed(6).padStart(12,' ') + ']';
      later(() => line('<span class="k"><span class="ts">' + stamp + '</span> ' + k.replace(/</g,'&lt;') + '</span>'), t);
    });
    t += 250;
    services.forEach(([st,msg]) => {
      t += 60 + Math.random()*140;
      const tag = st === 'ok' ? '[  <span class="st ok">OK</span>  ] ' : '[ <span class="st warn">WARN</span> ] ';
      later(() => line(tag + msg), t);
    });
    t += 400;
    later(()=>line(' '), t);
    later(()=>line('RémiOS 1.0 remios tty1'), t+=60);
    later(()=>line(' '), t+=30);
    later(()=>line('remios login: remi (connexion automatique)'), t+=350);
    later(()=>line('Dernière connexion : aujourd\'hui sur tty1'), t+=250);
    later(()=>line('remi@remios:~$ portfolio --menu'), t+=500);
    later(showTui, t+=700);
  }

  function showTui(){
    clearTimers(); done = true;
    grub.style.display = 'none'; boot.style.display = 'none'; skipBtn.style.display = 'none';
    tui.style.display = 'block';
    $('#detail').style.display = 'none'; $('#home').style.display = 'block'; view = 'home';
    setSel(0); items[0].focus({preventScroll:true});
  }

  skipBtn.addEventListener('click', showTui);
  document.addEventListener('keydown', e => {
    if (!done){ if (e.key !== 'Tab') showTui(); return; }
    if (view === 'home'){
      if (e.key === 'ArrowDown'){ e.preventDefault(); setSel(sel+1); items[sel].focus(); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); setSel(sel-1); items[sel].focus(); }
      else if (/^[1-6]$/.test(e.key)){ setSel(+e.key-1); openSel(); }
    } else if (e.key === 'Escape' || e.key === 'Backspace'){ e.preventDefault(); back(); }
  });
  boot.addEventListener('click', () => { if (!done) showTui(); });
  grub.addEventListener('click', () => { if (!done) showTui(); });

  start();
})();
