---
# Traduction anglaise de rmutils.md. Seuls les champs traduits sont ici
# (titre, resume, statut) : les autres viennent du fichier français.
titre: "RMutils — a Windows maintenance toolbox"
statut: "v1 published on GitHub"
resume: "A Windows maintenance tool that fits on a USB stick: a single .bat file per version and a keyboard menu to update, diagnose, clean up, repair and back up a PC, with a record of every intervention (logs, HTML reports)."
---

## Context

Fixing a Windows PC often takes the same steps: installing updates, checking the state of the disks and the battery, freeing up space, repairing system files or resetting the network. The tools exist in Windows, but they are scattered between Settings, the command prompt and PowerShell, and you need to know the right commands.

RMutils brings them together in a single tool, to copy onto a USB stick and run on any PC, without installing anything.

## Objectives

- Run the tool from a USB stick, without installation: a single file per version.
- Group the common maintenance operations in a menu that can be used with the keyboard.
- Offer a version without administrator rights, for computers where you do not have them.
- Keep a record of every intervention: a log per session, and reports saved on the stick in one folder per PC.
- Limit the risks: read-only diagnostics, and a restore point before each repair.

## Implementation

**Two versions.** RMutils.bat asks for administrator rights at launch (UAC window) and gives access to everything. RMutils_Lite.bat works without these rights, with suitable features: list of pending updates, cleaning the account's files and browser caches, DNS cache. Both share the same list of applications and the same folders on the stick.

**Seven sections in the menu** of the full version:

- **Updates**: Windows Update without going through Settings (search, download, then installation one by one with a status for each), and silent updating of applications with winget.
- **Diagnostics**, without changing anything on the PC: system information (model, serial number, Windows activation, processor, memory, BIOS), disk health (SMART: temperature, SSD wear, read errors), battery capacity, network tests in the order router, internet, DNS then web (the first failed test shows where things get stuck), and a full HTML report saved on the stick.
- **Clean-up**: temporary files, Windows Update cache, thumbnails, error reports, recycle bin, then cleaning up Windows components with DISM.
- **Repair**, with a restore point created before each action: DISM /RestoreHealth then sfc /scannow, resetting Windows Update and the network (Winsock, IPv4 and IPv6 stacks), checking the disk with chkdsk.
- **Backup and restore**: third-party drivers, to export before a reinstallation, and Wi-Fi profiles.
- **Installation**: a pack of applications installed silently with winget, from an editable list. Applications already present are skipped.
- **Tools**: the password of a saved Wi-Fi network, shown with its QR code right in the terminal, to connect a phone by scanning it.

**One file, two languages.** The start of the file is a batch script: cmd.exe checks the rights, restarts itself as administrator if needed, launches PowerShell, then stops. PowerShell reads the same file again and runs everything after the #PSBEGIN marker. So there is only one file to copy, with no .ps1 script next to it that PowerShell's execution policy could block.

**Technical choices.**

- Windows Update is driven through its COM API, which makes it possible to install updates one by one and show a status for each.
- The QR code is produced by a small encoder written in C#, compiled on the fly by PowerShell, then drawn with block characters.
- The scripts are in ASCII, without accents, with Windows line endings: cmd.exe handles UTF-8 and Unix line endings poorly. The .gitattributes file prevents Git from converting them.

Built with **Claude Code**. My role: defining the need, making the choices and testing.

![Diagram of how RMutils works: the USB stick holds RMutils.bat, RMutils_Lite.bat and the application list. On the Windows PC, cmd.exe checks the rights and restarts itself as administrator, then PowerShell runs the code placed after #PSBEGIN and shows the keyboard menu. The menu drives Windows tools (Windows Update, winget, DISM and SFC, netsh and pnputil), and the log, reports and backups are written to the stick, in one folder per PC.](schemas/rmutils-fonctionnement.svg "How RMutils works: from the double-click on the USB stick to the report saved on the stick (diagram in French)")

Source code: [github.com/moreauremi/RMutils](https://github.com/moreauremi/RMutils)

## Screenshots

Screenshots of the real RMutils code, run under PowerShell 7 on 13 October 2026. The PC name, the Windows version and the Wi-Fi networks are examples. The tool's interface is in French.

![RMutils main menu: ASCII logo, PC name and Windows version, seven numbered sections with the first one highlighted, and the description of the selected section](captures/rmutils/menu-principal.webp "Main menu: arrow keys to navigate, numbers to jump straight to a section")

![Repair section, "Repair Windows (DISM + SFC)" selected: the description details DISM /RestoreHealth then sfc /scannow, when to run them and how long they take](captures/rmutils/reparation.webp "Repair: each action is described before it runs")

![Diagnostics section, "Network diagnostics" selected: tests in the order router, internet, DNS then web, and what the first failed test means](captures/rmutils/diagnostic.webp "Network diagnostics: the first failed test shows where things get stuck")

![Wi-Fi password tool on an example network: network name, WPA2-Personal security, password in green, then the QR code to scan with a phone](captures/rmutils/wifi-qr.webp "Wi-Fi password and QR code, on an example network")

## Results

- First public release on GitHub on 12 October 2026, with complete documentation: features, usage, security, how it works and limitations.
- First trials on my PC and on relatives' PCs. Not every feature has been checked in real conditions yet.
- The QR code in the screenshot was checked: a QR code reader finds the network name and password.
- Two ready-to-use versions, sharing the same list of applications and the same folders on the stick.
- Every intervention leaves a record on the stick: a log per session, named with the PC name and the date, and for each PC a folder with the HTML reports, the battery report and the backups.

## Security

- Exported Wi-Fi profiles contain passwords in plain text: the stick must be treated as sensitive media.
- The "Wi-Fi password" tool shows the password on screen, but never writes it to the log.
- Logs and reports contain information about the PCs that were fixed (name, serial number, IP and MAC addresses). The .gitignore file keeps them out of the repository, so that they are never published.

## Difficulties encountered

**Fitting into a single file.** A PowerShell script launched by double-clicking is often blocked by Windows' execution policy. Solution chosen: a batch file that also contains the PowerShell code, which PowerShell reads itself.

**Special characters in cmd.exe.** cmd.exe handles UTF-8 and Unix line endings poorly. Solution chosen: scripts entirely in ASCII, with Windows line endings protected by the .gitattributes file.

**Reading winget's output.** winget does not give a structured result: RMutils reads its text table and finds the columns from the header. When winget truncates an identifier that is too long, the application is marked "IGNORE" rather than risk updating the wrong one.

**The restore point limit.** Windows refuses to create a restore point if another one was created in the last 24 hours. RMutils lifts this limit while it creates the point, then puts the original setting back, and turns on system protection if it was off.

## Known limitations

- Windows 10 and 11 only.
- Depending on the disk or the controller (USB enclosure, RAID), some SMART information is not reported.
- Enterprise Wi-Fi networks, with personal credentials, have no stored password: no QR code possible.
- An open application may fail to update: it is better to close applications first.

## Skills applied

- Maintaining a Windows workstation: updates, clean-up, repairing system files (DISM, SFC), checking disks (chkdsk)
- Hardware and network diagnostics: SMART, battery, step-by-step connectivity tests
- Backup and restore: drivers, Wi-Fi profiles, restore points
- Deploying applications with winget
- Batch and PowerShell scripts, privilege elevation with UAC
- Protecting the data of the PCs fixed and the Wi-Fi passwords
- Documenting and publishing a project on GitHub
