<#
.SYNOPSIS
    Récupère les infos réseau d'un POD (serveur Proxmox + switch Cisco) depuis un PC
    Windows branché sur le switch, sans écran sur le serveur.

.DESCRIPTION
    Le script refait automatiquement ce qu'on a fait à la main sur le POD02 :
      1. Trouve la carte Ethernet du PC branchée au switch.
      2. Découvre le serveur grâce à son adresse IPv6 "lien local" (fe80::...).
         Cette adresse existe toujours, même quand on ne connaît pas son IPv4.
      3. Se connecte au serveur en SSH (mot de passe root demandé) et lit sa config réseau.
      4. Option -Cisco : interroge le switch par le câble console (ports, VLAN, MAC...).
      5. Option -ConfigurerPC : met le PC dans le même sous-réseau que le serveur.
      6. Écrit un rapport texte à côté du script.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\Get-InfosPod.ps1
    Découverte + lecture de la config du serveur, rapport écrit.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\Get-InfosPod.ps1 -ConfigurerPC -Cisco
    Tout : serveur + switch + IP du PC configurée (PowerShell en administrateur).
#>
[CmdletBinding()]
param(
    # Nom de la carte réseau du PC (ex : "Ethernet 5"). Vide = détection automatique.
    [string]$Interface,

    # Compte SSH du serveur. Sur Proxmox, root est autorisé par défaut.
    [string]$Utilisateur = "root",

    # Interroger aussi le switch Cisco par le câble console.
    [switch]$Cisco,

    # Port COM du câble console (ex : COM3). Vide = détection automatique.
    [string]$PortCOM,

    # Mettre le PC dans le sous-réseau du serveur (PowerShell administrateur requis).
    [switch]$ConfigurerPC,

    # Plan B si la découverte échoue : MAC du serveur lue sur le switch
    # avec "show mac address-table" (ex : 0011.2233.4455).
    [string]$MacServeur
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Petites fonctions d'affichage
# ---------------------------------------------------------------------------
function Write-Etape([string]$texte)  { Write-Host "`n==> $texte" -ForegroundColor Cyan }
function Write-Ok([string]$texte)     { Write-Host "    [OK] $texte" -ForegroundColor Green }
function Write-Alerte([string]$texte) { Write-Host "    [!]  $texte" -ForegroundColor Yellow }
function Get-Valeur($v) { if ([string]::IsNullOrWhiteSpace([string]$v)) { '(aucun)' } else { $v } }

# ---------------------------------------------------------------------------
# Calculs d'adresses IPv4
# Une IPv4 = 4 octets = un nombre sur 32 bits. En la convertissant en nombre,
# on calcule facilement le réseau, le broadcast et une IP libre pour le PC.
# ---------------------------------------------------------------------------
function ConvertTo-Nombre([string]$ip) {
    $o = ([System.Net.IPAddress]::Parse($ip)).GetAddressBytes()
    return ([long]$o[0] * 16777216) + ([long]$o[1] * 65536) + ([long]$o[2] * 256) + [long]$o[3]
}

function ConvertTo-IP([long]$n) {
    return "{0}.{1}.{2}.{3}" -f (($n -shr 24) -band 255), (($n -shr 16) -band 255), (($n -shr 8) -band 255), ($n -band 255)
}

# /16 -> 255.255.0.0 (les 16 premiers bits à 1)
function Get-Masque([int]$prefixe) {
    $tout = [long]4294967295            # 32 bits à 1
    return ($tout -shl (32 - $prefixe)) -band $tout
}

# Propose une IP pour le PC dans le même sous-réseau que le serveur :
# adresse réseau + 100 si possible, sinon l'avant-dernière adresse de la plage.
function Get-IPPourPC([string]$ipServeur, [int]$prefixe) {
    $masque    = Get-Masque $prefixe
    $serveur   = ConvertTo-Nombre $ipServeur
    $reseau    = $serveur -band $masque
    $broadcast = $reseau -bor ((-bnot $masque) -band [long]4294967295)
    foreach ($candidat in @(($reseau + 100), ($broadcast - 1), ($broadcast - 2), ($reseau + 1))) {
        if ($candidat -gt $reseau -and $candidat -lt $broadcast -and $candidat -ne $serveur) {
            return [pscustomobject]@{ IP = (ConvertTo-IP $candidat); Masque = (ConvertTo-IP $masque); Reseau = (ConvertTo-IP $reseau) }
        }
    }
    return $null
}

# ---------------------------------------------------------------------------
# Adresses MAC
# ---------------------------------------------------------------------------
# Calcule l'IPv6 lien local qu'un Linux (Debian/Proxmox) fabrique à partir de sa MAC
# (méthode EUI-64) : on inverse le 7e bit du 1er octet et on insère ff:fe au milieu.
# Ex (MAC fictive) : 00:11:22:33:44:55 -> fe80::211:22ff:fe33:4455
function Get-LienLocalEUI64([string]$mac) {
    $hex = $mac -replace '[^0-9a-fA-F]', ''
    if ($hex.Length -ne 12) { throw "MAC invalide : $mac" }
    $b = @(0..5 | ForEach-Object { [Convert]::ToInt32($hex.Substring($_ * 2, 2), 16) })
    $b[0] = $b[0] -bxor 2
    return "fe80::{0:x}:{1:x}:{2:x}:{3:x}" -f ($b[0] * 256 + $b[1]), ($b[2] * 256 + 255), (254 * 256 + $b[3]), ($b[4] * 256 + $b[5])
}

# Windows écrit les MAC "00-11-22-33-44-55", Linux "00:11:22:33:44:55",
# Cisco "0011.2233.4455". Cette fonction convertit au format Cisco.
function ConvertTo-MacCisco([string]$mac) {
    $hex = ($mac -replace '[^0-9a-fA-F]', '').ToLower()
    if ($hex.Length -ne 12) { return $null }
    return "{0}.{1}.{2}" -f $hex.Substring(0, 4), $hex.Substring(4, 4), $hex.Substring(8, 4)
}

# Cherche dans la table MAC du switch sur quel port une MAC a été vue.
function Find-PortSwitch([string]$tableMac, [string]$mac) {
    $cisco = ConvertTo-MacCisco $mac
    if (-not $cisco -or -not $tableMac) { return $null }
    if ($tableMac -match ("(?m)^\s*\d+\s+" + [regex]::Escape($cisco) + "\s+\S+\s+(\S+)")) { return $Matches[1] }
    return $null
}

# ---------------------------------------------------------------------------
# Test d'un port TCP (ex : 8006 = interface web Proxmox, 22 = SSH)
# ---------------------------------------------------------------------------
function Test-PortTCP([string]$adresse, [int]$port, [int]$delaiMs = 1500) {
    try {
        $ip = [System.Net.IPAddress]::Parse($adresse)
        $client = New-Object System.Net.Sockets.TcpClient($ip.AddressFamily)
        try { return $client.ConnectAsync($ip, $port).Wait($delaiMs) }
        finally { $client.Close() }
    } catch { return $false }
}

# ---------------------------------------------------------------------------
# Console du switch Cisco : envoie une commande et lit la réponse jusqu'au
# retour du prompt ("Switch>" ou "Switch#").
# ---------------------------------------------------------------------------
function Invoke-CommandeSwitch($port, [string]$commande, [int]$delaiSec = 20) {
    $port.DiscardInBuffer()
    $port.Write("$commande`r")
    $tampon = ""
    $limite = (Get-Date).AddSeconds($delaiSec)
    while ((Get-Date) -lt $limite) {
        Start-Sleep -Milliseconds 400
        $tampon += $port.ReadExisting()
        if ($tampon -match '[\r\n][\w.-]+[>#]\s*$') { break }
    }
    return $tampon
}

# Commandes lancées sur le switch. Toutes marchent en mode utilisateur (Switch>),
# pas besoin du mot de passe "enable".
$commandesSwitch = @(
    'show version | include Software|uptime|Model number|System serial',
    'show ip interface brief',
    'show interfaces status',
    'show vlan brief',
    'show mac address-table dynamic',
    'show cdp neighbors'
)

# Script exécuté SUR le serveur (bash). Il affiche des lignes CLE=valeur faciles
# à relire, puis des détails bruts après les lignes "###".
$scriptDistant = @'
DEV=$(ip -4 route show default 2>/dev/null | awk '{print $5; exit}')
GW=$(ip -4 route show default 2>/dev/null | awk '{print $3; exit}')
[ -z "$DEV" ] && DEV=$(ip -4 -o addr show scope global | awk '{print $2; exit}')
echo "NOM=$(hostname)"
echo "INTERFACE=$DEV"
echo "IPV4=$(ip -4 -o addr show dev "$DEV" scope global 2>/dev/null | awk '{print $4; exit}')"
echo "PASSERELLE=$GW"
echo "MAC=$(cat /sys/class/net/$DEV/address 2>/dev/null)"
echo "DNS=$(awk '/^nameserver/{print $2}' /etc/resolv.conf 2>/dev/null | paste -sd, -)"
echo "PROXMOX=$(pveversion 2>/dev/null)"
echo "### ip -br addr"; ip -br addr
echo "### ip route"; ip route
echo "### /etc/network/interfaces"; cat /etc/network/interfaces
echo "### /etc/hosts"; cat /etc/hosts
'@

try {
    # =======================================================================
    Write-Etape "1. Carte Ethernet du PC"
    # =======================================================================
    if ($Interface) {
        $carte = Get-NetAdapter -Name $Interface
    } else {
        # Cartes filaires (802.3) avec un lien, en excluant les cartes virtuelles
        # (VirtualBox, VPN, Hyper-V...) qui se font passer pour de l'Ethernet.
        $cartes = @(Get-NetAdapter | Where-Object {
            $_.Status -eq 'Up' -and $_.PhysicalMediaType -eq '802.3' -and
            $_.InterfaceDescription -notmatch 'Virtual|VPN|Hyper-V|VMware|TAP|Loopback|Tunnel|Tailscale|WireGuard|ZeroTier'
        })
        if ($cartes.Count -eq 0) { throw "Aucune carte Ethernet connectée. Vérifie le câble et la LED du port sur le switch." }
        if ($cartes.Count -gt 1) {
            $cartes | Format-Table Name, InterfaceDescription, Status, LinkSpeed | Out-Host
            throw "Plusieurs cartes Ethernet actives : relance avec -Interface `"Nom de la carte`"."
        }
        $carte = $cartes[0]
    }
    if ($carte.Status -ne 'Up') { throw "La carte '$($carte.Name)' n'a pas de lien (statut : $($carte.Status))." }
    $idx = $carte.ifIndex
    Write-Ok "$($carte.Name) - $($carte.InterfaceDescription) - $($carte.LinkSpeed) - index $idx"

    # Adresse(s) IPv6 lien local du PC lui-même, pour ne pas se "découvrir" soi-même
    $monLL = @(Get-NetIPAddress -InterfaceIndex $idx -AddressFamily IPv6 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -like 'fe80*' } | ForEach-Object { ($_.IPAddress -split '%')[0] })
    if ($monLL.Count -eq 0) {
        throw "IPv6 désactivé sur '$($carte.Name)'. Active 'Protocole Internet version 6' dans les propriétés de la carte (ncpa.cpl)."
    }

    # =======================================================================
    Write-Etape "2. Recherche du serveur sur le câble (IPv6 lien local)"
    # =======================================================================
    # On envoie un ping à ff02::1, l'adresse "toutes les machines du lien".
    # Pour répondre, chaque machine doit d'abord apprendre la MAC du PC : elle se fait
    # alors connaître, et Windows la note dans sa table des voisins (Get-NetNeighbor).
    $voisins = @()
    for ($essai = 1; $essai -le 5; $essai++) {
        ping.exe -6 -n 2 "ff02::1%$idx" | Out-Null
        Start-Sleep -Seconds 2
        $voisins = @(Get-NetNeighbor -InterfaceIndex $idx -AddressFamily IPv6 -ErrorAction SilentlyContinue | Where-Object {
            $_.IPAddress -like 'fe80*' -and
            $_.State -notin @('Unreachable', 'Incomplete') -and
            $monLL -notcontains (($_.IPAddress -split '%')[0])
        })
        if ($voisins.Count -gt 0) { break }
        Write-Alerte "Personne n'a répondu (essai $essai/5). Juste après un branchement, le switch bloque le port ~30 s (STP)..."
        Start-Sleep -Seconds 6
    }

    $candidats = @()
    foreach ($v in $voisins) {
        $candidats += [pscustomobject]@{ Adresse = (($v.IPAddress -split '%')[0]); MAC = $v.LinkLayerAddress; Web = $false; SSH = $false }
    }
    if ($MacServeur) {
        $eui = Get-LienLocalEUI64 $MacServeur
        if (@($candidats | Where-Object { $_.Adresse -eq $eui }).Count -eq 0) {
            $candidats += [pscustomobject]@{ Adresse = $eui; MAC = $MacServeur; Web = $false; SSH = $false }
        }
    }

    # Le serveur Proxmox est celui qui a le port 8006 (web) ou au moins le 22 (SSH) ouvert.
    foreach ($c in $candidats) {
        $c.Web = Test-PortTCP "$($c.Adresse)%$idx" 8006
        $c.SSH = Test-PortTCP "$($c.Adresse)%$idx" 22
    }
    if ($candidats.Count -gt 0) {
        $candidats | Format-Table Adresse, MAC, @{ n = 'Proxmox (8006)'; e = { $_.Web } }, @{ n = 'SSH (22)'; e = { $_.SSH } } | Out-Host
    }

    $serveur = $candidats | Where-Object { $_.Web } | Select-Object -First 1
    if (-not $serveur) { $serveur = $candidats | Where-Object { $_.SSH } | Select-Object -First 1 }

    if ($serveur) {
        $adresseSSH = "$($serveur.Adresse)%$idx"
        Write-Ok "Serveur trouvé : $adresseSSH (MAC $($serveur.MAC))"
    } elseif ($candidats.Count -gt 0) {
        Write-Alerte "Des machines répondent, mais aucune n'a le SSH ni le port 8006 ouvert."
    } else {
        Write-Alerte "Aucune machine trouvée. Serveur éteint ? Mauvais port ? Essaie -MacServeur (MAC vue avec 'show mac address-table')."
    }

    # =======================================================================
    Write-Etape "3. Lecture de la config réseau du serveur (SSH)"
    # =======================================================================
    $infos = @{}
    $detailsServeur = $null
    if ($serveur) {
        if (-not (Get-Command ssh.exe -ErrorAction SilentlyContinue)) {
            throw "ssh.exe introuvable : installe le 'Client OpenSSH' (Paramètres > Applications > Fonctionnalités facultatives)."
        }
        # Le script bash est envoyé encodé en base64 : ça évite tous les problèmes de
        # guillemets entre PowerShell, ssh et bash, et les fins de ligne Windows (CRLF).
        $b64 = [Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes(($scriptDistant -replace "`r", '')))
        Write-Host "    Tape le mot de passe '$Utilisateur' du serveur (rien ne s'affiche pendant la saisie, c'est normal)."
        $sortie = @(& ssh.exe -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 "$Utilisateur@$adresseSSH" "echo $b64 | base64 -d | bash")
        if ($LASTEXITCODE -ne 0 -or $sortie.Count -eq 0) {
            Write-Alerte "Connexion SSH échouée (mauvais mot de passe ? SSH désactivé ?)."
        } else {
            foreach ($ligne in $sortie) {
                if ($ligne -match '^### ') { break }
                if ($ligne -match '^([A-Z0-9]+)=(.*)$') { $infos[$Matches[1]] = $Matches[2].Trim() }
            }
            $detailsServeur = $sortie -join "`r`n"
            Write-Ok "Serveur '$($infos['NOM'])' : $(Get-Valeur $infos['IPV4'])"
        }
    } else {
        Write-Alerte "Étape sautée : serveur non trouvé."
    }

    # IPv4 du serveur et IP proposée pour le PC
    $ipServeur = $null; $prefixe = $null; $conseil = $null
    if ($infos['IPV4'] -match '^(\d+\.\d+\.\d+\.\d+)/(\d+)$') {
        $ipServeur = $Matches[1]
        $prefixe = [int]$Matches[2]
        $conseil = Get-IPPourPC $ipServeur $prefixe
    } elseif ($detailsServeur) {
        Write-Alerte "Le serveur n'a pas d'IPv4 : il faudra en mettre une dans /etc/network/interfaces (bloc vmbr0)."
    }

    # =======================================================================
    Write-Etape "4. Switch Cisco (câble console)"
    # =======================================================================
    $detailsSwitch = $null; $portServeur = $null; $portPC = $null
    if (-not $Cisco) {
        Write-Host "    Étape sautée (ajoute -Cisco pour interroger le switch)."
    } else {
        if (-not $PortCOM) {
            $ports = @([System.IO.Ports.SerialPort]::GetPortNames() | Sort-Object -Unique)
            if ($ports.Count -eq 1) { $PortCOM = $ports[0] }
            elseif ($ports.Count -eq 0) { Write-Alerte "Aucun port COM : le câble console n'est pas branché sur ce PC." }
            else { Write-Alerte "Plusieurs ports COM ($($ports -join ', ')) : relance avec -PortCOM COMx." }
        }
        if ($PortCOM) {
            # 9600 bauds, 8 bits, sans parité, 1 bit de stop : réglage par défaut des consoles Cisco
            $sp = New-Object System.IO.Ports.SerialPort $PortCOM, 9600, ([System.IO.Ports.Parity]::None), 8, ([System.IO.Ports.StopBits]::One)
            $sp.Open()
            try {
                # On "réveille" la console avec Entrée et on regarde dans quel état est le switch
                $etat = ""
                for ($i = 0; $i -lt 3; $i++) { $sp.Write("`r"); Start-Sleep -Milliseconds 1500; $etat += $sp.ReadExisting() }
                if ($etat -match 'initial configuration dialog') {
                    $sp.Write("no`r"); Start-Sleep -Seconds 5; $sp.Write("`r"); Start-Sleep -Seconds 2
                    $etat = $sp.ReadExisting()
                }
                if ($etat -cmatch 'switch:\s*$') {
                    Write-Alerte "Switch bloqué au bootloader (invite 'switch:'). Tape 'boot' dans la console, attends le démarrage et relance."
                } elseif ($etat -match '(Username|Password):\s*$') {
                    Write-Alerte "La console demande un identifiant / mot de passe : demande-le au prof."
                } elseif ($etat -notmatch '[>#]\s*$') {
                    Write-Alerte "Pas de prompt reconnu (switch en cours de démarrage ?). Reçu : $($etat.Trim())"
                } else {
                    if ($etat -match '\(config[^)]*\)#\s*$') { $sp.Write("end`r"); Start-Sleep -Seconds 1 }
                    $null = Invoke-CommandeSwitch $sp 'terminal length 0'   # pas de pagination "--More--"
                    $blocs = foreach ($cmd in $commandesSwitch) {
                        Write-Host "    $cmd"
                        "### $cmd"
                        Invoke-CommandeSwitch $sp $cmd
                    }
                    $detailsSwitch = $blocs -join "`r`n"
                    $macSrv = if ($infos['MAC']) { $infos['MAC'] } elseif ($serveur) { $serveur.MAC } else { $null }
                    $portServeur = Find-PortSwitch $detailsSwitch $macSrv
                    $portPC = Find-PortSwitch $detailsSwitch $carte.MacAddress
                    Write-Ok "Serveur sur le port $(Get-Valeur $portServeur), PC sur le port $(Get-Valeur $portPC)"
                }
            } finally { $sp.Close() }
        }
    }

    # =======================================================================
    Write-Etape "5. IP du PC"
    # =======================================================================
    if (-not $conseil) {
        Write-Host "    Pas d'IP à proposer (IPv4 du serveur inconnue)."
    } else {
        Write-Host "    IP conseillée : $($conseil.IP) / $($conseil.Masque) (sans passerelle)"
        $ipsPC = @(Get-NetIPAddress -InterfaceIndex $idx -AddressFamily IPv4 -ErrorAction SilentlyContinue | ForEach-Object { $_.IPAddress })
        $dejaBon = @($ipsPC | Where-Object { ((ConvertTo-Nombre $_) -band (Get-Masque $prefixe)) -eq (ConvertTo-Nombre $conseil.Reseau) }).Count -gt 0
        if ($dejaBon) {
            Write-Ok "Le PC est déjà dans le bon sous-réseau ($($ipsPC -join ', '))."
        } elseif ($ConfigurerPC) {
            $estAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
            if (-not $estAdmin) {
                Write-Alerte "Il faut lancer PowerShell en administrateur pour -ConfigurerPC."
            } else {
                # IP fixe, sans passerelle : on ne touche pas à la connexion Wi-Fi du PC
                Set-NetIPInterface -InterfaceIndex $idx -AddressFamily IPv4 -Dhcp Disabled
                Get-NetIPAddress -InterfaceIndex $idx -AddressFamily IPv4 -ErrorAction SilentlyContinue | Remove-NetIPAddress -Confirm:$false
                $null = New-NetIPAddress -InterfaceIndex $idx -IPAddress $conseil.IP -PrefixLength $prefixe
                Start-Sleep -Seconds 3
                $etatIP = (Get-NetIPAddress -InterfaceIndex $idx -IPAddress $conseil.IP -ErrorAction SilentlyContinue).AddressState
                if ($etatIP -eq 'Duplicate') { Write-Alerte "$($conseil.IP) est déjà utilisée par une autre machine : choisis-en une autre à la main." }
                elseif (Test-Connection -ComputerName $ipServeur -Count 2 -Quiet) { Write-Ok "PC configuré en $($conseil.IP), le serveur répond au ping." }
                else { Write-Alerte "PC configuré en $($conseil.IP), mais le serveur ne répond pas au ping." }
            }
        } else {
            Write-Host "    Pour l'appliquer : relance avec -ConfigurerPC, ou en cmd administrateur :"
            Write-Host "    netsh interface ip set address `"$($carte.Name)`" static $($conseil.IP) $($conseil.Masque)"
        }
    }

    # =======================================================================
    Write-Etape "6. Rapport"
    # =======================================================================
    $nom = if ($infos['NOM']) { $infos['NOM'] } else { 'POD_inconnu' }
    $dossier = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
    $fichier = Join-Path $dossier ("{0}_reseau_{1}.txt" -f $nom, (Get-Date -Format 'yyyy-MM-dd_HH-mm'))
    $urlWeb = if ($ipServeur) { "https://${ipServeur}:8006" } else { "(pas d'IPv4 connue)" }
    $masqueTxt = if ($prefixe) { " (masque $(ConvertTo-IP (Get-Masque $prefixe)))" } else { "" }
    $autres = @($candidats | Where-Object { $_ -ne $serveur } | ForEach-Object { "  $($_.Adresse)  MAC $($_.MAC)" })
    if ($autres.Count -eq 0) { $autres = @("  (aucune)") }

    $rapport = @(
        "===== Infos réseau - $nom - $(Get-Date -Format 'dd/MM/yyyy HH:mm') ====="
        ""
        "[SERVEUR]"
        "  Nom              : $nom"
        "  Proxmox          : $(Get-Valeur $infos['PROXMOX'])"
        "  Interface        : $(Get-Valeur $infos['INTERFACE'])"
        "  IPv4             : $(Get-Valeur $infos['IPV4'])$masqueTxt"
        "  Passerelle       : $(Get-Valeur $infos['PASSERELLE'])"
        "  DNS              : $(Get-Valeur $infos['DNS'])"
        "  MAC              : $(Get-Valeur $infos['MAC'])"
        "  IPv6 lien local  : $(if ($serveur) { $serveur.Adresse } else { '(aucun)' })"
        "  Port du switch   : $(Get-Valeur $portServeur)"
        "  Interface web    : $urlWeb"
        ""
        "[PC D'ADMINISTRATION]"
        "  Carte            : $($carte.Name) - $($carte.InterfaceDescription)"
        "  MAC              : $($carte.MacAddress)"
        "  Port du switch   : $(Get-Valeur $portPC)"
        "  IP à utiliser    : $(if ($conseil) { "$($conseil.IP) / $($conseil.Masque) (sans passerelle)" } else { '(inconnue)' })"
        ""
        "[AUTRES MACHINES VUES EN IPv6 SUR LE CÂBLE]"
        $autres
        ""
        "===== Détails bruts du serveur ====="
        (Get-Valeur $detailsServeur)
        ""
        "===== Détails bruts du switch ====="
        (Get-Valeur $detailsSwitch)
    )
    $rapport | Out-File -FilePath $fichier -Encoding UTF8
    Write-Ok "Rapport écrit : $fichier"

    Write-Host ""
    Write-Host "  Serveur       : $nom - $(Get-Valeur $infos['IPV4'])" -ForegroundColor White
    Write-Host "  Interface web : $urlWeb" -ForegroundColor White
    if ($conseil) { Write-Host "  IP pour le PC : $($conseil.IP) / $($conseil.Masque)" -ForegroundColor White }
}
catch {
    Write-Host "`n[ERREUR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
