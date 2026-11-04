---
# Traduction anglaise de reseau-vm-virtualbox.md. Seuls les champs traduits
# sont ici (titre, resume, statut) : les autres viennent du fichier français.
titre: "A network of six virtual machines in VirtualBox"
statut: "completed"
resume: "Six VirtualBox virtual machines (Windows 11, Windows Server 2025, Ubuntu, Linux Mint, Kali) on the same NAT network: installation, cloning with Sysprep, IP addressing, connectivity tests, firewall and snapshots."
---

## Context

A BTS SIO lab (block 1). As a trainee technician at InfoServ, a fictitious company, I have to create six virtual machines in VirtualBox, two Windows workstations, one Windows server and three Linux machines, then check that they communicate on the same network.

I turned it into a step-by-step guide: it follows the assignment in order, with the clicks to make, a checkpoint and a screenshot at each step, and a troubleshooting table.

## Objectives

- Prepare VirtualBox: hardware virtualisation, Extension Pack and a dedicated NAT network.
- Install each system by hand, without VirtualBox's unattended installation, with standardised names.
- Create the second Windows workstation by cloning, cleanly, with Sysprep.
- Give the server a static address, leave the workstations on DHCP, then test the network.
- Back up each VM with a snapshot and check that restoring works.

## The machines

All of them are in the TP-OS-MOREAU group, with dynamically allocated disks, and connected to the **RN-TPOS** NAT network (192.168.50.0/24, DHCP enabled).

| VM | System | IP address |
|---|---|---|
| WIN-CLI-01 | Windows 11 Pro | 192.168.50.3 (DHCP) |
| WIN-CLI-02 | Windows 11 Pro, clone of the first one | 192.168.50.4 (DHCP) |
| WIN-SRV-01 | Windows Server 2025 Standard (Desktop Experience) | 192.168.50.10 (static) |
| LNX-UBU-01 | Ubuntu Desktop 26.04 LTS | 192.168.50.6 (DHCP) |
| LNX-MINT-01 | Linux Mint 22.3 Cinnamon | 192.168.50.7 (DHCP) |
| LNX-KALI-01 | Kali Linux 2026.2 (Xfce) | 192.168.50.8 (DHCP) |

![VirtualBox network manager, NAT Networks tab: the RN-TPOS network, IPv4 prefix 192.168.50.0/24, Enable DHCP ticked](captures/reseau-vm-virtualbox/reseau-nat-rn-tpos.webp "The RN-TPOS NAT network, shared by the six VMs")

## Implementation

**Preparing VirtualBox.** Hardware virtualisation checked in Task Manager, VirtualBox 7.2 and its Extension Pack with the same version number, the VM folder on the disk with the most free space, then the RN-TPOS network. You have to choose "NAT Network" and not "NAT": with plain NAT, each VM has its own network and cannot see the others.

**The first Windows 11 workstation (WIN-CLI-01).** The VM uses EFI, with Secure Boot and TPM 2.0, required by Windows 11. Installing the Pro edition, a local admin-local account (the "Domain join instead" option, which avoids a Microsoft account), renaming the PC, Windows Update until "You're up to date", then a 01-Installation-OK snapshot.

![WIN-CLI-01 settings, System: TPM version 2.0, UEFI and Secure Boot ticked](captures/reseau-vm-virtualbox/efi-secure-boot-tpm.webp "EFI, Secure Boot and TPM 2.0, required by Windows 11")

**The second workstation, by cloning (WIN-CLI-02).** A raw clone would keep the first workstation's identity. Sysprep (OOBE mode, "Generalize", shutdown) makes it forget that identity before a full clone, with new MAC addresses for every network card. On restart, each workstation goes through its first-time setup again, and the second one is renamed.

![WIN-CLI-01 desktop with the Sysprep tool: Enter System Out-of-Box Experience (OOBE), Generalize ticked, Shutdown](captures/reseau-vm-virtualbox/sysprep.webp "Sysprep: OOBE, Generalize, Shutdown")

**The server (WIN-SRV-01).** Windows Server 2025 Standard, with the Desktop Experience: without it, the server has no graphical interface. In Server Manager, Local Server section: name, static address 192.168.50.10/24 (gateway and DNS at 192.168.50.1) and the Paris time zone.

![Server Manager, Local Server: name WIN-SRV-01, address 192.168.50.10 and the UTC+01:00 time zone highlighted](captures/reseau-vm-virtualbox/serveur-local.webp "The server: name, static address and time zone")

**The three Linux machines.** Each VM has 128 MB of video memory and an etudiant user.

- **Ubuntu Desktop**: normal installation, full upgrade (apt full-upgrade), Guest Additions prerequisites (build-essential, dkms, kernel headers) and an active SSH server.
- **Linux Mint**: the fastest update mirrors in France, all updates, and a first system snapshot with Timeshift, not to be confused with the VirtualBox snapshot, taken from outside the VM.
- **Kali Linux**: Graphical install, guided partitioning on the whole disk, Xfce desktop and default tools, GRUB on /dev/sda, then an update.

