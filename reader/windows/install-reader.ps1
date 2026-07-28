[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ListenHost,
    [string]$InstallDir = "$env:ProgramData\NSGlamourReader",
    [int]$ListenPort = 18770,
    [int]$DevToolsPort = 18765
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Grant-BatchLogonRight {
    param([Parameter(Mandatory = $true)][string]$Account)

    $sid = (New-Object Security.Principal.NTAccount($Account)).Translate(
        [Security.Principal.SecurityIdentifier]
    ).Value
    $suffix = [Guid]::NewGuid().ToString("N")
    $policyPath = Join-Path $env:TEMP "nsglamour-reader-rights-$suffix.inf"
    $databasePath = Join-Path $env:TEMP "nsglamour-reader-rights-$suffix.sdb"
    try {
        & secedit.exe /export /cfg $policyPath /areas USER_RIGHTS /quiet | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Unable to export local user-rights policy"
        }

        $lines = New-Object 'Collections.Generic.List[string]'
        $lines.AddRange([IO.File]::ReadAllLines($policyPath, [Text.Encoding]::Unicode))
        $entry = "*$sid"
        $updated = $false
        for ($index = 0; $index -lt $lines.Count; $index += 1) {
            if ($lines[$index] -notmatch '^SeBatchLogonRight\s*=') {
                continue
            }
            $values = @(
                $lines[$index].Split('=', 2)[1].Split(',') |
                    ForEach-Object { $_.Trim() } |
                    Where-Object { $_ }
            )
            if ($entry -notin $values) {
                $values += $entry
            }
            $lines[$index] = "SeBatchLogonRight = " + ($values -join ',')
            $updated = $true
            break
        }
        if (-not $updated) {
            $sectionIndex = $lines.IndexOf('[Privilege Rights]')
            if ($sectionIndex -lt 0) {
                throw "Privilege Rights section is missing from local policy"
            }
            $insertIndex = $sectionIndex + 1
            while ($insertIndex -lt $lines.Count -and $lines[$insertIndex] -notmatch '^\[') {
                $insertIndex += 1
            }
            $lines.Insert($insertIndex, "SeBatchLogonRight = $entry")
        }

        [IO.File]::WriteAllLines($policyPath, $lines, [Text.Encoding]::Unicode)
        & secedit.exe /configure /db $databasePath /cfg $policyPath /areas USER_RIGHTS /quiet | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Unable to apply local user-rights policy"
        }
    } finally {
        Remove-Item -LiteralPath $policyPath, $databasePath -Force -ErrorAction SilentlyContinue
    }
}

$nodePath = Join-Path $InstallDir "node.exe"
$readerPath = Join-Path $InstallDir "risingstones-reader.js"
$tokenPath = Join-Path $InstallDir "reader-token.txt"
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$profileDir = Join-Path $InstallDir "edge-profile"
$configPath = Join-Path $InstallDir "config.json"
$serviceUser = "NSGlamourReaderSvc"
$serviceAccount = "$env:COMPUTERNAME\$serviceUser"

foreach ($required in @($nodePath, $readerPath, $tokenPath, $edgePath)) {
    if (-not (Test-Path -LiteralPath $required)) {
        throw "Required file not found: $required"
    }
}

$config = [ordered]@{
    listenHost = $ListenHost
    listenPort = $ListenPort
    devToolsPort = $DevToolsPort
    edgePath = $edgePath
    profileDir = $profileDir
    tokenFile = $tokenPath
    qrPath = (Join-Path $InstallDir "login-qr.png")
    logPath = (Join-Path $InstallDir "reader.log")
}
$utf8NoBom = New-Object Text.UTF8Encoding($false)
[IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 4), $utf8NoBom)

$passwordBytes = New-Object byte[] 32
$random = [Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $random.GetBytes($passwordBytes)
} finally {
    $random.Dispose()
}
$servicePassword = [Convert]::ToBase64String($passwordBytes) + "!aA1"
$securePassword = ConvertTo-SecureString $servicePassword -AsPlainText -Force
$existingUser = Get-LocalUser -Name $serviceUser -ErrorAction SilentlyContinue
if ($existingUser) {
    Set-LocalUser -Name $serviceUser -Password $securePassword
} else {
    New-LocalUser `
        -Name $serviceUser `
        -Password $securePassword `
        -AccountNeverExpires `
        -PasswordNeverExpires `
        -Description "NSGlamour Rising Stones reader service account" | Out-Null
}
Grant-BatchLogonRight -Account $serviceAccount

& icacls.exe $InstallDir /grant "${serviceAccount}:(OI)(CI)M" /T /C | Out-Null
& icacls.exe $tokenPath /inheritance:r | Out-Null
& icacls.exe $tokenPath /grant:r '*S-1-5-32-544:F' '*S-1-5-18:F' "${serviceAccount}:R" | Out-Null

$taskName = "NSGlamour Rising Stones Reader"
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}
$action = New-ScheduledTaskAction -Execute $nodePath -Argument ('"{0}"' -f $readerPath) -WorkingDirectory $InstallDir
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -User $serviceAccount `
    -Password $servicePassword `
    -RunLevel Limited | Out-Null
$servicePassword = $null

Get-NetFirewallRule -Name "NSGlamourReader-Tailscale" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule `
    -Name "NSGlamourReader-Tailscale" `
    -DisplayName "NSGlamour reader via Tailscale" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $ListenPort `
    -RemoteAddress "100.64.0.0/10" `
    -Action Allow | Out-Null

Start-ScheduledTask -TaskName $taskName
Start-Sleep -Seconds 3
$response = Invoke-RestMethod -Uri ("http://{0}:{1}/health" -f $ListenHost, $ListenPort) -TimeoutSec 10
if (-not $response.ok) {
    throw "Reader health check failed"
}
Write-Output "Reader installed and healthy."
