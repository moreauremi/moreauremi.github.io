---
# Traduction anglaise de depannage-serveurs-tp.md. Seuls les champs traduits
# sont ici (titre, resume, statut) : les autres viennent du fichier français.
titre: "Troubleshooting the Proxmox servers in the lab room"
statut: "completed"
resume: "The Proxmox servers in the lab rack could not be reached (no screen, no network, unknown IP address): diagnosing the Cisco switch through the console, finding the server by its IPv6 link-local address, restoring SSH access, then a PowerShell script and documentation for the other PODs."
---

## Context

A BTS SIO practical session. For this lab, we needed the servers installed in the room's rack: one per POD (POD01, POD02 and POD03), each connected to its own Cisco switch. The servers had just been set up, but they were not working: connected to no network, without a screen, and nobody knew their IP address. There was no way to connect to them and start the lab.

As I was ahead on the lab, I offered to take care of it. With the teacher's agreement, I tried to fix the problem on POD02, including work on the switch, then prepared what was needed to repeat the procedure on the other two PODs.

## Objectives

- Reach the server from a workstation, without a screen or keyboard on the server.
- Recover its network configuration: IP address, netmask, switch port.
- Document the procedure and make it repeatable for POD01 and POD03.

## Documentation to download

The documentation also serves as a procedure if the problem comes back: it starts with a quick procedure and a "symptom, cause, what to do" table, then tells the troubleshooting step by step, and ends with a glossary and a summary of the commands.

- **Headless access to the POD02 Proxmox server** (PDF in French, 14 pages): [open](docs/depannage-serveurs-tp/documentation-acces-serveur-pod02.pdf) or [download](docs/depannage-serveurs-tp/documentation-acces-serveur-pod02.pdf "Download")
- **Get-InfosPod.ps1** (PowerShell script, for POD01 and POD03): [download](docs/depannage-serveurs-tp/Get-InfosPod.ps1 "Download")

## The hardware

| Item | Model | Role |
|---|---|---|
| Switch | Cisco Catalyst 2960-XR, IOS 15.2(5b)E | Connects the POD's machines |
| Server | Dell Precision Tower 5810, Proxmox VE | The lab's hypervisor |
| Workstations | MacBook, Windows laptop | Administration workstations, with a USB-C to RJ45 adapter and a USB-serial console cable |

The POD network is isolated: no internet box or DHCP server, so no address is assigned automatically.

![POD02 rack: Cisco Catalyst 2960-XR switch at the top, Cisco 1921 router below, blue cable from the workstation plugged into the switch](captures/depannage-serveurs-tp/baie-pod02.webp "The POD02 rack: Catalyst 2960-XR switch and Cisco 1921 router")

## Implementation

**The principle.** Without DHCP, a workstation can only talk to the server if it is in the same subnet, with a static IP address. So I had to plug a workstation into the switch and, first of all, find the server's IP address.

**The switch, through the console.** No port LED lit up and the SYST LED was blinking green: according to Cisco's documentation, the switch was still running its power-on self-test (POST). Through the console cable (screen at 9600 baud), I saw that it was stuck at the bootloader's `switch:` prompt, without having loaded its operating system. The `boot` command loaded IOS and the switch started. With `show interfaces status` (after `terminal length 0`, which turns off paging): no port disabled, all in VLAN 1, the server on Gi1/0/14 and the workstation on Gi1/0/16.

![Front panel of the Cisco Catalyst 2960-XR switch: SYST LED, MODE button, MGMT and RJ45 console ports, mini-USB console port](captures/depannage-serveurs-tp/facade-switch.webp "The switch front panel: SYST LED, MGMT port and console ports")

**PortFast.** Each time a cable is plugged in, the STP protocol blocks the port for about 30 seconds, while it checks that there is no network loop. I enabled PortFast on the server and workstation ports (`spanning-tree portfast`), so that they forward traffic straight away, then saved the configuration with `write memory`. IOS stores it as `spanning-tree portfast edge`: *edge* means a port connected to a machine, never to another switch.

**Finding the server.** Wireshark showed no ARP request from the server, which would have given me its IP. On the switch, `show mac address-table interface gi1/0/14` gave its MAC address (a Dell prefix), and its counters showed only 34 packets received: a server that has no one to reach stays almost silent.

