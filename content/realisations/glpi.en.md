---
# Traduction anglaise de glpi.md. Seuls les champs traduits sont ici
# (titre, resume, statut) : les autres viennent du fichier français.
titre: "GLPI — ticket management on a Debian server"
statut: "completed"
resume: "Installing GLPI 11 on a Debian 13 virtual machine (Apache, PHP-FPM, MariaDB), then handling tickets from start to finish: creation, qualification, prioritisation, solution, closure, knowledge base and statistics."
---

## Context

A BTS SIO lab in three steps: set up a server, install an IT service management tool on it, then use it the way an IT support team would. The chosen tool is **GLPI**, open-source software widely used in companies to inventory IT assets and track users' requests (tickets).

Everything happens in a lab: a VirtualBox virtual machine on my PC. Each step has its own documentation, written so that someone else can follow it step by step.

## Objectives

- Install a Debian 13 server in a virtual machine, ready for the lab.
- Install GLPI 11 on a LAMP stack (Apache, PHP, MariaDB), then secure it.
- Make GLPI reachable from the host PC's browser.
- Handle tickets from start to finish with three profiles: requester, technician and administrator.
- Prioritise several requests, feed the knowledge base and read the support statistics.

## 1. The Debian server

**The virtual machine.** A Debian 13 netinst image (amd64, about 700 MB), downloaded from debian.org. In VirtualBox, a "debian-glpi" VM: 4 GB of memory, 2 processors, a 20 GB virtual disk, no EFI. VirtualBox's unattended installation is turned off: otherwise, it picks the account, the packages and the desktop on its own.

**Networking, before the first boot.** The network card stays in NAT mode: the VM can reach the internet, but the host PC cannot reach it. So I added a port forwarding rule: port 8080 on the host PC leads to port 80 on the VM. That is how GLPI will be opened in the browser.

**Installing Debian**, with the installer:

- French language, country and keyboard, machine name debian-glpi;
- a root password: in that case, Debian does not install sudo, and administration is done as root with "su -" (left empty, the root account would be disabled and the first user would get sudo);
- guided partitioning, the whole disk in a single partition;
- the deb.debian.org mirror in France, the GRUB boot loader on the disk;
- in the software selection, the standard system utilities and the KDE Plasma desktop, without GNOME, which is heavier.

**First steps**: a full system update (apt update, then apt upgrade), and a check that the VM has an IP address (ip a).

![Debian 13 installer menu: Graphical install, Install, Advanced options, Help…](captures/glpi/installateur-debian.webp "The Debian 13 installer, when the VM boots")

![Installer software selection: Debian desktop environment, KDE Plasma and standard system utilities ticked, GNOME and the other desktops unticked](captures/glpi/selection-logiciels.webp "Software selection: KDE Plasma and the standard utilities")

![Konsole terminal as root on the VM: apt update and apt upgrade, the trixie and trixie-security repositories are up to date, no package to upgrade](captures/glpi/mise-a-jour-debian.webp "System up to date, on the Debian 13 (trixie) repositories")

Full documentation: [Installing Debian 13 on VirtualBox](docs/glpi/installation-debian-virtualbox.pdf) (PDF in French, 4 pages).

## 2. Installing GLPI

**GLPI 11 requirements**: Apache 2.4, PHP 8.2 or later (Debian 13 ships PHP 8.4), MariaDB 10.6 or MySQL 8.0 or later. A VM snapshot is taken before starting, then another just before the web installation: if something goes wrong, rolling back takes a few seconds.

**The packages**: Apache, MariaDB, PHP as PHP-FPM, and the PHP extensions GLPI requires (curl, gd, intl, mbstring, xml, zip, bz2, ldap, bcmath). bcmath and mbstring became mandatory with GLPI 11.

**The database.**

- MariaDB is first secured with mariadb-secure-installation.
- GLPI has its own database, glpi, in utf8mb4 (every character, accents and emojis included), and its own account, glpi, which can only connect from the machine itself and only has rights on this database.
- This account is also allowed to read MariaDB's time zone table, which I loaded from the system's time zones: without it, GLPI shows a warning during installation.

