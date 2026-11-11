---
# Traduction anglaise de dashu.md. Seuls les champs traduits sont ici
# (titre, resume, statut) : les autres viennent du fichier français.
titre: "dashu — a self-hosted workspace"
statut: "v1 in service"
resume: "My all-in-one workspace: a dashboard, Markdown notes and my Pronote timetable, split across three spaces (Personal, School, Work). I wrote its specification, then deployed it on my Proxmox homelab, reachable at app.dashu.dev through a Cloudflare tunnel and through Tailscale, with a nightly backup checked by an actual restore."
---

## Context

Between my BTS (timetable on Pronote Campus), my work-study job at 1Life and my personal life, my notes, tasks and calendars were scattered across several apps. I wanted one place of my own, hosted at home: a kind of personal Microsoft 365, built to measure rather than an off-the-shelf dashboard.

I also turned it into a project-management exercise: write a real specification with testable acceptance criteria, have it built by an AI (Claude), and keep control of the choices, the deployment and the validation.

## Objectives

- A single way in: username and password, or a Google account. Sign-up is closed: only authorised addresses get in.
- Three spaces, Personal, School and Work: every note, task or calendar belongs to a space, and the Personal calendar brings together those of all spaces.
- Markdown notes with search, today's tasks, and the timetable imported from Pronote Campus.
- Fast (a mobile Lighthouse score of at least 95) and usable on a phone like an app.
- Hosted on my homelab, reachable from anywhere without opening a port on the home router.
- Easy to run: a nightly backup, checked by an actual restore, and an update in one command with an automatic rollback.

## Implementation

**The specification.** I wrote the specification: scope of version 1 and what it leaves out, technologies, data model, performance and security requirements, deployment, and 14 acceptance criteria. A tracking file states, for each criterion, whether it is verified, where and how, and lists the deviations from the specification with their reasons.

**The application.** A single program written in Rust, which builds the pages on the server; the htmx library keeps navigation smooth, without reloading the page. The data lives in an SQLite database, with full-text search. The timetable is synced every hour from the Pronote Campus iCal link. A JSON API, protected by a token, lets Hermès, my AI agent, manage my tasks and notes, and read my calendar.

**Security.**

- Passwords hashed with Argon2id, and at most 5 login attempts per minute from the same IP address.
- Google sign-in with OpenID Connect, using an OAuth client I created in the Google Cloud Console. An address that is not on the authorised list is refused.
- A strict Content Security Policy (CSP): no inline script or style. Note content is cleaned to prevent script injection.
- The service runs as an unprivileged system user, only listens on the machine itself (127.0.0.1) and sees the file system as read-only (systemd hardening).
- Hermès only has SSH access limited to six actions (status, logs, restart, update, update tracking, backup), enforced by a forced command.

**Deployment on my homelab.**

- A Debian 13 LXC container on Proxmox. dashu is compiled there and runs as a systemd service.
- A Cloudflare tunnel: the container opens an outgoing connection to Cloudflare, which publishes app.dashu.dev over HTTPS. No port is open on the home router. I moved the DNS of the dashu.dev domain to Cloudflare.
- Tailscale: a second way in, through my VPN, which works even if Cloudflare is down.
- dashu.dev shows a public page that presents the project (GitHub Pages).

**Operations.**

- A hot backup of the database every night at 3:30 a.m. (systemd timer), checked by SQLite and kept 14 days.
- dashu-restore puts a backup back into service: it first sets the current database aside, and rolls back by itself if dashu does not restart.
- dashu-update fetches the code, recompiles, backs up the database, replaces the program and checks that the service responds. If not, it puts the previous version back.
- On every change, GitHub Actions checks the formatting and quality of the code, runs 96 automated tests and builds a 7 MB Docker image.

**Project tracking.** After version 1, every change went through a pull request, tested before being merged: the API for Hermès, an overview of all calendars in the Personal space, navigation without a black flash, a "Dynamic Island" style space switcher with swipe-to-switch, a shortcut bar on phones, and installation as an app on the iPhone home screen.

Built with **Claude Code**. My role: define the need, make the choices and test. I did the deployment and operations myself on my server (Proxmox, Cloudflare, Tailscale, Google, backup and restore), guided step by step.

![Diagram of the dashu architecture: my computer and my iPhone reach dashu through the Cloudflare tunnel (app.dashu.dev, no open port) or through the Tailscale VPN. Hermès, my AI agent, goes through Tailscale for the JSON API and for SSH limited to six actions. On the Proxmox server, a Debian LXC container runs cloudflared and tailscale serve, which forward to dashu (Rust binary, systemd service), its SQLite database backed up every night, and the operations scripts.](schemas/dashu-architecture.svg "Architecture: two ways in without an open port, one LXC container on my homelab")