Finally, each Linux machine gets its 01-Installation-OK snapshot, like WIN-CLI-01 and the server.

Full documentation: [VirtualBox lab, step-by-step guide](docs/reseau-vm-virtualbox/tp-virtualbox-guide-pas-a-pas.pdf) (PDF in French, 48 pages, with a troubleshooting table).

## Results and testing

**Cloning.** On each workstation, whoami /user and ipconfig /all: the machine SID (the whole SID except the last number) and the MAC address are different on the two workstations. Cloning with Sysprep worked.

![WIN-CLI-01 command prompt: whoami /user shows the SID, ipconfig /all the physical address 08-00-27-4B-CD-14](captures/reseau-vm-virtualbox/sid-mac-win-cli-01.webp "WIN-CLI-01: SID and MAC address")

![WIN-CLI-02 command prompt: a different SID and the physical address 08-00-27-B4-37-8A](captures/reseau-vm-virtualbox/sid-mac-win-cli-02.webp "WIN-CLI-02: another SID and another MAC address")

**Connectivity.** Three VMs running (WIN-SRV-01, a Windows workstation and Kali). From each one, four pings:

- to the other two VMs: they can see each other on RN-TPOS;
- to 8.8.8.8: they can reach the internet;
- to www.debian.org: name resolution (DNS) works.

![LNX-KALI-01 terminal: pings to 192.168.50.10, 8.8.8.8 and www.debian.org, all with 0% packet loss](captures/reseau-vm-virtualbox/pings-kali.webp "From Kali: the server, the internet, then a domain name")

**Network discovery.** From Kali, an nmap -sn 192.168.50.0/24 scan, limited to the lab network: using these tools on any other network is forbidden (articles 323-1 and following of the French Criminal Code). It finds the running VMs (.3, .8 and .10) and VirtualBox's own addresses.

![LNX-KALI-01 terminal: nmap -sn 192.168.50.0/24, 5 hosts up, including 192.168.50.3, 192.168.50.8 and 192.168.50.10](captures/reseau-vm-virtualbox/scan-nmap.webp "Discovery scan, limited to the lab network")

**Restoring.** On LNX-UBU-01, a test.txt file created on the desktop, then the 01-Installation-OK snapshot restored: the file is gone, and the VM is back to the snapshot's state.

![VirtualBox VM list: the TP-OS-MOREAU group, with WIN-CLI-02, WIN-SRV-01, WIN-CLI-01, LNX-UBU-01 and LNX-MINT-01 powered off, most of them on their 01-Installation-OK snapshot](captures/reseau-vm-virtualbox/groupe-tp-os.webp "The TP-OS-MOREAU group in VirtualBox")

## Difficulties encountered

**Sysprep blocked by BitLocker.** Sysprep refused to validate the Windows installation. Its log (setupact.log, in C:\Windows\System32\Sysprep\Panther) gave the cause: BitLocker was active on the C: drive. Solution: manage-bde -off C: in an administrator terminal, wait for decryption to finish, then run Sysprep again. I added this case to the guide and its troubleshooting table.

![Sysprep's setupact.log, with the highlighted line "Turn BitLocker off to run Sysprep"](captures/reseau-vm-virtualbox/sysprep-journal-bitlocker.webp "Sysprep's log: BitLocker is active on C:")

**Pings to Windows without an answer.** The Windows workstations and the server did not answer pings, even though they were on the network: by default, Windows Firewall blocks incoming ICMP echo requests. Solution: enable the "File and Printer Sharing (Echo Request - ICMPv4-In)" rule, in Windows Defender Firewall with Advanced Security, or in PowerShell with Enable-NetFirewallRule -Name FPS-ICMP4-ERQ-In.

![Windows Defender Firewall with Advanced Security, Inbound Rules: the "Enable Rule" context menu on a File and Printer Sharing rule](captures/reseau-vm-virtualbox/regle-pare-feu-icmp.webp "Enabling the incoming ICMPv4 rule")

![LNX-KALI-01 terminal: a first ping to 192.168.50.10 loses 100% of packets, the second, after enabling the rule, gets all 4 replies](captures/reseau-vm-virtualbox/ping-avant-apres-pare-feu.webp "Pinging the server, before and after the rule")

## Skills applied

- Virtualising workstations and servers with VirtualBox: EFI, Secure Boot, TPM 2.0, dynamic disks, NAT network
- Installing Windows systems (client and server) and Linux systems (Ubuntu, Mint, Kali)
- Preparing a Windows workstation for cloning with Sysprep: unique SIDs and MAC addresses
- IP addressing: DHCP for workstations, a static address for the server
- Testing connectivity and name resolution (ping), discovering the network (nmap) within the lab's legal framework
- Windows Defender Firewall: incoming ICMPv4 rule
- Backing up and restoring with snapshots (VirtualBox, Timeshift)
- Writing step-by-step technical documentation