**The solution: IPv6 link-local.** On Linux, every network card has an IPv6 "link-local" address (fe80::…), even when nothing is configured, and Debian, which Proxmox is based on, derives it from the MAC address (EUI-64 method). For example, a fictitious MAC 00:11:22:33:44:55 gives fe80::211:22ff:fe33:4455. I worked out the server's address the same way, then connected over SSH from the Windows PC: `ssh root@fe80::…%12`, where 12 is the number of the PC's Ethernet card. The `ip a` command gave the server's IPv4 address, a /16, carried by vmbr0, Proxmox's virtual switch.

*The school network's IP and MAC addresses are hidden in this page, in the photos and in the downloadable documents.*

![SSH terminal connected to the POD02 server: ip a shows the IPv4 address of vmbr0 and the link-local IPv6 address, blurred](captures/depannage-serveurs-tp/ssh-ip-a.webp "Connected to the server over SSH: ip a gives its address (blurred)")

**For POD01 and POD03.** A PowerShell script, Get-InfosPod.ps1 (available for download above), repeats the whole procedure from the Windows PC: it finds the Ethernet card, discovers the server over IPv6, reads its configuration over SSH, queries the switch through the console (-Cisco option), puts the workstation in the right subnet (-ConfigurerPC option) and writes a report.

Troubleshooting carried out with the help of **Claude** (AI), which also wrote the script and formatted the documentation. My role: working on the hardware, making the choices and testing.

## Results and testing

- **Switch**: started, ports active, all in VLAN 1. PortFast is in the startup configuration (`show startup-config | include portfast`), which is reloaded at every boot.
- **Server**: reached over IPv6 (`ping -6`), then a successful SSH connection (root@POD02). Its IPv4 address is now known and recorded in the documentation handed over.
- **Web interface**: access checked on the server's port 8006 (https), from a workstation placed in the same /16 subnet.
- **Script**: checked in simulation (without the hardware), to be run later on POD01 and POD03. [À COMPLÉTER : résultat du script sur POD01 et POD03]

## Difficulties encountered

**An Ethernet adapter the Mac could not see.** The Mac did not detect the USB-C to RJ45 adapter: the "Ethernet Adapter" entries listed by `networksetup -listallhardwareports` were Apple Silicon virtual interfaces. On Windows, the same kind of adapter is recognised without a driver ("Realtek USB FE Family Controller"): I carried on with a Windows PC. The `Get-NetAdapter` command also helped me spot the right card among the virtual ones (VirtualBox, VPN).

![PowerShell: Get-NetAdapter lists Ethernet 5 (Realtek USB FE Family Controller, Up, 100 Mbps) and Ethernet 6 (VirtualBox Host-Only Ethernet Adapter)](captures/depannage-serveurs-tp/get-netadapter.webp "Spotting the real Ethernet card among the virtual ones")

**Wireshark filters rejected.** `dhcp` and `udp.port == 67` turned red: I was typing them into the capture filter, which does not use the same syntax as the display filter (`arp or udp port 67` on one side, `arp || dhcp` on the other). Solution: capture without a filter, then filter the display.

**"Invalid input" on the switch.** The PortFast configuration was rejected: I was in user mode (`Switch>`), which only allows viewing. You first have to switch to privileged mode with `enable` (`Switch#`), then `configure terminal`.

**A server too quiet for Wireshark.** With no traffic to capture, there was no way to read its IP from ARP requests. That is what led me to the IPv6 link-local address, derived from the MAC address read on the switch.

**An open question.** Why does the switch stop at the bootloader? `show boot` rules out a manual boot setting (`Manual Boot : no`), and the path to the IOS image is set. However, `Enable Break : yes`: a "Break" signal received on the console during startup, for example when a console cable is plugged in, can be enough to interrupt it. Next step, with the teacher's agreement: check that the image exists (`dir flash:`), disable this option (`no boot enable-break`), then test a restart (`reload`).

## Skills applied

- Methodical network diagnosis, from physical to logical: LEDs, link, VLAN, addressing, service
- Administering a Cisco switch through the console: bootloader, user and privileged modes, VLANs, MAC table, STP and PortFast
- IPv4 addressing (/16 subnet, static IP) and IPv6 link-local (EUI-64)
- Capturing and filtering traffic with Wireshark
- SSH access to a Proxmox (Debian) server and reading its network configuration
- Automating a procedure with PowerShell
- Writing technical documentation and a reusable troubleshooting procedure
