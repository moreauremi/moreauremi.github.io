---
# Traduction anglaise de portfolio-remios.md. Seuls les champs traduits sont
# ici (titre, resume, statut) : les autres viennent du fichier français.
titre: "RémiOS portfolio — online presence"
statut: "online, evolving"
resume: "This portfolio, designed like a Linux system: a static website published on GitHub Pages under its own domain name, indexed and measured without cookies, with an automated technology watch and a dashboard for writing my syntheses."
---

## Context

The E5 exam of the BTS SIO requires a portfolio presenting my projects and the skills of the framework. Rather than a ready-made template, I wanted a website that reflects the SISR option: RémiOS imitates a Linux system booting (GRUB screen, systemd log), then shows a whiptail-style menu, with a hidden terminal.

It is also my online presence as a candidate: the jury, recruiters and my LinkedIn contacts reach it through my own domain name, remim.me.

## Objectives

- Present my background, my projects and my skills, with a quick, plain and printable view for the jury.
- Publish a public website that is fast, accessible, secure and well indexed, with no server to administer.
- Make it easy to update: each page is a Markdown file, published automatically.
- Keep a regular technology watch on three topics, and measure the site's traffic in line with the GDPR.

## Implementation

**The website.** It is static and built with Vite. A plugin I wrote converts the Markdown project pages into HTML at build time, and checks each one (mandatory fields, existing skills, images present): a badly filled page blocks publication. The browser only receives HTML, CSS and a little JavaScript, with no external library and no font loaded from a third party.

**Two languages, two themes.** The website exists in French and in English (remim.me/en), from the same Markdown files: each translated page has its English version next to the French one, and a text not yet translated is still shown in French, flagged as such. The English content is only downloaded by visitors of the English version. A dark mode follows the system setting, or the visitor's choice, stored in their browser.

**Hosting and domain name.**

- GitHub Pages serves the site over HTTPS, with an automatically renewed certificate.
- The remim.me domain is managed at Namecheap: A records pointing to GitHub Pages' servers, a CNAME for www, and another for dashboard.remim.me, the dashboard's subdomain.
- Publication is continuous, with GitHub Actions: on every push, code check, build, tests, then deployment. Any error stops everything, and the live site stays intact.
- A Docker version is ready to host it on my homelab: an image built in two stages, served by Nginx with security headers.

**Security and the GDPR.** A strict content security policy (CSP) prevents any external script from running. The website sets no cookies, and its legal notice describes the publisher, the host and the processing of data (contact form, audience measurement).

**Search engine optimisation.** A carefully written title and description, schema.org structured data (a "person" record with my position, my school, my GitHub and LinkedIn links), a sitemap (sitemap.xml), a robots.txt that keeps my CV away from search engines (it contains my phone number), a preview image for LinkedIn shares, and an icon in the formats Google asks for.

**Audience measurement.** GoatCounter, a cookie-free open-source tool, counts each page viewed. To keep the "no external script" rule, I wrote the page-view sending myself instead of loading the official script. Nothing is counted for bots, nor for browsers that ask not to be tracked.

**The technology watch.** Every Monday, a GitHub Actions job reads the RSS feeds of 33 sources. GitHub Copilot then picks, for each of my three topics (cybersecurity in industrial SMEs, virtualisation, e-invoicing), the most useful articles, summarises them and tags them. The news appears in the "Technology watch" section, one tab per topic.

**The watch by e-mail.** New news items also reach me by e-mail, numbered. I reply with my opinion on the ones that caught my attention ("1, 3: what I take away…"); the AI turns it into a synthesis, without adding anything, and sends it back for me to proofread. I reply "ok" and it is published, or I ask for a correction. The website has no server: a small Google Apps Script in my Gmail account relays the e-mails to GitHub Actions, which runs the AI and saves the synthesis. Nothing is published without my approval, and only my own messages are read.

**The dashboard** (dashboard.remim.me). A second static website, in its own repository, to run the portfolio without opening a code editor:

- an overview: the state of each watch topic (latest synthesis, news to process, latest collection), the result of the latest publication and the latest collection, and the site's visits;
- sign-in with a GitHub token limited to the website's repository and to two permissions: each saved synthesis is a commit, which republishes the site;
- rewording a passage with the AI: the page has no server, so it goes through a GitHub Actions workflow, without ever exposing the AI's secret;
- choosing the news items cited as sources, and removing an off-topic item;
- the age of each topic's latest synthesis, with an e-mail reminder (GitHub issue) if a topic has had nothing for three weeks;
- site visits over 7, 30 or 90 days, most viewed pages and where visitors come from.

