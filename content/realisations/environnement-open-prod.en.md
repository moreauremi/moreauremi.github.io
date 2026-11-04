---
# Traduction anglaise de environnement-open-prod.md. Seuls les champs
# traduits sont ici (titre, resume, statut) : les autres viennent du fichier
# français.
titre: "Open-Prod v10 environment: architecture and maintenance"
statut: "in progress"
resume: "Maintaining my training virtual machine at 1Life: an Ubuntu server running the Open-Prod 10.2 ERP, built on Odoo, with PostgreSQL and JasperReports. I update its components with 1Life's in-house tooling, synchronise the databases with the code, and duplicate or restore the demo databases."
---

## Context

Since September 2026, I have been a work-study ERP consultant at **1Life**, an integrator of the **Open-Prod** ERP within the Visiativ group. The first weeks are dedicated to training: learning Open-Prod on demo databases before working with customers. During this period I presented a purchase-to-sale flow, was trained in project-based management and prepared a production flow.

For this training, I have an **Ubuntu virtual machine** running a complete Open-Prod v10 installation. I administer it over **SSH** from my workstation, and use the ERP in the browser.

## Objectives

- Keep the environment up to date with the latest versions of Open-Prod and of 1Life's modules
- Bring the databases back in line with the code after each update
- Work on copies of the demo databases, and be able to return to a known state
- Understand how an Open-Prod installation is built, and what the commands I use really do

## Implementation

**The machine's architecture.** The virtual machine runs **Ubuntu 24.04** and brings together several building blocks:

- **Open-Prod 10.2 server**: the ERP itself, written in **Python** and built on **Odoo**, a widely used open-source ERP. It runs in the background as a **systemd** service, which can be started, stopped or queried.
- **PostgreSQL**: the database management system. Each database holds the data of a demo or training company (items, customers, orders, manufacturing orders…).
- **JasperReports**: the engine that produces printable documents, such as invoices and delivery notes.
- **MyFab tooling**: a set of **PHP** scripts developed by 1Life's dev team, used to install, update and configure everything else. Each terminal command (app-manager, sql-update, openprod-info…) is a shortcut to the same program, which runs the matching script.

![Architecture diagram of the Open-Prod v10 environment: from my Windows workstation, I administer the virtual machine over SSH and use Open-Prod in the browser. The Ubuntu 24.04 virtual machine runs the Open-Prod 10.2 server (Python, built on Odoo, systemd service), which stores its data in PostgreSQL (demo and training databases) and produces PDF documents with JasperReports. The MyFab tooling (1Life's PHP scripts, including app-manager and sql-update) drives the server and fetches updates from four Git repositories. Databases are duplicated, restored and imported from the browser.](schemas/openprod-architecture.svg "Architecture of my Open-Prod v10 environment (diagram in French)")

**Four components tracked with Git.** The installation relies on four **Git** repositories, each with its own version, which the openprod-info command displays:

- **Open-Prod**, the core of the ERP: version 10.2
- **MyFab modules**, 1Life's additions to Open-Prod: version 1.8.0
- **Jasper reports**, the printed document templates
- **MyFab scripts**, the installation and maintenance tooling: version 4.0.1

**Updating the environment.** I use the **app-manager** command, which manages seven components: Open-Prod, the MyFab modules and the customer-specific modules, Jasper and its reports, and the tooling itself. For each one, it detects whether it is installed, then offers to install, update or uninstall it, and runs the matching script. The update fetches the new version of the code from Git, with **Git LFS** for large files. When an update succeeds and the component requires it, app-manager then moves straight on to synchronising the databases.

**Synchronising the databases with the code (sql-update).** The new code sometimes expects tables or columns that do not exist yet in the databases. The sql-update command brings them back in line:

1. stopping the Open-Prod service, so that nobody changes the data during the operation;
2. choosing the databases to process: one, several or all;
3. recording the version of each repository in a log, to know afterwards which code each database was updated with;
4. for each database, updating all the modules: Odoo compares the code with the database, creates or alters the tables and columns, reloads the menus and screens, and replaces the translations;
5. restarting the service, then displaying any errors.

Despite its name, sql-update does not run hand-written SQL queries: Odoo translates the changes in the code into changes to the database. A database must be synchronised before it is used with a new version. Another script in the tooling can also record the branch and the latest commit of each repository in the database's system parameters: the version of the code can then be found from the database itself.

**Duplicating, restoring and importing databases.** From the web interface for managing databases, I duplicate the demo databases to work on a copy without damaging the original, restore a database to return to a known state, and import other demo and training databases.

## Results and testing

- The environment is up to date: Open-Prod 10.2, at the latest commit of 9 October 2026.
- The databases are used for my training: I presented a purchase-to-sale flow on them, and I am preparing a production flow.
- To check an update, I have three checks: openprod-info for the installed versions, the list of errors displayed at the end of sql-update, and the state of the Open-Prod service.
- openprod-info also reports a pending update of the MyFab tooling, which I will apply with my tutor's agreement.

## Difficulties encountered

**Understanding what the commands really did.** At first, I used the tooling's commands without knowing what was behind them. To understand, I first found where they were defined (they are terminal aliases), then read the scripts' code. That is how I discovered that Open-Prod is built on Odoo, and that sql-update does not run SQL but a module update.

## Possible improvements

- Write a "Updating an Open-Prod v10 test database" procedure, useful for future work-study students
- Document how Open-Prod v10 works, in Markdown, based on this machine
- Duplicate a database from the command line, to understand what the web interface does

## Skills applied

- Remote administration of a Linux server over SSH
- Managing an application's versions with Git
- Updating an ERP and synchronising its PostgreSQL databases
- Managing a service with systemd
- Duplicating, restoring and importing databases
- Reading and understanding administration scripts (Bash, PHP)