**GLPI itself**: version 11.0.8, downloaded from the releases published on GitHub, unpacked into /var/www/glpi, and handed over to Apache's user (www-data).

**Apache.** A virtual host dedicated to GLPI:

- its document root is **/var/www/glpi/public**, not the whole GLPI folder: the configuration and the rest of the code cannot be reached from the browser;
- rewrite rules send every address to index.php, GLPI 11's entry point, and pass on the authorisation header;
- PHP files are handed to PHP-FPM, through its socket.

This requires enabling the rewrite, proxy_fcgi and setenvif modules, enabling the GLPI site and disabling Apache's default site.

**PHP**: the session cookie is protected from being read by JavaScript (session.cookie_httponly), which GLPI checks during installation, then PHP-FPM is restarted.

**Checks before the web installation**: Apache's configuration is valid (apache2ctl configtest answers "Syntax OK") and PHP-FPM is running.

**The web installation**, from the host PC's browser (at localhost:8080, thanks to port forwarding): language, licence, requirements check, connection to the database with the glpi account, then database initialisation.

**After the installation.** GLPI creates four default accounts (glpi as Super-Admin, tech as Technician, normal and post-only), with passwords everybody knows. The procedure ends with hardening: changing these passwords or disabling the unused accounts (GLPI keeps reminding you until it is done), and deleting the installation file, which would allow GLPI to be reinstalled on top.

The documentation also has a troubleshooting table (forgotten SQL password, page unreachable from the PC, Apache error…) and an appendix on giving sudo rights to a user.

