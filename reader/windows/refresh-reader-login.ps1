[CmdletBinding()]
param(
    [string]$ReaderUrl = "http://100.64.65.72:18770",
    [string]$TokenFile = (Join-Path $PSScriptRoot "..\..\.runtime\risingstones-reader-token"),
    [int]$TimeoutSeconds = 180
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$resolvedTokenFile = (Resolve-Path -LiteralPath $TokenFile).Path
$token = [IO.File]::ReadAllText($resolvedTokenFile, [Text.Encoding]::UTF8).Trim()
if (-not $token) {
    throw "Reader token file is empty: $resolvedTokenFile"
}

$headers = @{ Authorization = "Bearer $token" }
$baseUrl = $ReaderUrl.TrimEnd('/')
$runtimeDir = Split-Path -Parent $resolvedTokenFile
$qrPath = Join-Path $runtimeDir "risingstones-login-qr.png"

$start = Invoke-RestMethod `
    -Method Post `
    -Uri "$baseUrl/v1/login/start" `
    -Headers $headers `
    -ContentType "application/json" `
    -Body "{}" `
    -TimeoutSec 90
if (-not $start.qrReady) {
    throw "Reader did not produce a login QR image"
}

Invoke-WebRequest `
    -UseBasicParsing `
    -Uri "$baseUrl/v1/login/qr" `
    -Headers $headers `
    -OutFile $qrPath `
    -TimeoutSec 30
Start-Process -FilePath $qrPath
Write-Output "QR image opened. Scan it in the Rising Stones app and confirm."

$deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
while ([DateTime]::UtcNow -lt $deadline) {
    Start-Sleep -Seconds 2
    $status = Invoke-RestMethod `
        -Method Get `
        -Uri "$baseUrl/v1/login/status" `
        -Headers $headers `
        -TimeoutSec 30
    if ($status.loggedIn) {
        Write-Output "Rising Stones login refreshed. Reader returned to headless mode."
        exit 0
    }
}

throw "Timed out waiting for QR confirmation. Run this script again for a new QR image."