![Portfolio architecture diagram: visitors open remim.me over HTTPS; the domain name, managed at Namecheap, leads to GitHub Pages, which serves the portfolio and the dashboard.remim.me dashboard. Each page viewed is counted by GoatCounter. I write in VS Code or from the dashboard, which saves to the repository through the GitHub API. Each push triggers GitHub Actions, which tests then publishes the site. Every Monday, the watch reads 33 RSS feeds and has GitHub Copilot summarise the articles.](schemas/portfolio-architecture.svg "Portfolio architecture: publication, automated watch and dashboard (diagram in French)")

Built with **Claude Code**. My role: defining the need, making the choices and testing.

Source code (MIT licence): [the website](https://github.com/moreauremi/moreauremi.github.io) and [the dashboard](https://github.com/moreauremi/veille-syntheses).

## Screenshots

![RémiOS main menu: a grey whiptail-style box on a blue background, with the logo, my details and the numbered sections](captures/portfolio-remios/menu.webp "Main menu, after the Linux-style boot")

![Technology watch section: three topic tabs, and in the Cybersecurity topic, the "Latest news" and "My syntheses" tabs, then the summarised news items with their tags](captures/portfolio-remios/veille.webp "Technology watch: one tab per topic, news summarised every Monday")

![Quick view for the jury: a plain page on a white background, with the table of contents](captures/portfolio-remios/jury.webp "Quick jury view: plain, printable, no animation")

![Hidden terminal: the ls and cat commands show the site's files, including the folder of each watch topic](captures/portfolio-remios/terminal.webp "Hidden terminal: the site browsed like a file system")

![Dashboard overview: state of the three watch topics with the age of the latest synthesis, state of publication and collection shown like a boot log, shortcuts, and a box with the site's visits](captures/portfolio-remios/tableau-de-bord.webp "The dashboard.remim.me dashboard: the overview")

![Dashboard Syntheses view: topic bar, list of published syntheses, editor, and the topic's news items to tick to cite them as sources](captures/portfolio-remios/syntheses.webp "Dashboard: writing a synthesis and citing its sources")

## Results and testing

- **Lighthouse audit** of the live site (26 September 2026): 100/100 for performance, accessibility, best practices and SEO, on mobile and desktop.
- **Accessibility**: WCAG 2.2 AA rules checked with axe-core on every screen, full keyboard navigation, no page that scrolls horizontally, even on a 320 px screen.
- **HTML validation**: the pages pass the W3C validator without errors.
- **Automated tests**, run before every deployment: 34 for the website (security policy, every section and every project page, no placeholder screenshot published, jury view, watch tabs, audience measurement, terminal, synthesis reminder, reading replies and the full e-mail watch exchange) and 19 for the dashboard (synthesis format, simulated exchanges with GitHub and GoatCounter, visits chart).

The website has been online since September 2026, and its traffic has been measured since 9 October 2026.

## Difficulties encountered

**No server on GitHub Pages.** The dashboard had to write to the repository and call an AI, without exposing any secret. Solution: the GitHub API called from the browser, with a personal token with minimal permissions, and the AI run by GitHub Actions, where its secret stays.

**GitHub Pages' cache.** Right after an update, a browser could show the new page with the old stylesheet. I added a version number to each file, and a test checks that none is forgotten.

**Measuring the audience without weakening security.** GoatCounter's official script would have required allowing an external script. So I rewrote the page-view sending, and a test checks that no visit is counted during the tests themselves.

**The icon missing in Google.** The site only had an SVG icon, whereas Google asks for a square image of 48 px or a multiple of 48: I added a favicon.ico and a 192 px image.

**Concurrent writes.** The dashboard and the Monday collection write to the same repository. Each write checks the file's version, so as never to overwrite a change made elsewhere, and the Monday job updates itself before pushing its own.

## Possible improvements

- Run the Lighthouse audit again after the latest additions (three-topic watch, audience measurement).
- Add the accessibility tests (axe-core) to the automated publication.
- Get a warning before the GitHub tokens, valid for one year, expire.
- Host the Docker version on my homelab, behind its reverse proxy.

## Skills applied

- **B1.3**: promoting my image on the web within the legal framework (legal notice, GDPR); getting the site indexed (structured data, sitemap, icon) and measuring its visibility (GoatCounter); developing a website that uses data (watch news, syntheses).
- **B1.4**: splitting the project into steps, tracking its progress (git history, list of what remains to be done) and correcting deviations.
- **B1.5**: testing the service (automated tests, audits), deploying it (GitHub Pages, DNS, HTTPS, continuous publication) and documenting how to use it.
- **B1.6**: organising an information watch on three topics, and managing my professional identity online.