![Host PC's browser on localhost:8080: the "GLPI Installation" page, with the "Go to the installation page" button](captures/glpi/installation-web.webp "GLPI reached from the host PC, thanks to forwarding port 8080 to the VM")

![GLPI's "Log in to your account" page: login glpi, hidden password, login source GLPI internal database](captures/glpi/connexion.webp "First login, with the administrator account")

![GLPI dashboard right after installation: counters at zero, 4 users, 2 tickets, and a banner asking to change the default passwords of the glpi, post-only, tech and normal accounts](captures/glpi/tableau-de-bord.webp "After installation: GLPI reminds you to change the default passwords")

Full documentation: [Installing GLPI 11 on Debian 13](docs/glpi/installation-glpi-debian.pdf) (PDF in French, 8 pages).

## 3. Using GLPI

The lab simulates a complete IT support desk, with three accounts:

| Account | Profile | Role in the lab |
|---|---|---|
| post-only | Self-Service | Requester |
| tech | Technician | Ticket handling |
| glpi | Super-Admin | Preparation |

**Preparation.** A fresh installation has no ticket categories. I created Hardware (with Peripherals below it), Network, Software, Servers and Security, then checked that the priority matrix was the default one.

**A ticket's life cycle.** A ticket goes through six statuses: New, Processing (assigned), Processing (planned), Pending, Solved and Closed. To follow them:

1. **Creation**: an "External screen not detected" incident, with its category and urgency. The ticket arrives with the New status: nobody is assigned to it yet.
2. **Follow-up**: information added to the ticket (the problem persists with another cable). The History tab records every change: who, when, which field, old and new value.
3. **Taking charge**: the technician assigns the ticket to themselves, and it automatically becomes "Processing (assigned)". It would become "Processing (planned)" if a dated task were added.
4. **Qualification**: the technician fills in the impact. GLPI calculates the priority with a matrix that crosses urgency (given by the requester) and impact: medium urgency and low impact give a low priority. The "Major" priority is outside the matrix: it can only be set by hand.
5. **Solution**: a follow-up, then the solution, and the ticket becomes Solved.
6. **Closure**: the requester approves the solution, and the ticket becomes Closed, as ITIL recommends. If the requester refuses it, the ticket is reopened. Without an answer, GLPI closes it automatically after the delay set in the entity.

**Several tickets at once.** Four requests, created by the technician: Wi-Fi unreachable, software installation, file server unreachable and licence renewal. The order chosen:

1. the file server: very high priority, several users blocked;
2. the Wi-Fi: same priority as the licence, but it is an incident blocking someone right now, and it came in first;
3. the licence;
4. the software installation, a simple comfort request.

The calculated priority is not always enough: for the licence, it is medium, but if it is the antivirus licence that is expiring, the whole fleet loses its protection. The real impact is higher, and the ticket deserves a due date.

**Incidents and problems.** If several tickets report the same failure, you create a "problem" from one of them and link the others to it: the incident is about restoring the service as fast as possible, the problem about finding the cause so that the failure does not come back. Identical tickets can also be linked as duplicates.

**Knowledge base.** A procedure for reconnecting to the company Wi-Fi, published in the FAQ, visible to users. It helps capitalise on solutions, resolve faster at first level, give consistent answers across technicians, and avoid tickets: users find the answer themselves.

**Statistics.** Three useful indicators for running a support desk: the average time to take a ticket into account (responsiveness), the average resolution time and the number of overdue tickets (efficiency, meeting commitments), and user satisfaction, when surveys are enabled.

![Form of the "External screen not detected" ticket: type Incident, category Hardware > Peripheral, status Processing (assigned), urgency Medium, impact Low, priority Low](captures/glpi/qualification-ticket.webp "Qualification: medium urgency and low impact give a low priority")

![The ticket's timeline: the incident description, a follow-up "the problem also persists with another HDMI cable", then the solution "Graphics driver updated and tested with a second HDMI cable: the problem is solved"](captures/glpi/suivi-et-solution.webp "The ticket's timeline: description, follow-up, then solution")

![The lab's ticket list: Wi-Fi unreachable and File server unreachable closed, Licence renewal and Software installation new, External screen not detected closed, each with its priority](captures/glpi/liste-des-tickets.webp "The scenario's tickets, with their status and priority")

![Ticket statistics: curves of the number of tickets opened, solved and closed, then of the average closing and resolution times, in hours](captures/glpi/statistiques.webp "Support statistics: number of tickets and average times")

Full documentation: [GLPI lab: using GLPI and managing tickets](docs/glpi/tp-glpi-tickets.pdf) (PDF in French, 10 pages, with my answers to the lab questions).

## Results and testing

- Debian 13 installed and up to date, reachable from the host PC through port forwarding.
- Checks before the web installation: Apache's configuration verified (apache2ctl configtest, "Syntax OK") and PHP-FPM running.
- GLPI 11 installed, all requirements green, and reachable from the host PC at localhost:8080.
- A ticket's complete life cycle was checked: New, Processing (assigned), Solved, then Closed after the requester's approval.
- Three tickets were handled through to closure: the external screen, then, in order of priority, the file server and the Wi-Fi.
- A procedure is published in the knowledge base, visible in the users' FAQ.

## Difficulties encountered

**Reaching the VM from the host PC.** In NAT mode, the host PC cannot see the virtual machine. Solution: forwarding the host's port 8080 to the VM's port 80, in VirtualBox's network settings.

**MariaDB's root account rejected by GLPI.** On Debian, root connects to MariaDB through the system socket, not with a password. That is normal, and safer: GLPI uses its own account, which only has rights on its database.

**A lab written for GLPI 10.** GLPI 11 redesigned the requesters' interface: a tiled home page, tickets created from a service catalogue. Each step had to be found again in the new interface; the documentation gives both paths.

**A fresh installation is empty.** Without ticket categories, the scenario could not start: they had to be created first, with the administrator account.

## Skills applied

- Installing a Linux server (Debian 13) in a virtual machine, NAT networking and port forwarding
- Installing and configuring a LAMP stack: Apache (virtual host), PHP-FPM, MariaDB
- Securing a service: dedicated database account, restricted web root, default passwords and installation file
- Snapshots before each risky step
- Managing incidents and requests according to ITIL: qualification, prioritisation, resolution, closure, incidents and problems
- Profiles and rights in GLPI: requester, technician, administrator
- Knowledge base and support indicators
- Writing step-by-step technical documentation