Source code: [github.com/moreauremi/dashu](https://github.com/moreauremi/dashu) · Project page: [dashu.dev](https://dashu.dev)

## Screenshots

Screenshots from 11 November 2026, taken on a copy of dashu filled with demo data (fake classes, fake notes). The last one is the real output of the restore on my server.

![Dashboard of the School space in dark theme: upcoming classes with times and rooms, today's tasks with one ticked, recent notes and a clock. At the top, the island with the three spaces, School selected.](captures/dashu/dashboard.webp "Dashboard of the School space: upcoming classes, today's tasks, recent notes")

![Calendar of the Personal space in light theme, week of 16 November: the School classes on Monday and Tuesday, the Work schedule from Wednesday to Friday, and personal appointments. Each event shows the name of its space.](captures/dashu/agenda-vue-ensemble.webp "Personal calendar: an overview of every space")

![Editor of the note "VLAN et trunk 802.1Q": Markdown on the left, the preview on the right with headings, a list, a block of Cisco commands and a table of VLANs, and the tags #bts and #réseau.](captures/dashu/editeur.webp "Markdown editor, with live preview and autosave")

![Command palette opened with Ctrl+K: searching for "vlan" finds the note "VLAN et trunk 802.1Q" in the School space, with the search word highlighted.](captures/dashu/palette.webp "Ctrl+K palette: search every note from the keyboard")

![Three iPhone screens in dark theme: the dashboard of the School space, the Personal calendar scrolling horizontally, and the list of notes with their tags. At the bottom, the shortcut bar: Dashboard, Notes, Agenda, Search.](captures/dashu/telephone.webp "On iPhone, as an app on the home screen: island at the top, shortcuts at the bottom")

![Server terminal: dashu-restore lists the backups from newest to oldest, then restores dashu-2026-11-11_183222.db. The current database is first backed up and checked, then the restore finishes and shows the command to roll back.](captures/dashu/restauration.webp "Restore drill on the server, 11 November 2026")

## Results and testing

- All 14 acceptance criteria of the specification are verified, most of them on the real server.
- 96 automated tests (sign-in, data isolation between two accounts, notes, reading the timetable including daylight saving time, API, script injection), run by GitHub Actions on every pull request.
- Mobile Lighthouse on the server, through Cloudflare, on simulated 4G: 99 for the dashboard, 100 for the notes, 100 for the calendar, 99 for the editor.
- The service uses 7.6 MB of memory and responds in 0.5 ms; the Docker image is 7 MB.
- Google sign-in tested with my account (the same as with my password) and with an unauthorised account, which is refused.
- Actual restore on 11 November 2026: a note created after the backup disappears when it is restored, then comes back when the restore is undone.
- I have used dashu every day since November 2026, on my computer and my iPhone.

## Difficulties encountered

**The site unreachable on my home Wi-Fi.** app.dashu.dev worked on 4G but not at home. The router's DNS was still holding an old answer, "this name does not exist", from before the domain moved to Cloudflare. I saw it by comparing the answers of the router's DNS and of Cloudflare's (1.1.1.1). On a Mac, nslookup queries the DNS server directly, whereas the browser goes through the system cache: dscacheutil showed me what the browser actually saw. Solution: my devices use the DNS servers set by Tailscale instead of the router's.

**An update that could be wrong.** Reviewing the update script revealed a flaw: if compilation failed, the source code was already up to date but the running program was not, and the next update replied "already up to date" without recompiling. Fix: the version actually in service is recorded separately, and the status command reports any mismatch.

**A backup that has never been restored proves nothing.** The backup ran every night, but nothing showed it could be put back. I did the drill on the server without losing anything: the current database is set aside before each restore, and a test note proves that the data really comes from the backup.

**Zoom on iPhone.** Added to the home screen, the app could be zoomed like a web page, and iOS has ignored the standard setting since iOS 10. Solution: a web app manifest, and pinch blocking only in app mode. In Safari, zoom is still possible, for accessibility.

**A skewed measurement.** The first Lighthouse run on the dashboard scored about 94, below the target: my browser extensions added work while the page loaded. I measured again three times in a Guest window, with no extensions: median of 99.

## Possible improvements

- Copy the backups to the server's second disk: they are currently on the same disk as the database, which does not protect against a disk failure.
- Monitor the service with Uptime Kuma, to be told when it goes down.
- Version 2: file storage and tools (PDF, conversion), planned in the roadmap of the specification.

## Skills applied

- **B1.1**: manage backups (checked nightly backup, actual restore); set up and check access levels (authorised addresses, API token, Hermès's SSH access limited to six actions); check service continuity (two ways in, automatic rollback of updates, /health check endpoint).
- **B1.4**: write a specification with acceptance criteria, split the work into pull requests, track progress criterion by criterion and analyse deviations from the specification.
- **B1.5**: carry out integration and acceptance testing (automated tests, criteria checked on the server, Lighthouse measurements), deploy the service (Proxmox, LXC, systemd, Cloudflare, Tailscale, DNS, Google OAuth) and document how to install and run it.
- **B1.6**: set up my personal work environment, with my classes, revision notes and timetable in one place, and use it every day.
